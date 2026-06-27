import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import Sidebar, { MobileNav } from "./components/Sidebar";
import { useTheme } from "./hooks/useTheme";
import { ToastProvider } from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import Zone from "./pages/Zone";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import { getAlerts } from "./lib/api";
import { REFRESH_INTERVAL } from "./config";

export default function App() {
  useTheme();
  const [alertCount, setAlertCount] = useState(0);
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      const a = await getAlerts();
      if (mounted) setAlertCount(a.filter((x) => !x.acknowledged).length);
    };
    tick();
    const id = setInterval(tick, REFRESH_INTERVAL);
    return () => { mounted = false; clearInterval(id); };
  }, []);


  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      <ToastProvider>
        <Sidebar alertCount={alertCount} />
        <main
          className="md:ml-60 pb-24 md:pb-8"
          style={{
            background: "var(--color-bg-primary)",
            backgroundImage: "radial-gradient(ellipse 800px 300px at 50% 0%, rgba(43,108,176,0.07) 0%, transparent 70%)",
          }}
        >
          <div key={location.pathname} className="animate-fade-up p-5 md:p-8 max-w-[1400px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/zone" element={<Zone />} />
                  <Route path="/alerts" element={<Alerts onChange={setAlertCount} />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <MobileNav alertCount={alertCount} />
      </ToastProvider>
    </MotionConfig>
  );
}
