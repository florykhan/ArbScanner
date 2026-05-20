 # 📊 ArbScanner — Prediction Market Arbitrage Workstation

**ArbScanner** is a local-first prediction market arbitrage workstation for a single operator. It continuously scans supported exchanges, compares trusted mapped markets across venues, detects potential negative-risk spreads, and exposes system state through a **FastAPI** HTTP API, a **Vite + React** web UI, and an optional **terminal dashboard**. Data lives in **MySQL**; optional **Google Gemini** assists cross-venue title matching when configured.

---

## 🎯 Project Overview

The goal of this project is to:

- **Store** exchange, event, market, contract, snapshot, and alert data in a structured catalog.
- **Map** semantically equivalent markets across venues (title/alias rules, optional Gemini-assisted matching).
- **Scan** Polymarket, Manifold, and Kalshi (mock or live sync jobs) into the database.
- **Run** a deterministic arbitrage engine on trusted mapped markets and surface alerts.
- **Operate** via a browser UI (dashboard, events, alerts) or a terminal TUI for monitoring.

The primary planning document is [docs/final-documentation/arbscanner-product-plan.md](docs/final-documentation/arbscanner-product-plan.md).

**Target users:** operators who want one place to sync venues, review mappings, and watch for cross-exchange structure worth investigating — not turnkey execution or brokerage.

---

## 🌐 Live Demo

