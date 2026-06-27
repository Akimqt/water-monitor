import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { Droplets, LayoutDashboard, Waves, Bell, BarChart3, Settings, GraduationCap } from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/zone", label: "Zone A", Icon: Waves },
  { to: "/alerts", label: "Alerts", Icon: Bell },
  { to: "/reports", label: "Reports", Icon: BarChart3 },
  { to: "/settings", label: "Settings", Icon: Settings },
];

export default function Sidebar({ alertCount }: { alertCount: number }) {
  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 z-30 text-white shadow-sidebar"
      style={{ background: "linear-gradient(180deg, var(--color-sidebar) 0%, var(--color-sidebar-deep) 100%)" }}
    >
      <div className="p-5">
        <div className="flex items-center gap-2.5">
          <Droplets size={28} style={{ color: "#E8621A" }} />
          <div>
            <div className="text-[18px] font-bold leading-none" style={{ color: "#E8621A" }}>Water Monitor</div>
            <div className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>IoT Prototype System</div>
          </div>
        </div>
      </div>
      <div className="h-px mx-4" style={{ background: "rgba(232,98,26,0.3)" }} />

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all duration-200 ${
                isActive ? "bg-white/15 text-white font-semibold" : "text-white/65 hover:bg-white/10 hover:text-white"
              }`
            }
            style={({ isActive }) => isActive ? { paddingLeft: "13px" } : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    initial={{ scaleY: 0, originY: 0.5 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "3px",
                      background: "#E8621A",
                    }}
                  />
                )}
                <Icon size={18} className="transition-transform group-hover:rotate-[5deg]" />
                <span className="text-[13px] flex-1">{label}</span>
                {label === "Alerts" && alertCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#E8621A", color: "#fff" }}>
                    {alertCount}
                  </span>
                )}
                {isActive && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#E8621A" }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-4" style={{ background: "var(--color-sidebar-deep)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-1.5">
          <GraduationCap size={14} style={{ color: "#E8621A" }} />
          <span className="text-[13px] font-bold text-white">Computer Engineering</span>
        </div>
        <div className="text-[11px] mt-0.5 uppercase tracking-wider" style={{ color: "#E8621A" }}>Thesis Project</div>
        <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.1)" }} />
        <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.75)" }}>Pamantasan ng Lungsod ng San Pablo</div>
        <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.75)" }}>College of Engineering and Technology</div>
        <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>Academic Year 2025-2026</div>
        <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.1)" }} />
        <div className="text-center text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
          v1.0.0 — Prototype Build
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ alertCount }: { alertCount: number }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5"
      style={{
        background: "#1E4A8C",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 -4px 16px rgba(30,74,140,0.14)",
      }}
    >
      {items.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] transition-colors ${
              isActive ? "" : "text-white/60"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon size={20} style={{ color: isActive ? "#E8621A" : undefined }} />
                {label === "Alerts" && alertCount > 0 && (
                  <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 rounded-full"
                    style={{ background: "#E8621A", color: "#fff" }}>{alertCount}</span>
                )}
              </div>
              <span style={{ color: isActive ? "#E8621A" : undefined, fontWeight: isActive ? 600 : 500 }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
