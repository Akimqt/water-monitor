import { API_BASE_URL, ZONE_ID } from "../config";

// ── Fetch helper ────────────────────────────────────────────────
async function tryFetch<T>(path: string, opts?: RequestInit): Promise<{ ok: boolean; data: T | null }> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(`${API_BASE_URL}${path}`, { 
  ...opts, 
  signal: ctrl.signal,
  headers: {
    ...opts?.headers,
    'ngrok-skip-browser-warning': 'true'
  }
});
    clearTimeout(id);
    if (!r.ok) return { ok: false, data: null };
    return { ok: true, data: (await r.json()) as T };
  } catch {
    return { ok: false, data: null };
  }
}

// ── MOCK DATA ───────────────────────────────────────────────────
const MOCK_LIVE = {
  flow_lpm: 3.45,
  pressure_kpa: 82.5,
  leak_detected: false,
  tank_pct: 71.9,
  valve_state: "open" as "open" | "closed",
  active_alerts: 0,
  timestamp: new Date().toISOString(),
};

// ── LIVE SENSORS ────────────────────────────────────────────────
export type LiveData = typeof MOCK_LIVE;

// Backend returns an InfluxDB pivot row — normalize it
function normalizeLive(raw: any): LiveData {
  return {
    flow_lpm:      typeof raw.flow_lpm      === "number" ? raw.flow_lpm      : parseFloat(raw.flow_lpm ?? "0") || 0,
    pressure_kpa:  typeof raw.pressure_kpa  === "number" ? raw.pressure_kpa  : parseFloat(raw.pressure_kpa ?? "0") || 0,
    leak_detected: raw.leak_detected === true || raw.leak_detected === "true" || raw.leak === true,
    tank_pct:      typeof raw.tank_pct      === "number" ? raw.tank_pct      : parseFloat(raw.tank_pct ?? "0") || 0,
    valve_state:   raw.valve_state === "closed" ? "closed" : "open",
    active_alerts: raw.active_alerts ?? 0,
    timestamp:     raw._time ?? raw.timestamp ?? new Date().toISOString(),
  };
}

export async function getLive(): Promise<{ data: LiveData; online: boolean }> {
  const r = await tryFetch<any>("/api/sensors/live");
  if (r.ok && r.data) {
    return { data: normalizeLive(r.data), online: true };
  }
  // jitter mock so UI feels alive
  return {
    data: {
      ...MOCK_LIVE,
      flow_lpm:     +(3.45 + (Math.random() - 0.5) * 0.8).toFixed(2),
      pressure_kpa: +(82.5 + (Math.random() - 0.5) * 6).toFixed(1),
      tank_pct:     +(71.9 + (Math.random() - 0.5) * 2).toFixed(1),
      timestamp:    new Date().toISOString(),
    },
    online: false,
  };
}

// ── SERIES (charts) ─────────────────────────────────────────────
export type Series = { t: string; flow: number; pressure: number; leak: boolean; valve: "open" | "closed" }[];

// Backend returns InfluxDB pivot rows — normalize each row
function normalizeRow(row: any): Series[0] {
  return {
    t:        row._time ?? row.t ?? new Date().toISOString(),
    flow:     typeof row.flow_lpm     === "number" ? row.flow_lpm     : parseFloat(row.flow_lpm ?? "0") || 0,
    pressure: typeof row.pressure_kpa === "number" ? row.pressure_kpa : parseFloat(row.pressure_kpa ?? "0") || 0,
    leak:     row.leak_detected === true || row.leak_detected === "true" || row.leak === true,
    valve:    row.valve_state === "closed" ? "closed" : "open",
  };
}

function mockSeries(minutes: number): Series {
  const out: Series = [];
  const now = Date.now();
  const points = Math.min(120, Math.max(30, Math.floor(minutes / (minutes > 120 ? 12 : 1))));
  for (let i = points; i >= 0; i--) {
    const t = new Date(now - (i * minutes * 60_000) / points);
    out.push({
      t:        t.toISOString(),
      flow:     +(3.2 + Math.sin(i / 5) * 0.9 + Math.random() * 0.6).toFixed(2),
      pressure: +(80 + Math.cos(i / 7) * 5 + Math.random() * 2).toFixed(1),
      leak:     false,
      valve:    "open",
    });
  }
  return out;
}

