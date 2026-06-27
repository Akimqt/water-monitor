import { useEffect, useState } from "react";
import { Lock, Unlock, Wifi, Droplets, CircleDot, Sun, Moon, Download } from "lucide-react";
import JSZip from "jszip";
import { useTheme } from "../hooks/useTheme";
import PageTitle from "../components/PageTitle";
import { getLive, getZoneConfig, pingHealth, setValve, ZoneConfig } from "../lib/api";
import { useToast } from "../components/Toast";
import { API_BASE_URL, ZONE_ID } from "../config";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [valveState, setValveState] = useState<"open" | "closed">("open");
  const [config, setConfig] = useState<ZoneConfig | null>(null);
  const [apiUrl, setApiUrl] = useState(API_BASE_URL);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; checked: Date } | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getLive().then((l) => setValveState(l.data.valve_state));
    getZoneConfig().then(setConfig);
  }, []);

  const doSet = async (state: "open" | "closed") => {
    const ok = await setValve(state);
    setValveState(state);
    toast.push(ok ? "success" : "info", `Valve ${state.toUpperCase()}${ok ? "" : " (mock)"}`);
  };

  const doTest = async () => {
    setTesting(true);
    const ok = await pingHealth();
    setTestResult({ ok, checked: new Date() });
    setTesting(false);
  };

  const downloadZip = async () => {
    const files = import.meta.glob("/src/**/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
    const zip = new JSZip();
    for (const [path, content] of Object.entries(files)) {
      zip.file(path.replace(/^\//, ""), content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "water-monitor-src.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="section-header mb-4">Appearance</h2>
        <div className="card p-4 flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold text-text-primary">Theme</div>
            <div className="text-[12px] text-text-muted">Switch between light and dark mode</div>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              padding: 3,
              borderRadius: 999,
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
            }}
          >
            <button
              onClick={() => toggleTheme("light")}
              aria-label="Light mode"
              title="Light mode"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                background: theme === "light" ? "#E8621A" : "transparent",
                transition: "background 150ms ease",
              }}
            >
              <Sun size={16} style={{ color: theme === "light" ? "#fff" : "var(--color-text-muted)" }} />
            </button>
            <button
              onClick={() => toggleTheme("dark")}
              aria-label="Dark mode"
              title="Dark mode"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                background: theme === "dark" ? "#E8621A" : "transparent",
                transition: "background 150ms ease",
              }}
            >
              <Moon size={16} style={{ color: theme === "dark" ? "#fff" : "var(--color-text-muted)" }} />
            </button>
          </div>
        </div>
      </div>
      <PageTitle title="System Settings" subtitle="Configure valve, thresholds and connection" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Valve control */}
        <div className="card">
          <div className="p-5">
            <h3 className="section-header mb-4">Valve Control</h3>
            <div
              className={`rounded-xl p-5 border ${valveState === "open" ? "animate-valve-open" : ""}`}
              style={{
                background: valveState === "open" ? "rgba(5,150,105,0.03)" : "rgba(220,38,38,0.03)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: valveState === "open" ? "#DCFCE7" : "#FEF2F2",
                    boxShadow: valveState === "open"
                      ? "0 0 16px rgba(5,150,105,0.15)"
                      : "0 0 16px rgba(220,38,38,0.15)",
                  }}>
                  {valveState === "open"
                    ? <Unlock size={24} style={{ color: "var(--color-success)" }} />
                    : <Lock size={24} style={{ color: "var(--color-danger)" }} />}
                </div>
                <div>
                  <div className="text-[15px] font-bold transition-colors" style={{ color: valveState === "open" ? "var(--color-success)" : "var(--color-danger)" }}>
                    {valveState === "open" ? "VALVE OPEN" : "VALVE CLOSED"}
                  </div>
                  <div className="text-[12px] text-text-muted">Zone A — Prototype Water Loop</div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button className="btn-green" onClick={() => doSet("open")} disabled={valveState === "open"}
                  style={{ opacity: valveState === "open" ? 0.6 : 1 }}>
                  <Unlock size={16} /> Open Valve
                </button>
                <button className="btn-red" onClick={() => setConfirmClose(true)} disabled={valveState === "closed"}
                  style={{ opacity: valveState === "closed" ? 0.6 : 1 }}>
                  <Lock size={16} /> Close Valve
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thresholds */}
        <div className="card">
          <div className="p-5">
            <h3 className="section-header mb-2">Detection Thresholds</h3>
            <div className="text-[11px] text-text-muted mb-3">Read-only · Zone {ZONE_ID}</div>
            {[
              ["Min Flow", `${config?.min_flow ?? "—"} L/min`],
              ["Max Flow", `${config?.max_flow ?? "—"} L/min`],
              ["Min Pressure", `${config?.min_pressure ?? "—"} kPa`],
              ["Pressure Drop", `${config?.pressure_drop ?? "—"} kPa`],
              ["Confirm Count", `${config?.confirm_count ?? "—"} reads`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <span className="text-[13px] text-text-muted">{k}</span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "var(--color-accent-blue-light)", color: "var(--color-accent-blue)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Connection */}
        <div className="card">
          <div className="p-5">
            <h3 className="section-header mb-4">System Connection</h3>
            <label className="text-[11px] uppercase text-text-muted">Backend API URL</label>
            <input
              className="mt-2 w-full border rounded-[10px] px-3 py-2.5 text-[13px]"
              style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
              value={apiUrl} onChange={(e) => setApiUrl(e.target.value)}
            />
            <button className="btn-orange mt-4" onClick={doTest} disabled={testing}>
              <Wifi size={16} /> {testing ? "Testing..." : "Test Connection"}
            </button>
            {testResult && (
              <div className="mt-4 rounded-xl p-3 border"
                style={{
                  background: testResult.ok ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.12)",
                  borderColor: testResult.ok ? "rgba(5,150,105,0.3)" : "rgba(220,38,38,0.3)",
                }}>
                <div className="text-[13px] font-semibold" style={{ color: testResult.ok ? "var(--color-success)" : "var(--color-danger)" }}>
                  {testResult.ok ? "Connected" : "Cannot reach server"}
                </div>
                <div className="text-[11px] text-text-muted">Last checked: {testResult.checked.toLocaleTimeString()}</div>
              </div>
            )}
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="p-5">
            <h3 className="section-header mb-4">About</h3>
            <div className="flex items-center gap-2">
              <Droplets size={20} style={{ color: "#2B6CB0" }} />
              <div className="text-[20px] font-bold text-text-primary">IoT Water Monitor</div>
            </div>
            <p className="text-[14px] text-text-secondary mt-1">Real-Time Water Consumption Monitor and Leak Detector</p>
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              {[
                ["Version", "v1.0.0"],
                ["Build", "Prototype"],
                ["Zone", "Zone A"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1 border rounded-lg px-3 py-2"
                  style={{ borderColor: "var(--color-border)" }}>
                  <span className="text-[11px] uppercase text-text-muted">{k}</span>
                  <span className="text-[12px] font-semibold text-text-primary px-2 py-0.5 rounded-md self-start"
                    style={{ background: "var(--color-accent-blue-light)" }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border rounded-lg px-3 py-2 mt-2.5"
              style={{ borderColor: "var(--color-border)" }}>
              <span className="text-[11px] uppercase text-text-muted">Platform</span>
              <span className="text-[12px] font-semibold text-text-primary px-2 py-0.5 rounded-md whitespace-nowrap"
                style={{ background: "var(--color-accent-blue-light)" }}>React + Node.js + ESP32</span>
            </div>
          </div>
          <div className="text-center text-[11px] text-text-muted py-2.5 border-t" style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
            Built for academic purposes
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button onClick={downloadZip} className="btn-orange">
          <Download size={16} /> Download Project ZIP
        </button>
      </div>



      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-up"
          style={{ background: "rgba(30,74,140,0.2)" }} onClick={() => setConfirmClose(false)}>
          <div className="rounded-2xl border max-w-sm w-full p-6"
            style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <CircleDot size={22} style={{ color: "var(--color-danger)" }} />
              <h4 className="text-[16px] font-bold text-text-primary">Close valve?</h4>
            </div>
            <p className="text-[13px] text-text-secondary mb-5">
              This will shut water flow for Zone A immediately. Confirm to proceed.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmClose(false)}
                className="text-[13px] font-semibold rounded-lg px-3.5 py-2 border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>Cancel</button>
              <button onClick={() => { setConfirmClose(false); doSet("closed"); }}
                className="btn-red text-[13px]"><Lock size={14} /> Close Valve</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}