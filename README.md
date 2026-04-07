# 🔍 ArbScanner — Compare Markets, Find Edges

**ArbScanner** is a **database-driven web application** for browsing **real-world events**, **comparing prediction markets across multiple exchanges**, **inspecting contract prices**, and **identifying arbitrage opportunities**. The system holds structured data—exchanges, events, markets, contracts, price snapshots, and alerts—so users can **explore and analyze** it in one place. **Day-to-day use** is **read-focused**; **admin** work (insert, update, delete) is handled **separately**.

---

## 🎯 Project Overview

The goal of this project is to:

- **Store** and organize market and event data so it is easy to compare and query.
- **Highlight** price differences and potential arbitrage across venues.
- **Deliver** a simple web UI for browsing and analysis, with **admin operations** kept apart from ordinary browsing.

More detail (stack, setup, deployment, and repo layout) will land here as the project grows.

## Database Deliverables

This branch includes the database-side deliverables for ArbScanner.

- `database/schema/schema.sql`: normalized SQL schema for exchanges, events, mappings, markets, contracts, snapshots, and arbitrage alerts
- `database/seeds/seed.sql`: sample SQL data for the schema
- `database/queries/queries.sql`: useful SQL queries for the core read scenarios
- `docs/database_design.md`: relational schema, functional dependencies, keys, foreign keys, and 3NF/BCNF design writeup

The SQL implementation uses SQLite-compatible DDL while staying faithful to the formal relational design.

---

## Development setup

### Prerequisites

- **Node.js** (LTS recommended) and **npm**

### Backend API

From the repository root:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API listens on **port 4000** by default (`PORT` in `.env`). Mock data is used when `USE_MOCK_DATA=true` (default); see `backend/.env.example` for MySQL-related variables when you switch data sources later.

### Frontend (Vite + React)

In a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

The UI is served at **http://localhost:5173** (Vite default). In development, API requests to `/api/...` are **proxied** to `http://127.0.0.1:4000` (see `frontend/vite.config.js`), so you normally do **not** need to set a base URL while both processes run locally.

**Production-style builds:** If you serve the built frontend separately from the API, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL` to your API origin (for example `http://localhost:4000`). Rebuild with `npm run build`. Ensure the backend **CORS** settings allow your frontend origin (`CORS_ORIGIN` in `backend/.env`).

### Quick check

- Backend health: open or `curl` **http://localhost:4000/api/health**
- With both servers running, use the app in the browser at **http://localhost:5173** (dashboard, events, markets, alerts, snapshots pages call the backend).