The **static frontend** is deployed on **Vercel** (built with **Vite**). Try it here: **[https://arb-scanner-mauve.vercel.app](https://arb-scanner-mauve.vercel.app)**

**Where things run in production**

| Piece | Host | Notes |
|--------|------|--------|
| **Web UI** | [Vercel](https://vercel.com) | Vite production build from `frontend/`; set `VITE_API_BASE_URL` to your API origin. |
| **HTTP API** | [Render](https://render.com) | FastAPI via Gunicorn + Uvicorn worker (see [`Procfile`](./Procfile)); Render sets `PORT`. |
| **MySQL** | [Railway](https://railway.app) | Managed MySQL; point `ARBSCANNER_DB_*` at Railway’s connection string and apply [`database/schema/schema.sql`](./database/schema/schema.sql). |

> ⚠️ **Note:**  
> On Render’s free tier the API **spins down** after inactivity. The first request after idle time can take **up to about a minute** while the service cold-starts; refresh or wait and try again.

---

## ✨ Key Features

- **Multi-venue catalog** — Sync and store Polymarket, Manifold, and Kalshi markets with snapshots for comparison.
- **Mapping pipeline** — Conservative title fuzzy match, optional regex aliases ([`backend/config/title_alias_rules.json`](backend/config/title_alias_rules.json)), optional Gemini matcher with cache ([`backend/config/gemini_match_cache.json`](backend/config/gemini_match_cache.json)).
- **HTTP API** — FastAPI on port **3001** locally (`python3 -m backend.run_api`); health at `/api/health`, meta and reads require a working DB.
- **React dashboard** — Vite dev server on **5173**; proxies `/api` to the API in development ([`frontend/vite.config.ts`](frontend/vite.config.ts)).
- **Terminal UI** — Optional operator dashboard: `python3 -m terminal.run_dashboard`.
- **Sync CLIs** — Mock scan and per-venue or combined live sync entry points under `backend/`.

---

## 🧱 Repository Structure

```
ArbScanner/
├── backend/
│   ├── run_api.py                       # HTTP API (`python3 -m backend.run_api`)
│   ├── run_mock_scan.py
│   ├── run_live_sync.py
│   ├── run_polymarket_sync.py
│   ├── run_manifold_sync.py
│   ├── run_kalshi_sync.py
│   ├── api/                             # FastAPI app (`main.py`)
│   ├── config/                          # Title rules, Gemini match cache
│   ├── database/mysql/
│   ├── models/
│   ├── services/
│   ├── src/                             # `adapters/`, `db/repositories/` (placeholders)
│   └── utils/                           # `config.py`, `db.py`, CORS helpers
│
├── database/
│   ├── schema/schema.sql                # apply to MySQL before running the API
│   ├── queries/
│   └── seeds/
│
├── docs/
│   ├── diagrams/
│   ├── final-documentation/             # product plan, DB notes, terminal plan
│   └── milestone-pdfs/
│
├── frontend/
│   ├── .env.example                     # `VITE_API_BASE_URL`, dev proxy
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts                   # dev `/api` → FastAPI
│   ├── vercel.json
│   └── src/                             # pages, components, api, styles, etc.
│
├── terminal/
│   ├── run_dashboard.py                 # `python3 -m terminal.run_dashboard`
│   ├── README.md
│   ├── docs/
│   ├── tests/
│   └── tui/                             # app, screens, widgets, gateway, etc.
│
├── .env.example                         # DB, API, CORS, exchange keys (repo root)
├── .gitignore
├── LICENSE
├── Procfile                             # Render: Gunicorn + Uvicorn worker
├── README.md
└── requirements.txt
```

> 🗒️ **Note:**  
> Folders hold the rest of the code (for example all `services/*.py` under `backend/services/`). Omitted from the diagram: `.git/`, `node_modules/`, `frontend/dist/`, `__pycache__/`, `.claude/`, local `.env`, and `README 2.md` (format template only).  
> Locally, the **browser** talks to Vite on **5173** and `/api` is **proxied** to FastAPI on **3001**. In production (Vercel → Render), set **`VITE_API_BASE_URL`** to the Render API origin and **`FRONTEND_URL`** / **`ARBSCANNER_CORS_ORIGINS`** on the API so CORS allows your Vercel host (see [`.env.example`](./.env.example)).

---

## 🧰 Run Locally

You can run this project with **MySQL 8.x**, **Python 3.11+** (3.12 is fine), and **Node.js 20+** with **npm**.

### 1️⃣ Clone the repository

```bash
git clone https://github.com/florykhan/ArbScanner.git
cd ArbScanner
```

### 2️⃣ Install and start MySQL

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

Confirm something is listening:

```bash
nc -zv 127.0.0.1 3306
```

If your server uses a **Unix socket**, set `ARBSCANNER_DB_SOCKET` in `.env` (see [`.env.example`](./.env.example)).

### 3️⃣ Create the database and schema

Connect with the MySQL client (`mysql -u root -p`, or Docker: `docker exec -it arbscanner-mysql mysql -uroot -p`).

```sql
CREATE DATABASE IF NOT EXISTS ArbScannerDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

From the **repository root**:

```bash
mysql -u root -p ArbScannerDB < database/schema/schema.sql
```

Adjust user/host if you do not use `root` / local TCP.

### 4️⃣ Configure environment variables (repo root)

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

### 5️⃣ Python dependencies and HTTP API

From the **repository root**:

```bash
pip install -r requirements.txt
python3 -m backend.run_api
```

Defaults: API at **http://127.0.0.1:3001**. Override with `ARBSCANNER_API_HOST`, `ARBSCANNER_API_PORT`, `ARBSCANNER_API_RELOAD` if needed ([`backend/run_api.py`](backend/run_api.py)). On **Render**, `PORT` is injected; the app binds **`0.0.0.0`** and uses that port. Production web process: **[`Procfile`](./Procfile)** (Gunicorn + Uvicorn worker).

Sanity check (second terminal):

```bash
curl -s http://127.0.0.1:3001/api/health
```

You should see `{"status":"ok"}`. `/api/meta` requires a working DB; if MySQL is down you get **503** with a JSON `detail`.

### 6️⃣ Frontend (Vite)

```bash
cd frontend
npm install
cp .env.example .env
```

For local dev, keep **`VITE_API_BASE_URL` empty** in `frontend/.env` so the browser uses the Vite origin and **proxies** `/api` → `http://127.0.0.1:3001` ([`frontend/vite.config.ts`](frontend/vite.config.ts)). `VITE_API_URL` is still read as a fallback.

```bash
npm run dev
```

Open **http://localhost:5173**.

**Summary — what runs where locally**

| # | Process | Command | URL / role |
|---|---------|---------|------------|
| 1 | **MySQL** | (service or Docker) | `localhost:3306` (typical) |
| 2 | **API** | `python3 -m backend.run_api` (repo root) | **http://127.0.0.1:3001** |
| 3 | **Vite** | `npm run dev` in `frontend/` | **http://localhost:5173** → proxies `/api` to 3001 |

Use **three** terminal tabs if MySQL is manual (MySQL + API + Vite); **two** if MySQL is already a background service.

### 7️⃣ (Optional) Load sample data

If tables are empty:

```bash
# from repo root, with .env configured
python3 -m backend.run_mock_scan
```

Other useful entry points:

- `python3 -m backend.run_polymarket_sync --limit 50`
- `python3 -m backend.run_manifold_sync --limit 50`
- `python3 -m backend.run_kalshi_sync --limit 50`
- `python3 -m backend.run_live_sync --polymarket-limit 50 --manifold-limit 50 --kalshi-limit 50`
- `python3 -m terminal.run_dashboard` — terminal dashboard (separate from the web UI)

### 8️⃣ Production build (static frontend)

```bash
cd frontend
npm run build
```

Output: **`frontend/dist/`**. For a static host, set **`VITE_API_BASE_URL`** to your deployed API (e.g. `https://your-service.onrender.com`, no trailing slash). On the API, set **`FRONTEND_URL`** and **`ARBSCANNER_CORS_ORIGINS`** so CORS allows your **Vercel** domain ([`.env.example`](./.env.example)).

### Troubleshooting

- **`Can't connect to MySQL server on '127.0.0.1:3306'`** — MySQL not running or wrong port/socket; align `.env` and use `nc -zv`.
- **`1045 ... (using password: NO)`** — Put **`ARBSCANNER_DB_PASSWORD`** in the **repo root** `.env`, not only under `frontend/`.
- **`1045 ... (using password: YES)`** — Wrong credentials or missing grants on `ArbScannerDB`.
- **Empty UI** — API OK but no rows; run `run_mock_scan` or a sync module.

---

## 🔐 Environment Variables

**Root `.env`** (see [`.env.example`](./.env.example)):

- **Required for API / sync:** `ARBSCANNER_DB_HOST`, `ARBSCANNER_DB_PORT`, `ARBSCANNER_DB_USER`, `ARBSCANNER_DB_PASSWORD`, `ARBSCANNER_DB_NAME` — point at local MySQL or **Railway** in production.
- **CORS (Vercel → Render):** `FRONTEND_URL`, optional `ARBSCANNER_CORS_ORIGINS` / regex flags as documented in `.env.example`.
- **Optional SSL:** `ARBSCANNER_DB_SSL_DISABLED` for typical local MySQL without TLS; omit or configure per provider for Railway.
- **Exchange / AI (optional):** `POLYMARKET_*`, `MANIFOLD_*`, `KALSHI_*`, `GEMINI_API_KEY` and related `GEMINI_*` keys for live sync and Gemini-assisted mapping.

**`frontend/.env`** (see [`frontend/.env.example`](frontend/.env.example)):

- **`VITE_API_BASE_URL`** — empty in local dev (proxy); set to your **Render** API URL for Vercel production builds.
- **`VITE_DEV_PROXY_TARGET`** — optional override if the API is not on `127.0.0.1:3001` during dev.

---

## 🧠 Tech Stack

- **Frontend:** Vite 6, React 18, TypeScript, Tailwind CSS 4, React Router 7, Radix UI, Recharts, MUI (selected components).
- **Backend:** Python 3.11+, FastAPI, Uvicorn, Gunicorn, mysql-connector-python, Pydantic-style models across services.
- **Database:** MySQL 8.x (local, Docker, or **Railway**).
- **Infrastructure:** **Vercel** (static SPA from Vite), **Render** (API + worker process via Procfile), **Railway** (MySQL).

---

## 🧾 License

MIT License. Feel free to use and modify with attribution. See the [`LICENSE`](./LICENSE) file for full details.

---

## 👤 Authors

**Ilian Khankhalaev**  
_BSc Computing Science, Simon Fraser University_  
📍 Vancouver, BC  |  [florykhan@gmail.com](mailto:florykhan@gmail.com)  |  [GitHub](https://github.com/florykhan)  |  [LinkedIn](https://www.linkedin.com/in/ilian-khankhalaev/)

**Rushik Behal**  
_BSc Computing Science, Simon Fraser University_  
📍 Vancouver, BC  | [GitHub](https://github.com/Rushik-B)  |  [LinkedIn](https://www.linkedin.com/in/rushik-behal/)

**Arina Veprikova**  
_BSc Data Science, Simon Fraser University_  
📍 Vancouver, BC  |  [GitHub](https://github.com/areenve)  |  [LinkedIn](https://www.linkedin.com/in/arina-veprikova-a97526366/)

**Anna Cherkashina**  
_BSc Data Science, Simon Fraser University_  
📍 Vancouver, BC  | [GitHub](https://github.com/Anna05072005)  |  [LinkedIn](https://www.linkedin.com/in/anna-cherkashina-467059293/)
