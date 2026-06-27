import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageTitle from "../components/PageTitle";
import { getLive, getSeries, Series } from "../lib/api";
import { REFRESH_INTERVAL } from "../config";

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="card">
      <div className="p-4">
        <div className="text-[11px] uppercase tracking-[0.08em] text-text-muted">{label}</div>
        <div className="mt-2 flex items-baseline gap-1">
          <div className="text-[26px] font-bold text-text-primary">{value}</div>
          {unit && <div className="text-[12px] text-text-muted">{unit}</div>}
        </div>
      </div>
    </div>
  );
}

export default function Zone() {
  const [series, setSeries] = useState<Series>([]);
  const [hour, setHour] = useState<Series>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [s, h, _l] = await Promise.all([getSeries(1440), getSeries(60), getLive()]);
      if (!mounted) return;
      setSeries(s); setHour(h);
    };
    load();
    const id = setInterval(load, REFRESH_INTERVAL);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const stats = useMemo(() => {
    if (!hour.length) return null;
    const flows = hour.map((x) => x.flow);
    return {
      current: flows[flows.length - 1].toFixed(2),
      min: Math.min(...flows).toFixed(2),
      max: Math.max(...flows).toFixed(2),
      avg: (flows.reduce((a, b) => a + b, 0) / flows.length).toFixed(2),
    };
  }, [hour]);

  const tableRows = [...series].slice(-20).reverse();

  return (
    <>
      <PageTitle title="Zone A — Detail View" subtitle="Detailed sensor history and readings" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Current" value={stats?.current ?? "—"} unit="L/min" />
        <Stat label="Min" value={stats?.min ?? "—"} unit="L/min" />
        <Stat label="Max" value={stats?.max ?? "—"} unit="L/min" />
        <Stat label="Avg" value={stats?.avg ?? "—"} unit="L/min" />
      </div>

      {[
        { title: "Flow Rate — Last 24 Hours", key: "flow", color: "#2B6CB0", threshold: 8, label: "SPIKE THRESHOLD", unit: "L/min" },
        { title: "Pipe Pressure — Last 24 Hours", key: "pressure", color: "#1E4A8C", threshold: 40, label: "MIN SAFE PRESSURE", unit: "kPa" },
      ].map((cfg) => (
        <div key={cfg.key} className="card mb-5">
          <div className="p-5">
            <h3 className="section-header mb-3">{cfg.title}</h3>
            <div className="rounded-xl p-3" style={{ background: "var(--color-bg-secondary)" }}>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <AreaChart data={series} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`g-${cfg.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={cfg.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={cfg.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                    <XAxis dataKey="t" tickFormatter={fmt} tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 10, color: "var(--color-text-primary)" }}
                      labelFormatter={(v) => fmt(v as string)}
                      formatter={(v: any) => [<span style={{ color: "#E8621A", fontWeight: 700 }}>{v} {cfg.unit}</span>, ""]}
                    />
                    <ReferenceLine y={cfg.threshold} stroke="var(--color-danger)" strokeDasharray="6 4"
                      label={{ value: cfg.label, fill: "var(--color-danger)", fontSize: 11, position: "insideTopRight" }} />
                    <Area type="monotone" dataKey={cfg.key} stroke={cfg.color} strokeWidth={2.5} fill={`url(#g-${cfg.key})`} animationDuration={1200} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="card">
        <div className="p-5">
          <h3 className="section-header mb-4">Recent Readings</h3>
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted" style={{ background: "var(--color-bg-secondary)" }}>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Flow (L/min)</th>
                  <th className="px-4 py-3">Pressure (kPa)</th>
                  <th className="px-4 py-3">Leak</th>
                  <th className="px-4 py-3">Valve</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r, i) => (
                  <tr key={i} className="transition-colors hover:bg-bg-secondary"
                      style={{ background: i % 2 === 0 ? "var(--color-bg-card)" : "var(--color-bg-secondary)" }}>
                    <td className="px-4 py-2.5 text-text-primary">{fmt(r.t)}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{r.flow.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{r.pressure.toFixed(1)}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: r.leak ? "#FEF2F2" : "#F0FDF4", color: r.leak ? "#DC2626" : "#059669" }}>
                        {r.leak ? "WET" : "DRY"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[11px] font-semibold" style={{ color: r.valve === "open" ? "var(--color-success)" : "var(--color-danger)" }}>
                        {r.valve.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
