import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Toast = { id: number; kind: "success" | "error" | "info"; message: string };
type Ctx = { push: (kind: Toast["kind"], message: string) => void };

const ToastCtx = createContext<Ctx>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((kind: Toast["kind"], message: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 72, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 72, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
            >
              <ToastItem t={t} onClose={() => setItems((p) => p.filter((x) => x.id !== t.id))} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ t, onClose }: { t: Toast; onClose: () => void }) {
  const [progress, setProgress] = useState(100);
  useEffect(() => {
    const start = Date.now();
    const i = setInterval(() => {
      const p = Math.max(0, 100 - ((Date.now() - start) / 3000) * 100);
      setProgress(p);
    }, 50);
    return () => clearInterval(i);
  }, []);

  const Icon = t.kind === "success" ? CheckCircle2 : AlertCircle;
  const accent = t.kind === "success" ? "var(--color-success)" : t.kind === "error" ? "var(--color-danger)" : "var(--color-cta)";
  return (
    <div
      className="bg-bg-card rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--color-border)", boxShadow: "0 8px 32px rgba(30,74,140,0.14)", borderLeft: `4px solid ${accent}` }}
    >
      <div className="flex items-start gap-3 p-3 pr-2 bg-cta-pale/40">
        <Icon size={18} style={{ color: accent, flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1 text-sm text-text-primary">{t.message}</div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X size={16} />
        </button>
      </div>
      <div className="h-[3px] bg-accent-blue-pale">
        <div className="h-full transition-all" style={{ width: `${progress}%`, background: accent }} />
      </div>
    </div>
  );
}
