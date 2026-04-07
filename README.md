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

The SQL implementation uses MySQL-compatible DDL with InnoDB tables while staying faithful to the formal relational design.