export async function getSeries(minutes: number): Promise<Series> {
  const r = await tryFetch<any[]>(`/api/sensors/${ZONE_ID}?minutes=${minutes}`);
  if (r.ok && r.data && Array.isArray(r.data) && r.data.length > 0) {
    return r.data.map(normalizeRow);
  }
  return mockSeries(minutes);
}

// ── ALERTS ──────────────────────────────────────────────────────
export type Alert = {
  id: string;
  type: "leak" | "pressure_drop" | "flow_spike" | "anomaly_detected" | "night_flow";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  timestamp: string;
  acknowledged: boolean;
};

// Backend returns MySQL rows with different field names — normalize
function normalizeAlert(raw: any): Alert {
  // Map backend alert_type → frontend type
  const typeMap: Record<string, Alert["type"]> = {
    leak:          "leak",
    pressure_drop: "pressure_drop",
    flow_spike:    "flow_spike",
    ml_anomaly:    "anomaly_detected",
    night_flow:    "night_flow",
    zero_pressure: "pressure_drop",
  };

  // Map backend severity (lowercase) → frontend (uppercase)
  const sevMap: Record<string, Alert["severity"]> = {
    critical: "CRITICAL",
    high:     "HIGH",
    medium:   "MEDIUM",
    low:      "LOW",
  };

  const type     = typeMap[raw.alert_type] ?? "leak";
  const severity = sevMap[raw.severity?.toLowerCase()] ?? "MEDIUM";
  const flow     = raw.flow_lpm     ? `${parseFloat(raw.flow_lpm).toFixed(2)} L/min`  : null;
  const pressure = raw.pressure_kpa ? `${parseFloat(raw.pressure_kpa).toFixed(1)} kPa` : null;

  const messageMap: Record<Alert["type"], string> = {
    leak:             `Leak detected${flow ? ` at ${flow}` : ""}${pressure ? `, ${pressure}` : ""}`,
    pressure_drop:    `Pressure drop detected${pressure ? ` — ${pressure}` : ""}`,
    flow_spike:       `Flow spike detected${flow ? ` — ${flow}` : ""}`,
    anomaly_detected: `ML anomaly detected${flow ? ` at ${flow}` : ""}`,
    night_flow:       `Night flow detected${flow ? ` — ${flow}` : ""}`,
  };

  return {
    id:           String(raw.id ?? Math.random()),
    type,
    severity,
    message:      raw.notes ?? messageMap[type],
    timestamp:    raw.triggered_at ?? raw.timestamp ?? new Date().toISOString(),
    acknowledged: !!(raw.acknowledged_at ?? raw.acknowledged),
  };
}

const MOCK_ALERTS: Alert[] = [
  { id: "a1", type: "pressure_drop",    severity: "HIGH",   message: "Pressure dropped below 40 kPa for 12s",  timestamp: new Date(Date.now() - 3600_000).toISOString(),   acknowledged: false },
  { id: "a2", type: "flow_spike",       severity: "MEDIUM", message: "Flow spike of 9.2 L/min detected",       timestamp: new Date(Date.now() - 7200_000).toISOString(),   acknowledged: false },
  { id: "a3", type: "night_flow",       severity: "LOW",    message: "Continuous night flow at 02:14",         timestamp: new Date(Date.now() - 86400_000).toISOString(),  acknowledged: true },
  { id: "a4", type: "anomaly_detected", severity: "MEDIUM", message: "Unusual consumption pattern",            timestamp: new Date(Date.now() - 172800_000).toISOString(), acknowledged: true },
];

