import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Droplets, Gauge, AlertTriangle, Container, ToggleLeft, Bell, RefreshCw,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageTitle from "../components/PageTitle";
import StatCard from "../components/StatCard";
import { getLive, getSeries, getAlerts, LiveData, Series } from "../lib/api";
import { REFRESH_INTERVAL } from "../config";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChartCard({ title, color, data, dataKey, unit }: { title: string; color: string; data: any[]; dataKey: string; unit: string }) {
  const last = data[data.length - 1];
  return (
    <div className="card">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-header">{title}</h3>
          <span className="text-[11px] uppercase text-text-muted">Last hour</span>
        </div>
        <div className="rounded-xl p-3" style={{ background: "var(--color-bg-secondary)" }}>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={fmtTime} tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", color: "var(--color-text-primary)" }}
                  labelFormatter={(v) => fmtTime(v as string)}
                  formatter={(v: any) => [<span style={{ color: "#E8621A", fontWeight: 700 }}>{`${v} ${unit}`}</span>, ""]}
                />
                <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#grad-${dataKey})`} animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {last && (
            <div className="text-[11px] text-text-muted mt-1">
              Latest: <span style={{ color: "#E8621A", fontWeight: 700 }}>{last[dataKey]} {unit}</span> @ {fmtTime(last.t)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const statItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const [live, setLive] = useState<LiveData | null>(null);
  const [online, setOnline] = useState(false);
  const [series, setSeries] = useState<Series>([]);
  const [updated, setUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const [activeAlerts, setActiveAlerts] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setRefreshing(true);
      const [l, s, alerts] = await Promise.all([getLive(), getSeries(60), getAlerts()]);
      if (!mounted) return;
      setLive(l.data); setOnline(l.online);
      setSeries(s);
      setActiveAlerts(alerts.filter(a => !a.acknowledged).length);
      setUpdated(new Date());
      setRefreshing(false);
    };
    load();
    const id = setInterval(load, REFRESH_INTERVAL);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <>
      <PageTitle
        title="IoT Water Monitor"
        subtitle="Zone A — Prototype Water Loop"
        right={
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${online ? "animate-pulse-dot" : ""}`}
                style={{ background: online ? "#059669" : "#DC2626", boxShadow: online ? "0 0 8px rgba(5,150,105,0.5)" : undefined }}
              />
              <span className="text-[12px] font-medium" style={{ color: online ? "var(--color-success)" : "var(--color-danger)" }}>
                {online ? "Online" : "Offline (mock data)"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <RefreshCw size={11} className={refreshing ? "animate-spin-slow" : ""} style={{ color: "#E8621A" }} />
              Refreshing every {REFRESH_INTERVAL / 1000}s · Updated {updated.toLocaleTimeString()}
            </div>
          </div>
        }
      />

      {live?.leak_detected && (
        <div
          className="leak-banner mb-5 p-4 rounded-xl flex items-center gap-3 animate-pulse-soft"
          style={{ background: "linear-gradient(90deg, #FEE2E2, #FEF2F2)", border: "1px solid #FCA5A5", borderLeft: "4px solid #DC2626" }}
        >
          <motion.div
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "inline-flex" }}
          >
            <AlertTriangle size={22} style={{ color: "var(--color-danger)" }} />
          </motion.div>
          <div className="font-bold text-[14px]" style={{ color: "var(--color-danger)" }}>
            LEAK DETECTED — Solenoid valve closed automatically
          </div>
        </div>
      )}

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6"
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={statItem} transition={{ duration: 0.35, ease: "easeOut" }}>
          <StatCard label="Flow Rate" value={live?.flow_lpm} unit="L/min" Icon={Droplets}
            state={(live?.flow_lpm ?? 0) > 8 ? "warning" : "normal"} decimals={2}
            footer={<div className="text-[11px] text-text-muted">Updated {updated.toLocaleTimeString()}</div>} />
        </motion.div>
        <motion.div variants={statItem} transition={{ duration: 0.35, ease: "easeOut" }}>
          <StatCard label="Pressure" value={live?.pressure_kpa} unit="kPa" Icon={Gauge}
            state={(live?.pressure_kpa ?? 100) < 40 ? "warning" : "normal"}
            footer={<div className="text-[11px] text-text-muted">Last reading</div>} />
        </motion.div>
        <motion.div variants={statItem} transition={{ duration: 0.35, ease: "easeOut" }}>
          <StatCard label="Leak Sensor" textValue={live?.leak_detected ? "WET" : "DRY"} Icon={AlertTriangle}
            state={live?.leak_detected ? "critical" : "normal"}
            footer={<div className="text-[11px] text-text-muted">Conductive probe</div>} />
        </motion.div>
        <motion.div variants={statItem} transition={{ duration: 0.35, ease: "easeOut" }}>
          <StatCard label="Reservoir" value={live?.tank_pct && live.tank_pct > 0 ? live.tank_pct : undefined} unit="%" Icon={Container}
            textValue={!live?.tank_pct || live.tank_pct === 0 ? "N/A" : undefined}
            state={(live?.tank_pct ?? 100) < 20 ? "warning" : "normal"}
            footer={
              <div className="w-full h-1.5 rounded-full" style={{ background: "var(--color-accent-blue-light)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${live?.tank_pct && live.tank_pct > 0 ? live.tank_pct : 0}%`, background: "var(--color-accent-blue)" }} />
              </div>
            } />
        </motion.div>
        <motion.div variants={statItem} transition={{ duration: 0.35, ease: "easeOut" }}>
          <StatCard label="Valve Status" textValue={live?.valve_state === "open" ? "OPEN" : "CLOSED"} Icon={ToggleLeft}
            state={live?.valve_state === "closed" ? "critical" : "normal"}
            footer={
              <div className="text-[11px]" style={{ color: live?.valve_state === "open" ? "var(--color-success)" : "var(--color-danger)" }}>
                {live?.valve_state === "open" ? "Flowing" : "Shut off"}
              </div>
            } />
        </motion.div>
        <motion.div variants={statItem} transition={{ duration: 0.35, ease: "easeOut" }}>
          <StatCard label="Active Alerts" value={activeAlerts} Icon={Bell}
            state={activeAlerts > 0 ? "warning" : "normal"} decimals={0}
            footer={<div className="text-[11px] text-text-muted">From event log</div>} />
        </motion.div>
      </motion.div>

      <div className="mb-3"><h2 className="section-header">Live Sensor Data</h2></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <ChartCard title="Flow Rate — Last Hour" color="#2B6CB0" data={series} dataKey="flow" unit="L/min" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <ChartCard title="Pipe Pressure — Last Hour" color="#1E4A8C" data={series} dataKey="pressure" unit="kPa" />
        </motion.div>
      </div>
    </>
  );
}
