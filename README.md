# ArbScanner

**ArbScanner** is a local-first prediction market arbitrage workstation for a single operator. It continuously scans supported exchanges, compares trusted mapped markets across venues, detects potential negative-risk spreads, and exposes system state through a terminal dashboard.

---

## Project Overview

The goal of this project is to:

- store and organize exchange, event, market, contract, snapshot, and alert data
- build a semantic mapping layer for identifying equivalent markets across exchanges
- run a deterministic arbitrage engine on trusted mapped markets
- deliver a terminal UI for monitoring scanner activity and active alerts

The primary planning document is [docs/final-documentation/arbscanner-product-plan.md](/Users/Rushik/Downloads/ArbScanner/docs/final-documentation/arbscanner-product-plan.md).

## Current Backend Entry Points

- Mock scan: `python3 -m backend.run_mock_scan`
- Live Polymarket sync: `python3 -m backend.run_polymarket_sync --limit 50`
- Live Manifold sync: `python3 -m backend.run_manifold_sync --limit 50`
- Live Kalshi sync: `python3 -m backend.run_kalshi_sync --limit 50`
- Combined live sync: `python3 -m backend.run_live_sync --polymarket-limit 50 --manifold-limit 50 --kalshi-limit 50`
- Terminal dashboard: `python3 -m terminal.run_dashboard`

## Temporary MVP Mapping

The current live MVP uses a naive title-based mapper in
[title_mapper_service.py](/Users/Rushik/Downloads/ArbScanner/backend/services/title_mapper_service.py).
It does two things:

- tries conservative fuzzy title matching across exchanges
- optionally applies regex alias rules from
  [title_alias_rules.json](/Users/Rushik/Downloads/ArbScanner/backend/config/title_alias_rules.json)

Use [title_alias_rules.example.json](/Users/Rushik/Downloads/ArbScanner/backend/config/title_alias_rules.example.json)
as the template when you want to force known Polymarket and Manifold titles into the same event for MVP demos.
