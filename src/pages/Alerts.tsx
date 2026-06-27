import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, Droplets, TrendingDown, TrendingUp, ScanLine, Moon, CheckCircle2 } from "lucide-react";
import PageTitle from "../components/PageTitle";
import { ackAlert, Alert, getAlerts } from "../lib/api";
import { useToast } from "../components/Toast";

const ICONS: Record<Alert["type"], any> = {
  leak: Droplets,
  pressure_drop: TrendingDown,
  flow_spike: TrendingUp,
  anomaly_detected: ScanLine,
  night_flow: Moon,
};
const TYPE_LABEL: Record<Alert["type"], string> = {
  leak: "Leak",
  pressure_drop: "Pressure Drop",
  flow_spike: "Flow Spike",
  anomaly_detected: "Anomaly Detected",
  night_flow: "Night Flow",
};

function SeverityBadge({ s }: { s: Alert["severity"] }) {
  const map: Record<Alert["severity"], { bg: string; color: string; border?: string }> = {
    CRITICAL: { bg: "#DC2626", color: "#fff" },
    HIGH: { bg: "#D97706", color: "#fff" },
    MEDIUM: { bg: "var(--color-accent-blue-pale)", color: "var(--color-accent-blue)", border: "var(--color-accent-blue-light)" },
    LOW: { bg: "var(--color-bg-secondary)", color: "var(--color-text-secondary)", border: "var(--color-border)" },
  };
  const c = map[s];
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{ background: c.bg, color: c.color, border: c.border ? `1px solid ${c.border}` : undefined }}>{s}</span>
  );
}

const rowVariants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0 },
};

export default function Alerts({ onChange }: { onChange: (n: number) => void }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tab, setTab] = useState<"all" | "active" | "ack">("all");
  const toast = useToast();

  useEffect(() => {
    getAlerts().then((a) => { setAlerts(a); onChange(a.filter((x) => !x.acknowledged).length); });
  }, [onChange]);

  const filtered = useMemo(() => {
    if (tab === "active") return alerts.filter((a) => !a.acknowledged);
    if (tab === "ack") return alerts.filter((a) => a.acknowledged);
    return alerts;
  }, [alerts, tab]);

  const activeCount = alerts.filter((a) => !a.acknowledged).length;

  const handleAck = async (id: string) => {
    await ackAlert(id);
    setAlerts((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a));
      onChange(next.filter((x) => !x.acknowledged).length);
      return next;
    });
    toast.push("success", "Alert acknowledged");
  };

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "ack", label: "Acknowledged" },
  ];
  const tabIdx = tabs.findIndex((t) => t.id === tab);

  return (
    <>
      <PageTitle title="Alert History" subtitle="Sensor events and threshold violations"
        right={
          activeCount > 0 ? (
            <span className="px-3 py-1.5 rounded-full text-[12px] font-bold text-white" style={{ background: "#E8621A" }}>
              {activeCount} Active
            </span>
          ) : null
        }
      />

      <div className="relative inline-flex p-1 mb-5 rounded-full border" style={{ background: "var(--color-accent-blue-pale)", borderColor: "var(--color-border)" }}>
        <div
          className="absolute top-1 bottom-1 rounded-full transition-all duration-300"
          style={{
            background: "#E8621A",
            width: `calc((100% - 8px) / 3)`,
            left: `calc(4px + (100% - 8px) / 3 * ${tabIdx})`,
            boxShadow: "0 2px 8px rgba(232,98,26,0.25)",
          }}
        />
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative z-10 px-5 py-2 text-[13px] font-semibold transition-colors`}
            style={{ color: tab === t.id ? "#fff" : "var(--color-text-secondary)", minWidth: 110 }}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}>
          <CheckCircle size={64} className="mx-auto" style={{ color: "var(--color-success)" }} />
          <div className="mt-4 text-[18px] font-bold text-text-primary">No alerts</div>
          <div className="text-sm text-text-secondary">System operating normally</div>
        </div>
      ) : (
        <div className="card">
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted" style={{ background: "var(--color-bg-secondary)" }}>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <motion.tbody
                variants={{ show: { transition: { staggerChildren: 0.055 } } }}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence>
                  {filtered.map((a, i) => {
                    const Icon = ICONS[a.type];
                    const sevColor = a.severity === "CRITICAL" ? "var(--color-danger)" : a.severity === "HIGH" ? "var(--color-warning)" : "var(--color-accent-blue)";
                    return (
                      <motion.tr
                        key={a.id}
                        variants={rowVariants}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
                        className="transition-colors hover:bg-bg-secondary"
                        style={{ background: i % 2 === 0 ? "var(--color-bg-card)" : "var(--color-bg-secondary)" }}
                      >
                        <td className="px-4 py-3"><SeverityBadge s={a.severity} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-text-primary font-medium">
                            <Icon size={16} style={{ color: sevColor }} />
                            {TYPE_LABEL[a.type]}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{a.message}</td>
                        <td className="px-4 py-3 text-text-muted text-[12px]">{new Date(a.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          {a.acknowledged ? (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--color-success)" }}>
                              <CheckCircle2 size={14} /> Resolved
                            </span>
                          ) : (
                            <button onClick={() => handleAck(a.id)}
                              className="text-[12px] font-semibold rounded-lg px-3 py-1.5 border transition-colors"
                              style={{ borderColor: "#E8621A", color: "#E8621A" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#E8621A"; e.currentTarget.style.color = "#fff"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "#E8621A"; }}
                            >
                              ACK
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
