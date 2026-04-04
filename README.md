# 🔍 ArbScanner — Compare Markets, Find Edges

**ArbScanner** is a **database-driven web application** for browsing **real-world events**, **comparing prediction markets across multiple exchanges**, **inspecting contract prices**, and **identifying arbitrage opportunities**. The system holds structured data—exchanges, events, markets, contracts, price snapshots, and alerts—so users can **explore and analyze** it in one place. **Day-to-day use** is **read-focused**; **admin** work (insert, update, delete) is handled **separately**.

---

## 🎯 Project Overview

The goal of this project is to:

- **Store** and organize market and event data so it is easy to compare and query.
- **Highlight** price differences and potential arbitrage across venues.
- **Deliver** a simple web UI for browsing and analysis, with **admin operations** kept apart from ordinary browsing.

More detail (stack, setup, deployment, and repo layout) will land here as the project grows.

## Database Backend Additions

The repository now includes a normalized SQLite backend foundation for exchanges, events, mappings, markets, binary market subtype data, contracts, historical snapshots, and arbitrage alerts.

### Added Files

- `database/schema/schema.sql`: normalized SQL schema plus analytical views.
- `database/seeds/seed.sql`: sample data covering Manifold, Polymarket, and Kalshi.
- `database/queries/queries.sql`: reusable SQL for core read paths.
- `backend/utils/db.py`: SQLite initialization helpers with foreign keys enabled.
- `backend/services/manifold_ingest.py`: ingestion scaffold for importing Manifold binary markets.
- `scripts/init_db.py`: CLI entry point for schema creation and optional seeding.
- `scripts/fetch_manifold.py`: CLI entry point for importing recent binary Manifold markets.
- `tests/test_database.py`: schema and integrity checks.

### Database Choice

SQLite is used because the repository did not yet have an established database engine. The SQL stays close to the formal specification, with small SQLite-oriented adaptations:

- primary keys use `INTEGER PRIMARY KEY`
- `DATETIME` values are stored as ISO-8601 text values
- foreign keys are enforced with `PRAGMA foreign_keys = ON`

### Setup

Create the schema only:

```bash
python3 scripts/init_db.py
```

Create the schema and load sample data:

```bash
python3 scripts/init_db.py --with-seed
```

Use a custom database file:

```bash
python3 scripts/init_db.py --db /tmp/arbscanner.sqlite --with-seed
```

### Manifold Scaffold

Import recent Manifold binary markets into the SQLite database:

```bash
python3 scripts/fetch_manifold.py --limit 25
```

Current Manifold mapping assumptions:

- `Exchange.Name = 'Manifold Markets'`
- `API_base_url = 'https://api.manifold.markets'`
- `Market.Exchange_market_code` uses the Manifold URL slug when available, otherwise the API market `id`
- each imported binary market is initially treated as its own canonical `Event` and auto-linked through `MarketMapping`
- the list endpoint provides a probability but not a full bid/ask book in this scaffold, so `PriceSnapshot.Last` is populated while `Bid`, `Ask`, and `Spread` remain `NULL`

### Queries And Tests

Reusable SQL queries live in `database/queries/queries.sql`, including:

- active arbitrage alerts ordered by profit margin
- markets by event across exchanges
- snapshot history for a contract
- contracts under a market
- event-to-market mapping overview

Run the database tests with:

```bash
python3 -m unittest discover -s tests -p 'test_*.py'
```

For the formal database design writeup covering the relational schema, functional dependencies, candidate keys, foreign keys, and 3NF justification, see `docs/database_design.md`.
