# ArbScanner

**ArbScanner** is a local-first prediction market arbitrage workstation for a single operator. It continuously scans supported exchanges, compares trusted mapped markets across venues, detects potential negative-risk spreads, and exposes system state through a terminal dashboard. A **Vite + React + TypeScript** web frontend is also included for browsing events, alerts, and related flows (mock data until a live API is wired up).

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

## Temporary MVP mapping

The current live MVP uses a naive title-based mapper in [backend/services/title_mapper_service.py](backend/services/title_mapper_service.py). It does two things:

- tries conservative fuzzy title matching across exchanges
- optionally applies regex alias rules from [backend/config/title_alias_rules.json](backend/config/title_alias_rules.json)

The live sync also supports Gemini-based matching in [backend/services/gemini_mapper_service.py](backend/services/gemini_mapper_service.py). It runs after the regex mapper, checks likely cross-exchange title pairs in parallel, and caches decisions in [backend/config/gemini_match_cache.json](backend/config/gemini_match_cache.json).

Use [backend/config/title_alias_rules.example.json](backend/config/title_alias_rules.example.json) as the template when you want to force known Polymarket and Manifold titles into the same event for MVP demos.

---

## Run locally (frontend)

You can run the frontend with **Node.js 20+** and **npm** (or **pnpm** / **yarn**).

### Install dependencies

```bash
cd frontend
npm install
```

### Environment (optional)

Copy **`frontend/.env.example`** to **`frontend/.env`** and set **`VITE_API_URL`** when your backend is available (for example `http://localhost:3001`). Until then, the UI uses **mock data** bundled with the app.

```bash
cd frontend
cp .env.example .env
```

### Start the dev server

```bash
cd frontend
npm run dev
```

Runs at **http://localhost:5173** (port in **`frontend/vite.config.ts`**). **`npm run build`** writes a production bundle to **`frontend/dist/`**; **`npm run preview`** serves that build locally.

The frontend uses **Tailwind CSS**. Dashboard, events, alerts, and admin flows work against **mock data** without a running API; set **`VITE_API_URL`** when you connect the backend.
