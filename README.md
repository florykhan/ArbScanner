# ArbScanner

**ArbScanner** is a local-first prediction market arbitrage workstation for a single operator. It continuously scans supported exchanges, compares trusted mapped markets across venues, detects potential negative-risk spreads, and exposes system state through a terminal dashboard.

---

## Project Overview

The goal of this project is to:

- store and organize exchange, event, market, contract, snapshot, and alert data
- build a semantic mapping layer for identifying equivalent markets across exchanges
- run a deterministic arbitrage engine on trusted mapped markets
- deliver a terminal UI for monitoring scanner activity and active alerts

The primary planning document is [docs/final-documentation/arbscanner-product-plan.md](docs/final-documentation/arbscanner-product-plan.md).

## Current backend entry points

- Mock scan: `python3 -m backend.run_mock_scan`
- Live Polymarket sync: `python3 -m backend.run_polymarket_sync --limit 50`
- Live Manifold sync: `python3 -m backend.run_manifold_sync --limit 50`
- Live Kalshi sync: `python3 -m backend.run_kalshi_sync --limit 50`
- Combined live sync: `python3 -m backend.run_live_sync --polymarket-limit 50 --manifold-limit 50 --kalshi-limit 50`
- Terminal dashboard: `python3 -m terminal.run_dashboard`
- HTTP API (for the web UI): `python3 -m backend.run_api` (default `http://127.0.0.1:3001`; requires **MySQL** running and a configured repo **`.env`**)

## Temporary MVP mapping

The current live MVP uses a naive title-based mapper in
[backend/services/title_mapper_service.py](backend/services/title_mapper_service.py).
It does two things:

- tries conservative fuzzy title matching across exchanges
- optionally applies regex alias rules from
  [backend/config/title_alias_rules.json](backend/config/title_alias_rules.json)

The live sync now also supports Gemini-based matching in
[backend/services/gemini_mapper_service.py](backend/services/gemini_mapper_service.py).
It runs after the regex mapper, checks likely cross-exchange title pairs in parallel, and caches decisions in
[backend/config/gemini_match_cache.json](backend/config/gemini_match_cache.json).

Use [backend/config/title_alias_rules.example.json](backend/config/title_alias_rules.example.json)
as the template when you want to force known Polymarket and Manifold titles into the same event for MVP demos.

---

## Local hosting (web UI + API)

For the **integrated React app** and **HTTP API**, you run **three separate things** on your machine:

| # | What | Role |
|---|------|------|
| 1 | **MySQL** | Database server; stores all catalog data the API reads. |
| 2 | **Python API** (`backend.run_api`) | FastAPI on port **3001**; connects to MySQL and serves `/api/*`. |
| 3 | **Vite dev server** (`npm run dev`) | React UI on port **5173**; proxies browser requests from `/api` → `http://127.0.0.1:3001` ([`frontend/vite.config.ts`](frontend/vite.config.ts)). |

Use **three terminal tabs/windows** (or tmux panes): one for MySQL if you start it manually, one for the API, one for the frontend. If MySQL runs as a background service (Homebrew `brew services`, Docker, etc.), you only need **two** terminals for API + frontend.

Optional fourth processes (same repo, different commands): sync jobs (`run_live_sync`, etc.) and the **terminal TUI** (`terminal.run_dashboard`)—they also talk to MySQL but are not required just to browse the web UI.

### Prerequisites

- **MySQL** 8.x (or compatible) reachable from your machine (native install, Homebrew, Docker, etc.).
- **Python 3.11+** (3.12 is fine) with `pip`.
- **Node.js 20+** and **npm**.

### Step 1 — Install and start MySQL

Pick one approach.

**Homebrew (example):**

```bash
brew install mysql
brew services start mysql
```

**Docker (example):**

```bash
docker run -d --name arbscanner-mysql \
  -e MYSQL_ROOT_PASSWORD=your_secure_password \
  -e MYSQL_DATABASE=ArbScannerDB \
  -p 3306:3306 \
  mysql:8
```

Confirm something is listening (should not say “refused”):

