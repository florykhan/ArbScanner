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
