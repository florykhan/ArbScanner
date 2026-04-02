# 🔍 ArbScanner — Compare Markets, Find Edges

**ArbScanner** is a **database-driven web application** for browsing **real-world events**, **comparing prediction markets across multiple exchanges**, **inspecting contract prices**, and **identifying arbitrage opportunities**. The system holds structured data—exchanges, events, markets, contracts, price snapshots, and alerts—so users can **explore and analyze** it in one place. **Day-to-day use** is **read-focused**; **admin** work (insert, update, delete) is handled **separately**.

---

## 🎯 Project Overview

The goal of this project is to:

- **Store** and organize market and event data so it is easy to compare and query.
- **Highlight** price differences and potential arbitrage across venues.
- **Deliver** a simple web UI for browsing and analysis, with **admin operations** kept apart from ordinary browsing.

More detail (stack, setup, deployment, and repo layout) will land here as the project grows.

---

## 🧰 Run Locally (Frontend)

You can run the **frontend** with **Node.js 20+** and **npm** (or **pnpm** / **yarn**).

### 1️⃣ Install dependencies

```bash
cd frontend
npm install
```

### 2️⃣ Environment (optional)

Copy **`.env.example`** to **`.env`** and set **`VITE_API_URL`** when your backend is available (for example `http://localhost:3001`). Until then, the UI uses **mock data** bundled with the app.

```bash
cp .env.example .env
```

### 3️⃣ Start the dev server

```bash
npm run dev
```

Runs at **http://localhost:5173** (port in **`vite.config.ts`**). **`npm run build`** writes a production bundle to **`frontend/dist/`**; **`npm run preview`** serves that build locally.

> 🗒️ **Note:**  
> The **frontend** is a **Vite + React + TypeScript** app with **Tailwind CSS**. Dashboard, events, alerts, and admin flows work against **mock data** without a running API; set **`VITE_API_URL`** when you connect the backend.
