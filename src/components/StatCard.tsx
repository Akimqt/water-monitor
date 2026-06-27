import { ReactNode } from "react";
import { motion } from "motion/react";
import { useCountUp } from "../hooks/useCountUp";

type State = "normal" | "warning" | "critical";

export default function StatCard({
  label,
  value,
  unit,
  Icon,
  state = "normal",
  footer,
  textValue,
  decimals = 1,
}: {
  label: string;
  value?: number;
  unit?: string;
  Icon: any;
  state?: State;
  footer?: ReactNode;
  textValue?: string;
  decimals?: number;
}) {
  const n = useCountUp(value ?? 0);
  const borderClass =
    state === "warning"
      ? "border-cta-light"
      : state === "critical"
      ? "border-[#FCA5A5]"
      : "border-border-color";
  const iconBg =
    state === "warning" ? "var(--color-cta-pale)" : state === "critical" ? "var(--color-danger-pale)" : "var(--color-accent-blue-pale)";
  const iconColor =
    state === "warning" ? "#E8621A" : state === "critical" ? "var(--color-danger)" : "#2B6CB0";
  return (
    <motion.div
      className={`card ${borderClass} animate-fade-up`}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted">{label}</div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: iconBg }}>
            <Icon size={20} style={{ color: iconColor }} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <motion.div
            key={Math.round((value ?? 0) * 10)}
            className="text-[32px] font-bold leading-none text-text-primary"
            animate={{ opacity: [0, 1], y: [-5, 0] }}
            transition={{ duration: 0.22 }}
          >
            {textValue ?? (value !== undefined ? n.toFixed(decimals) : "—")}
          </motion.div>
          {unit && <div className="text-[13px] text-text-muted">{unit}</div>}
        </div>
      </div>
      {footer && (
        <div className="px-5 py-2.5 border-t border-border-color" style={{ background: "var(--color-bg-secondary)" }}>
          {footer}
        </div>
      )}
    </motion.div>
  );
}