export async function getAlerts(): Promise<Alert[]> {
  const r = await tryFetch<any[]>("/api/alerts?limit=50");
  if (r.ok && r.data && Array.isArray(r.data)) {
    return r.data.map(normalizeAlert);
  }
  return MOCK_ALERTS;
}

export async function ackAlert(id: string) {
  await tryFetch(`/api/alerts/${id}/ack`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ user: "web_user" }),
  });
}

// ── REPORTS ─────────────────────────────────────────────────────
export type DailyReport = {
  date:         string;
  total_liters: number;
  peak_flow:    number;
  avg_pressure: number;
  leak_events:  number;
  cost_php:     number;
  history:      { date: string; liters: number }[];
};

function mockReport(date: Date): DailyReport {
  const history: { date: string; liters: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(date);
    d.setDate(d.getDate() - i);
    history.push({ date: d.toISOString().slice(0, 10), liters: 1200 + Math.round(Math.random() * 900) });
  }
  return {
    date:         date.toISOString().slice(0, 10),
    total_liters: history[history.length - 1].liters,
    peak_flow:    7.8,
    avg_pressure: 81.2,
    leak_events:  0,
    cost_php:     (history[history.length - 1].liters / 1000) * 20,
    history,
  };
}

export async function getDailyReport(date?: string): Promise<DailyReport> {
  const path = date
    ? `/api/reports/daily?zone=${ZONE_ID}&date=${date}`
    : `/api/reports/daily?zone=${ZONE_ID}`;
  const r = await tryFetch<any>(path);
  const target = date ? new Date(date) : new Date();

  if (r.ok && r.data && !r.data.note) {
    // Normalize backend field names
    const raw = r.data;
    return {
      date:         raw.report_date ?? raw.date ?? target.toISOString().slice(0, 10),
      total_liters: parseFloat(raw.total_liters ?? "0") || 0,
      peak_flow:    parseFloat(raw.peak_flow    ?? "0") || 0,
      avg_pressure: parseFloat(raw.avg_pressure ?? "0") || 0,
      leak_events:  raw.leak_count ?? raw.leak_events ?? 0,
      cost_php:     parseFloat(raw.cost_php ?? "0") || (parseFloat(raw.total_liters ?? "0") / 1000 * 20),
      history:      raw.history ?? [],
    };
  }
  return mockReport(target);
}

// ── ZONE CONFIG ─────────────────────────────────────────────────
export type ZoneConfig = {
  min_flow:      number;
  max_flow:      number;
  min_pressure:  number;
  pressure_drop: number;
  confirm_count: number;
};

export async function getZoneConfig(): Promise<ZoneConfig> {
  const r = await tryFetch<any>(`/api/config/${ZONE_ID}`);
  if (r.ok && r.data) {
    const raw = r.data;
    return {
      // Backend uses _lpm and _kpa suffixes
      min_flow:      parseFloat(raw.flow_min_lpm      ?? raw.min_flow      ?? "0.2"),
      max_flow:      parseFloat(raw.flow_max_lpm      ?? raw.max_flow      ?? "8.0"),
      min_pressure:  parseFloat(raw.pressure_min_kpa  ?? raw.min_pressure  ?? "40"),
      pressure_drop: parseFloat(raw.pressure_drop_kpa ?? raw.pressure_drop ?? "20"),
      confirm_count: parseInt(raw.leak_confirm_count  ?? raw.confirm_count  ?? "3"),
    };
  }
  return { min_flow: 0.2, max_flow: 8.0, min_pressure: 40, pressure_drop: 20, confirm_count: 3 };
}

// ── VALVE ────────────────────────────────────────────────────────
// FIX: Backend expects { action: "open"/"close" } not { state: "open"/"closed" }
export async function setValve(state: "open" | "closed"): Promise<boolean> {
  const action = state === "open" ? "open" : "close";
  const r = await tryFetch(`/api/valve/${ZONE_ID}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ action }),
  });
  return r.ok;
}

// ── HEALTH ───────────────────────────────────────────────────────
export async function pingHealth(): Promise<boolean> {
  const r = await tryFetch("/health");
  return r.ok;
}
