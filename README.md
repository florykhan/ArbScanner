# ArbScanner

ArbScanner is a database-driven application for comparing related prediction markets across exchanges, preserving historical quote data, and surfacing arbitrage opportunities. This repository now includes a normalized SQLite backend foundation aligned to the formal schema for exchanges, events, mappings, markets, contracts, price history, and arbitrage alerts.

## What Was Added

- `database/schema/schema.sql`: normalized SQL schema plus analytical views.
- `database/seeds/seed.sql`: realistic sample data covering Manifold, Polymarket, and Kalshi.
- `database/queries/queries.sql`: reusable SQL for the core read paths.
- `backend/utils/db.py`: SQLite initialization helpers with foreign keys enabled.
- `backend/services/manifold_ingest.py`: ingestion-oriented scaffold for importing Manifold binary markets.
- `scripts/init_db.py`: CLI entry point for schema creation and optional seeding.
- `scripts/fetch_manifold.py`: CLI entry point for importing recent binary Manifold markets.
- `tests/test_database.py`: schema and integrity checks.

## Repository Layout

```text
backend/
  services/manifold_ingest.py
  utils/db.py
database/
  queries/queries.sql
  schema/schema.sql
  seeds/seed.sql
scripts/
  init_db.py
  fetch_manifold.py
tests/
  test_database.py
```

## Database Choice

SQLite is used because the repository did not yet have an established database engine. The SQL stays close to the formal specification, with a small SQLite-oriented adaptation:

- primary keys are declared as `INTEGER PRIMARY KEY`
- `DATETIME` values are stored as ISO-8601 text values that SQLite can sort lexicographically
- foreign keys are enforced through `PRAGMA foreign_keys = ON`

## Initialize The Database

Create the schema only:

```bash
python3 scripts/init_db.py
```

Create the schema and load sample data:

```bash
python3 scripts/init_db.py --with-seed
```

The default database file is `database/arbscanner.sqlite`. You can override it:

```bash
python3 scripts/init_db.py --db /tmp/arbscanner.sqlite --with-seed
```

## Run The Manifold Scaffold

Import recent Manifold binary markets into the SQLite database:

```bash
python3 scripts/fetch_manifold.py --limit 25
```

This scaffold is intentionally narrow. It demonstrates how Manifold data maps into the normalized schema without pretending to be a complete production ingestion pipeline.

## Manifold Mapping Assumptions

- `Exchange.Name = 'Manifold Markets'` and `API_base_url = 'https://api.manifold.markets'`.
- Manifold market identifiers are stored in `Market.Exchange_market_code`, using the URL slug when available and falling back to the API `id`.
- Each imported binary Manifold market is initially treated as its own canonical `Event` and gets a `MarketMapping` row automatically.
- `BinaryMarket` always uses `YES` and `NO` labels for Manifold binary markets.
- Manifold's list API exposes a market probability but not a full order book in the fields used here, so ingestion stores `PriceSnapshot.Last` and leaves `Bid`, `Ask`, and `Spread` as `NULL`.
- Richer category or topic mapping would come from additional per-market detail calls such as `GET /v0/market/[marketId]`, which expose topic metadata like `groupSlugs`.

## Core Queries

Reusable read queries live in `database/queries/queries.sql`, including:

- active arbitrage alerts ordered by profit margin
- markets grouped by event across exchanges
- recent snapshot history for a contract
- contracts under a market
- event-to-market mapping overviews

## Run Tests

```bash
python3 -m unittest discover -s tests -p 'test_*.py'
```

The current tests cover:

- schema creation
- seed loading
- foreign key integrity
- uniqueness constraints
- cascade delete behavior for `BinaryMarket` and `PriceSnapshot`

## Future Work

- Add Polymarket and Kalshi ingestion services that populate the same schema.
- Improve canonical event resolution so cross-exchange mappings can be inferred instead of manually curated.
- Add backend APIs and scheduled ingestion jobs once the application stack is in place.