```bash
nc -zv 127.0.0.1 3306
```

If your server only exposes a **Unix socket**, note the socket path and set `ARBSCANNER_DB_SOCKET` in `.env` (see [`.env.example`](.env.example)); you can leave host/port as defaults for many setups.

### Step 2 — Create the database and schema

Connect with the MySQL client (`mysql -u root -p`, or Docker: `docker exec -it arbscanner-mysql mysql -uroot -p`).

```sql
CREATE DATABASE IF NOT EXISTS ArbScannerDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Apply the project schema (from repo root):

```bash
mysql -u root -p ArbScannerDB < database/schema/schema.sql
```

Adjust user/host if you do not use `root` / local TCP.

### Step 3 — Configure environment variables

From the **repository root** (not `frontend/`):

```bash
cp .env.example .env
```

Edit **`.env`** and set at least:

- `ARBSCANNER_DB_HOST` — e.g. `127.0.0.1` or `localhost`
- `ARBSCANNER_DB_PORT` — usually `3306`
- `ARBSCANNER_DB_USER` / `ARBSCANNER_DB_PASSWORD`
- `ARBSCANNER_DB_NAME` — must match the database you created (`ArbScannerDB` by default)

The Python backend loads this file automatically (see [`backend/utils/config.py`](backend/utils/config.py)).

### Step 4 — Python dependencies and HTTP API

From the **repository root**:

```bash
pip install -r requirements.txt
python3 -m backend.run_api
```

Defaults: API at **http://127.0.0.1:3001**. Override with `ARBSCANNER_API_HOST`, `ARBSCANNER_API_PORT`, `ARBSCANNER_API_RELOAD` if needed ([`backend/run_api.py`](backend/run_api.py)).

Sanity check (second terminal):

```bash
curl -s http://127.0.0.1:3001/api/health
```

You should see `{"status":"ok"}`. Hitting `/api/meta` requires a working DB connection; if MySQL is down you get **503** and a JSON `detail` explaining the error.

### Step 5 — Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

For local dev, keep **`VITE_API_URL` empty** in `frontend/.env` so the browser talks to the same origin (`http://localhost:5173`) and Vite **proxies** `/api` to port 3001.

```bash
npm run dev
```

Open **http://localhost:5173**. Events, dashboard, and alerts load from the API, which reads **live MySQL** data.

### Step 6 — (Optional) Load sample data

If tables are empty, run a scan so the UI has something to show:

```bash
# from repo root, with .env configured
python3 -m backend.run_mock_scan
```

Or use the live sync commands listed under [Current backend entry points](#current-backend-entry-points).

### Production build (static frontend)

```bash
cd frontend
npm run build
```

Output: **`frontend/dist/`**. The preview server does not proxy to the API unless you configure it; set **`VITE_API_URL`** to your deployed API base URL (no trailing slash), or serve API and static files behind one reverse proxy that routes `/api` to FastAPI.

### Troubleshooting

- **`Can't connect to MySQL server on '127.0.0.1:3306' (61)`** — MySQL is not running, or it listens on another port/socket. Start the service and align `.env` with reality (`nc -zv` helps).
- **`1045 ... Access denied ... (using password: NO)`** — The API is connecting without a password. Put **`ARBSCANNER_DB_PASSWORD`** (and matching **`ARBSCANNER_DB_USER`**) in the **repo root** `.env` next to `requirements.txt`, not only under `frontend/`. Replace the placeholder from [`.env.example`](.env.example), save, then restart the API. Homebrew MySQL often uses a non-empty root password you set at install time.
- **`1045 ... (using password: YES)`** — Wrong password or user; fix credentials or grant that user access to `ArbScannerDB`.
- **Empty UI** — API OK but no rows; run `run_mock_scan` or a sync module to populate tables.



mysql -u root -p -e "DROP DATABASE IF EXISTS ArbScannerDB; CREATE DATABASE ArbScannerDB;"
mysql -u root -p ArbScannerDB < database/schema/schema.sql
mysql -u root -p ArbScannerDB < database/seeds/seed.sql