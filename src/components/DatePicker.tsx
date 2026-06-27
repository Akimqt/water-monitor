import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

function fmt(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function fmtShort(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DatePicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const [pending, setPending] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    setPending(value);
    setView(new Date(value.getFullYear(), value.getMonth(), 1));
  }, [value]);

  const today = new Date();
  const monthLabel = view.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDow = view.getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const prevDays = firstDow;
  const cells: { d: Date; outside: boolean }[] = [];
  const prevMonthLast = new Date(view.getFullYear(), view.getMonth(), 0).getDate();
  for (let i = prevDays - 1; i >= 0; i--) {
    cells.push({ d: new Date(view.getFullYear(), view.getMonth() - 1, prevMonthLast - i), outside: true });
  }
  for (let i = 1; i <= daysInMonth; i++) cells.push({ d: new Date(view.getFullYear(), view.getMonth(), i), outside: false });
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1].d;
    cells.push({ d: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), outside: cells[cells.length - 1].outside || cells.length >= daysInMonth + prevDays });
  }

  const quick = [
    { label: "Today", d: new Date() },
    { label: "Yesterday", d: new Date(Date.now() - 86400_000) },
    { label: "7 Days Ago", d: new Date(Date.now() - 7 * 86400_000) },
  ];

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all border"
        style={{
          background: "var(--color-bg-card)",
          borderColor: open ? "#E8621A" : "var(--color-border)",
          boxShadow: open ? "0 0 0 3px rgba(232,98,26,0.12)" : undefined,
        }}
      >
        <CalendarDays size={18} style={{ color: "#2B6CB0" }} />
        <span className="text-sm font-medium text-text-primary">{fmt(value)}</span>
        <ChevronDown size={16} style={{ color: "var(--color-text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-50 animate-dropdown p-4 rounded-2xl border min-w-[320px]"
          style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)", boxShadow: "0 8px 32px rgba(30,74,140,0.14), 0 2px 8px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-bg-primary">
              <ChevronLeft size={16} style={{ color: "#2B6CB0" }} />
            </button>
            <div className="text-[15px] font-semibold text-text-primary">{monthLabel}</div>
            <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-bg-primary">
              <ChevronRight size={16} style={{ color: "#2B6CB0" }} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] uppercase text-text-muted pb-2 border-b border-bg-primary">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-0.5 mt-1">
            {cells.slice(0, 42).map(({ d, outside }, i) => {
              const isSelected = sameDay(d, pending);
              const isToday = sameDay(d, today);
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <button
                  key={i}
                  disabled={outside}
                  onClick={() => setPending(d)}
                  className="w-9 h-9 mx-auto flex items-center justify-center rounded-lg text-[13px] font-medium transition-colors"
                  style={{
                    background: isSelected ? "#E8621A" : undefined,
                    color: isSelected ? "#fff" : isToday ? "#E8621A" : isWeekend ? "var(--color-accent-blue)" : "var(--color-text-secondary)",
                    opacity: outside ? 0.4 : 1,
                    border: isToday && !isSelected ? "1px solid #E8621A" : undefined,
                    fontWeight: isSelected || isToday ? 600 : 500,
                    boxShadow: isSelected ? "0 2px 8px rgba(232,98,26,0.3)" : undefined,
                  }}
                  onMouseEnter={(e) => { if (!isSelected && !outside) e.currentTarget.style.background = "var(--color-accent-blue-pale)"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = ""; }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[11px] text-text-muted">Quick:</span>
            {quick.map((q) => {
              const active = sameDay(q.d, pending);
              return (
                <button key={q.label} onClick={() => setPending(q.d)}
                  className="text-[11px] rounded-full px-2.5 py-1 border transition-all"
                  style={{
                    background: active ? "#E8621A" : "var(--color-bg-secondary)",
                    borderColor: active ? "#E8621A" : "#C8DCF5",
                    color: active ? "#fff" : "var(--color-text-secondary)",
                  }}>
                  {q.label}
                </button>
              );
            })}
          </div>

          <div className="border-t border-bg-primary mt-3 pt-2 flex items-center justify-between">
            <div className="text-[11px] text-text-muted">Selected: {fmtShort(pending)}</div>
            <button onClick={() => { onChange(pending); setOpen(false); }}
              className="text-[12px] font-semibold text-white rounded-lg px-3.5 py-1.5 transition-colors"
              style={{ background: "#E8621A" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#CF5316")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#E8621A")}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}