# Konduit

> Self-hosted distributed tracing and AI-powered root cause analysis for small microservice teams — without the Datadog bill.

## Overview

Konduit is a lightweight observability platform built for engineering teams running 3–10 microservices who need real distributed tracing, structured logging, and intelligent anomaly detection without enterprise APM pricing. It ingests traces, logs, and metrics from instrumented services via a Go collector, stores everything in ClickHouse (a columnar database optimized for time-series queries), and serves a Next.js dashboard with live data. When error rate spikes are detected via z-score analysis, Konduit automatically calls Gemini 2.0 Flash to generate a plain-English root cause hypothesis — correlating the spike to specific service-level trace data in under 10 seconds. The entire stack runs locally via Docker Compose with zero cloud dependencies and zero cost.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Collector API | Go 1.22 + Gin |
| Time-Series Store | ClickHouse 24.3 (Docker) |
| Instrumentation Protocol | OpenTelemetry (custom HTTP ingestion) |
| Anomaly Detection | Z-score statistical analysis (Go) |
| AI Root Cause | Google Gemini 2.0 Flash API |
| Dashboard | Next.js 16 + TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Demo Service | Go + Gin (synthetic OTel instrumented simulator) |
| Orchestration | Docker Compose |

## Features

- **Distributed Trace Ingestion** — POST traces, spans, logs, and metrics to the collector API from any instrumented service
- **ClickHouse Storage** — Columnar time-series storage with 30-day TTL, partitioned by date for fast range queries
- **Z-Score Anomaly Detection** — Statistically detects error rate spikes above configurable threshold (default 2.5σ), activates after minimum sample window
- **Gemini AI Root Cause Synthesis** — On anomaly detection, builds a structured SRE prompt from the metric time-series and generates a 2-3 sentence hypothesis in plain English
- **Live Dashboard** — Next.js dashboard with Overview, Traces, Logs, and Anomalies pages, all pulling live data from the collector
- **Trace Waterfall Visualizer** — Click any trace to see a timeline waterfall of all spans with latency bars color-coded by service
- **Log Stream** — Filterable, searchable log table with severity badges and per-service breakdown
- **Anomaly Detail Panel** — Selected anomaly shows error rate chart, z-score, detection timestamp, and full Gemini hypothesis
- **Demo Service** — Three simulated Go microservices (auth, payment, user) that continuously emit realistic traces/logs/metrics, with auto and manual spike injection
- **Fully Free Stack** — ClickHouse self-hosted, Gemini free tier (1500 req/day), everything else open source

## Project Structure

```
konduit/
├── collector/
│   ├── main.go
│   ├── go.mod
│   ├── go.sum
│   ├── handlers/
│   │   ├── traces.go
│   │   ├── logs.go
│   │   └── metrics.go
│   ├── db/
│   │   └── clickhouse.go
│   ├── models/
│   │   ├── trace.go
│   │   ├── log.go
│   │   └── metric.go
│   ├── anomaly/
│   │   └── detector.go
│   ├── ai/
│   │   └── gemini.go
│   └── .env
├── dashboard/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── .env.local
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── globals.css
│       │   ├── traces/
│       │   │   └── page.tsx
│       │   ├── logs/
│       │   │   └── page.tsx
│       │   └── anomalies/
│       │       └── page.tsx
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── TraceWaterfall.tsx
│       │   ├── LogTable.tsx
│       │   ├── MetricsChart.tsx
│       │   ├── AnomalyCard.tsx
│       │   └── RootCausePanel.tsx
│       └── lib/
│           └── api.ts
├── demo-service/
│   ├── main.go
│   ├── go.mod
│   └── go.sum
├── migrations/
│   ├── 001_traces.sql
│   ├── 002_logs.sql
│   └── 003_metrics.sql
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Go | 1.21+ | https://go.dev/dl/ |
| Node.js | 20+ | https://nodejs.org |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Git | Any | https://git-scm.com |
| Gemini API Key | — | https://aistudio.google.com/app/apikey |

### Clone the Repo

```bash
git clone https://github.com/MuaazTasawar/konduit.git
cd konduit
```

### Installation

**1. Start ClickHouse:**

```bash
docker compose up -d
```

Wait for `docker ps` to show `konduit-clickhouse` as `healthy`.

**2. Run database migrations:**

```bash
# Linux/Mac
cat migrations/001_traces.sql | docker exec -i konduit-clickhouse clickhouse-client --user konduit_user --password konduit_pass
cat migrations/002_logs.sql | docker exec -i konduit-clickhouse clickhouse-client --user konduit_user --password konduit_pass
cat migrations/003_metrics.sql | docker exec -i konduit-clickhouse clickhouse-client --user konduit_user --password konduit_pass

