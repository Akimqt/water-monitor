import { useEffect, useState } from "react";
import { Droplets, TrendingUp, Activity, AlertTriangle, Banknote } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageTitle from "../components/PageTitle";
import StatCard from "../components/StatCard";
import DatePicker from "../components/DatePicker";
import { DailyReport, getDailyReport } from "../lib/api";

export default function Reports() {
  const [date, setDate] = useState(new Date());
  const [report, setReport] = useState<DailyReport | null>(null);

  useEffect(() => {
    getDailyReport(date.toISOString().slice(0, 10)).then(setReport);
  }, [date]);

  // Use cost_php from backend if available, fallback to local calc
  const cost = report ? (report.cost_php > 0 ? report.cost_php : (report.total_liters / 1000) * 20) : 0;

  return (
    <>
      <PageTitle title="Daily Consumption Report" subtitle="Aggregated water usage and cost"
        right={<DatePicker value={date} onChange={setDate} />} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Consumption" value={report?.total_liters ?? 0} unit="L" Icon={Droplets} decimals={0} />
        <StatCard label="Peak Flow" value={report?.peak_flow ?? 0} unit="L/min" Icon={TrendingUp} decimals={2} />
        <StatCard label="Avg Pressure" value={report?.avg_pressure ?? 0} unit="kPa" Icon={Activity} />
        <StatCard label="Leak Events" value={report?.leak_events ?? 0} Icon={AlertTriangle}
          state={(report?.leak_events ?? 0) > 0 ? "critical" : "normal"} decimals={0} />
      </div>

      <div
        className="relative overflow-hidden rounded-2xl mb-6 border"
        style={{
          background: "linear-gradient(135deg, var(--color-cta-pale) 0%, var(--color-bg-card) 55%)",
          borderColor: "var(--color-cta-light)",
          borderTop: "3px solid #E8621A",
          boxShadow: "0 1px 3px rgba(30,74,140,0.08), 0 4px 16px rgba(30,74,140,0.06)",
        }}
      >
        <div
          className="absolute right-6 top-1/2 -translate-y-1/2 select-none pointer-events-none font-bold"
          style={{ fontSize: 120, color: "rgba(232,98,26,0.06)", lineHeight: 1 }}
        >₱</div>
        <div className="p-6 flex items-center gap-5 relative">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--color-cta-pale)" }}>
            <Banknote size={26} style={{ color: "#E8621A" }} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] font-semibold" style={{ color: "#E8621A" }}>
              Estimated Water Cost
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[36px] font-bold leading-none" style={{ color: "#E8621A" }}>₱</span>
              <span className="text-[48px] font-bold leading-none text-text-primary">{cost.toFixed(2)}</span>
            </div>
            <div className="text-[11px] text-text-muted mt-1">Based on ₱20.00 per cubic meter (MWSS Rate)</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-5">
          <h3 className="section-header mb-4">7-Day Consumption History</h3>
          <div className="rounded-xl p-3" style={{ background: "var(--color-bg-secondary)" }}>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={report?.history ?? []} margin={{ top: 18, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString([], { weekday: "short" })}
                    tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: "rgba(232,98,26,0.08)" }}
                    contentStyle={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 10, color: "var(--color-text-primary)" }}
                    formatter={(v: any) => [<span style={{ color: "#E8621A", fontWeight: 700 }}>{v} L</span>, "Consumption"]}
                    labelFormatter={(v) => new Date(v as string).toLocaleDateString()}
                  />
                  <Bar dataKey="liters" fill="#E8621A" radius={[8, 8, 0, 0]} animationDuration={900}
                    label={{ position: "top", fill: "var(--color-text-secondary)", fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
