# IoT Water Monitor — Thesis Prototype

A premium, light-theme React dashboard for an IoT water distribution monitor.
Built with React + TypeScript + Tailwind CSS + Recharts + React Router.

## How to run

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173` and expects the backend at
`http://localhost:3000`. When the API is offline, the UI automatically
uses realistic mock data so it always looks great.

## How to change the API URL

Edit `src/config.ts`:

```ts
export const API_BASE_URL = 'http://localhost:3000';
export const REFRESH_INTERVAL = 5000; // ms
export const ZONE_ID = 'zone_a';
```

## How to build for production

```bash
npm run build
npm run preview
```

## How to change the university name

Search the codebase for:

```
Pamantasan ng Lungsod ng San Pablo
```

It appears in `src/components/Sidebar.tsx`.

## API endpoints used

- `GET  /api/sensors/live`
- `GET  /api/sensors/zone_a?minutes=60|1440`
- `GET  /api/alerts?limit=50`
- `POST /api/alerts/:id/ack`
- `GET  /api/reports/daily?zone=zone_a[&date=YYYY-MM-DD]`
- `GET  /api/config/zone_a`
- `POST /api/valve/zone_a`   body: `{ "state": "open" | "closed" }`
- `GET  /health`

## Pages

- `/`         Dashboard with live stat cards and charts
- `/zone`     Zone A — 24h charts with thresholds + recent readings table
- `/alerts`   Alert history with severity badges and ACK actions
- `/reports`  Daily consumption, cost estimate, 7-day bar chart
- `/settings` Valve control, thresholds, connection test, about