# Windows PowerShell
Get-Content migrations\001_traces.sql | docker exec -i konduit-clickhouse clickhouse-client --user konduit_user --password konduit_pass
Get-Content migrations\002_logs.sql | docker exec -i konduit-clickhouse clickhouse-client --user konduit_user --password konduit_pass
Get-Content migrations\003_metrics.sql | docker exec -i konduit-clickhouse clickhouse-client --user konduit_user --password konduit_pass
```

**3. Configure environment:**

Edit `collector/.env` and set your Gemini API key:

```env
GEMINI_API_KEY=your_key_here
```

**4. Build the collector:**

```bash
cd collector
go mod tidy
go build -o bin/collector .   # Windows: go build -o bin\collector.exe .
cd ..
```

**5. Build the demo service:**

```bash
cd demo-service
go mod tidy
go build -o bin/demo .        # Windows: go build -o bin\demo.exe .
cd ..
```

**6. Install dashboard dependencies:**

```bash
cd dashboard
npm install
cd ..
```

### Running the App

You need **4 terminals** running simultaneously:

| Terminal | Command | What it does |
|----------|---------|--------------|
| 1 | `docker compose up -d` | ClickHouse (run once) |
| 2 | `cd collector && ./bin/collector` | Collector API on :4317 |
| 3 | `cd demo-service && ./bin/demo` | Demo services on :8080 |
| 4 | `cd dashboard && npm run dev` | Dashboard on :3000 |

Open **http://localhost:3000** in your browser.

### Triggering an Anomaly

To immediately trigger an AI root cause analysis (no need to wait for auto-spike):

```bash
curl http://localhost:8080/spike/auth-service
# Windows PowerShell:
Invoke-RestMethod -Uri http://localhost:8080/spike/auth-service -Method GET
```

Then navigate to **Anomalies** in the dashboard. Within 15 seconds you'll see the spike detected and a Gemini hypothesis generated (requires valid API key with available quota).

## Environment Variables

### `collector/.env`

| Variable | Description | Default | Where to get |
|----------|-------------|---------|--------------|
| `PORT` | Collector API port | `4317` | — |
| `CLICKHOUSE_HOST` | ClickHouse hostname | `localhost` | — |
| `CLICKHOUSE_PORT` | ClickHouse HTTP port | `8123` | — |
| `CLICKHOUSE_DB` | Database name | `konduit` | — |
| `CLICKHOUSE_USER` | DB username | `konduit_user` | — |
| `CLICKHOUSE_PASSWORD` | DB password | `konduit_pass` | — |
| `GEMINI_API_KEY` | Gemini API key | — | https://aistudio.google.com/app/apikey |
| `ANOMALY_ZSCORE_THRESHOLD` | Z-score trigger threshold | `2.5` | — |
| `ANOMALY_MIN_SAMPLES` | Min samples before detection | `10` | — |

### `dashboard/.env.local`

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_COLLECTOR_URL` | Collector API base URL | `http://localhost:4317` |

## Collector API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/traces` | Ingest a trace span |
| GET | `/api/v1/traces` | List recent traces |
| GET | `/api/v1/traces/:trace_id` | Get all spans for a trace |
| POST | `/api/v1/logs` | Ingest a log entry |
| GET | `/api/v1/logs` | List recent logs |
| POST | `/api/v1/metrics` | Ingest a metric (triggers anomaly detection on `error_rate`) |
| GET | `/api/v1/metrics` | Query metrics by service and name |
| GET | `/api/v1/anomalies` | List detected anomalies with AI hypotheses |

## Phase Build History

| Phase | Name | What Was Built |
|-------|------|----------------|
| 0 | Project Init & Config | Docker Compose, .env files, .gitignore, go.mod files, git repo |
| 1 | ClickHouse Schema + DB Layer | SQL migrations for traces/logs/metrics tables, Go models, db connection and query functions |
| 2 | Collector API (Ingestion) | Gin server with POST/GET endpoints for traces, logs, metrics, health check |
| 3 | Anomaly Detection + Gemini AI | Z-score detector, Gemini 2.0 Flash HTTP client, structured SRE prompt, hypothesis generation |
| 4 | Demo Service | Three simulated Go microservices emitting realistic OTel data, auto and manual spike injection |
| 5 | Dashboard Core + Traces | Next.js layout, Navbar, Overview page with stat cards and service grid, Traces page with waterfall visualizer |
| 6 | Logs, Metrics, Anomalies | LogTable with search/filter, MetricsChart SVG, AnomalyCard list, RootCausePanel with Gemini output |
| 7 | Polish + README | Final documentation |

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: your feature description"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

## License

MIT