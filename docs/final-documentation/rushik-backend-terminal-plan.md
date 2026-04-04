# Rushik Backend And Terminal Plan

## 1. Purpose Of This Document

This document is the execution plan for Rushik's part of ArbScanner.

It is not the full team product plan.
It is the personal build plan for:

- backend application logic
- scanner flow
- arbitrage logic
- alert lifecycle
- terminal UI

The goal is to make Rushik's responsibilities concrete enough that implementation can start without constant re-planning.

## 2. Rushik's Scope

Rushik owns the application behavior side of ArbScanner.

In simple terms:

- consume trusted market data
- evaluate arbitrage opportunities
- persist and update alerts
- expose scanner state
- build the terminal UI that shows all of this

Rushik does not own:

- the database normalization milestone
- the main web frontend
- report-first documentation ownership

Rushik may or may not own exchange adapter code depending on final team agreement, but the backend should be designed so that exchange ingestion can plug in cleanly either way.

## 3. Main Goal

Build the "brain plus operator console" part of ArbScanner.

That means:

- the brain scans markets and decides when an opportunity exists
- the operator console shows what the brain is doing

If this workstream is done correctly, the same backend logic should support:

- Rushik's terminal UI
- Ilian's web frontend if needed later

## 4. Working Principle

Rushik should build backend-first, then terminal on top.

Do not start by making the terminal look good.
Start by making the terminal have something real to show.

The right sequence is:

1. lock data contract
2. lock scanner logic
3. lock alert query shape
4. build terminal against those real outputs

## 5. Success Criteria

Rushik's workstream is successful when all of the following are true:

- normalized market data can be consumed by the backend
- latest prices can be scanned against trusted mappings
- arbitrage opportunities can be detected deterministically
- alerts can be written to the database
- active alerts can be queried in a readable form
- alerts can be dismissed or expired
- terminal UI can display scanner state and active alerts cleanly

## 6. Immediate Priorities

These are the next things Rushik should care about, in order:

1. define the backend input contract
2. define the alert output contract
3. define the scanner loop behavior
4. define the main terminal screen behavior

Everything else is secondary until these are stable.

## 7. Dependencies On Other People

### 7.1 Dependency On Anna And Areen

Rushik depends on:

- the baseline schema
- the agreed table names
- the current SQL dump remaining stable enough to build against

Rushik should not block waiting for a perfect long-term schema. The current dump is the implementation baseline unless the team agrees to change it.

### 7.2 Dependency On Ilian

Rushik depends on one of two outcomes:

- Ilian owns exchange adapters and hands over normalized market data
- or that work shifts and Rushik takes exchange ingestion directly

The important thing is not who owns it.
The important thing is that Rushik gets a clear normalized input contract.

## 8. Backend-First Plan

Rushik's backend should be built in layers.

### 8.1 Layer 1: Input Contract

Goal:
Define the exact shape of the market data the scanner consumes.

Minimum fields expected from normalized market data:

- exchange name
- exchange market code
- event title or event identifier
- outcome label
- bid
- ask
- last
- snapshot timestamp

Optional but useful:

- contract identifier from source exchange
- URL or traceability metadata
- binary-market flags

Done means:
Rushik can write scanner logic against one standard payload shape instead of raw exchange-specific responses.

### 8.2 Layer 2: Database Access Contract

Goal:
Define exactly which tables the backend reads and writes.

Rushik reads from:

- `Exchange`
- `Event`
- `MarketMapping`
- `Market`
- `BinaryMarket`
- `Contract`
- `PriceSnapshot`

Rushik writes or updates:

- `PriceSnapshot`
- `ArbitrageAlert`

Done means:
The scanner has a clear persistence contract and the terminal has a clear read model.

### 8.3 Layer 3: Deterministic Scanner Logic

Goal:
Evaluate trusted mapped markets for negative-risk opportunities.

Minimum v1 logic:

- get latest relevant quotes
- find opposing outcomes in trusted mapped markets
- compute total cost
- compare against settlement floor
- calculate profit margin
- create or update alert state

Important rule:
No LLM logic belongs here.
This layer is math and rules only.

Done means:
The engine can repeatedly answer "is there an opportunity here?"

### 8.4 Layer 4: Alert Read Model

Goal:
Prepare the terminal-facing view of alerts.

The backend should expose a query that returns:

- alert id
- event title
- involved exchanges
- profit margin
- status
- detected time

This is the query the terminal should depend on.

Done means:
The terminal can be built against a stable row shape.

### 8.5 Layer 5: Alert Actions

Goal:
Support operator actions from the terminal.

Minimum v1 action:

- dismiss alert by updating `ArbitrageAlert.Status`

Done means:
The terminal is not read-only and can satisfy the CRUD/demo requirement on the operator side.

## 9. Terminal Plan

The terminal should be built only after the backend contracts above are stable enough.

### 9.1 Terminal Purpose

The terminal is the operator dashboard.

It should answer:

- is the scanner healthy
- what was scanned recently
- what alerts are active
- what should I inspect right now

### 9.2 Main Terminal Screen

The first terminal screen should include:

- header with product name and scan status
- stats summary with counts
- left-side activity feed or scan log
- center alert table
- keyboard hint/footer

### 9.3 Terminal Interactions

Minimum v1 interactions:

- move through alerts with keyboard
- dismiss selected alert
- refresh current data
- quit cleanly

### 9.4 Terminal Rule

The terminal should not contain arbitrage logic.
It should call backend-owned reads and actions.

## 10. Proposed File Structure

This structure is based on the current repository skeleton and Rushik's responsibilities.

### 10.1 Root `backend/`

Rushik should primarily work inside:

- `backend/services/`
- `backend/utils/`
- `backend/models/` if lightweight application models or DTOs are useful

The recommended planned structure is:

```text
backend/
  services/
    scanner_service.py
    arbitrage_service.py
    alert_service.py
    market_data_service.py
  utils/
    db.py
    config.py
    time_utils.py
  models/
    market_payload.py
    alert_view.py
```

What each file should roughly mean:

- `scanner_service.py`: orchestrates scan cycles
- `arbitrage_service.py`: pure deterministic evaluation logic
- `alert_service.py`: create, update, expire, and query alerts
- `market_data_service.py`: normalized data handling and latest-price lookup
- `db.py`: DB connection and shared query helpers
- `config.py`: environment or local settings
- `time_utils.py`: timestamp and freshness helpers
- `market_payload.py`: normalized input shape definition
- `alert_view.py`: terminal/web-facing alert row shape

### 10.2 `terminal/`

Rushik should primarily work inside:

- `terminal/tui/`
- `terminal/docs/`
- `terminal/tests/`

The recommended planned structure is:

```text
terminal/
  tui/
    app.py
    screens/
      dashboard.py
    widgets/
      alert_table.py
      activity_log.py
      status_bar.py
    actions/
      dismiss_alert.py
  docs/
    terminal-spec.md
  tests/
    test_terminal_queries.md
```

What each file should roughly mean:

- `app.py`: Textual app entry point
- `screens/dashboard.py`: primary operator screen
- `widgets/alert_table.py`: alert table rendering
- `widgets/activity_log.py`: scan feed or recent activity panel
- `widgets/status_bar.py`: scanner health and summary counts
- `actions/dismiss_alert.py`: terminal-triggered alert mutation behavior
- `terminal-spec.md`: notes on layout, keys, and user flow

The exact filenames can change later, but the split should stay similar.

## 11. Recommended Build Order

This is the order Rushik should work in unless there is a strong reason to change it.

### Step 1: Lock The Input Contract

Output:

- one normalized market payload definition

Why first:

- everything downstream depends on it

### Step 2: Lock The Alert Row Contract

Output:

- one query shape for active alerts

Why second:

- the terminal should be built against a real row structure, not guesswork

### Step 3: Build Scanner Services

Output:

- scan cycle orchestration
- deterministic evaluation logic
- alert creation/update behavior

Why third:

- this is the actual application brain

### Step 4: Build Terminal Dashboard

Output:

- one working operator screen backed by real backend outputs

Why fourth:

- now the UI reflects real system behavior instead of mocked assumptions

### Step 5: Tighten Reliability

Output:

- better logging
- stale data checks
- error handling
- improved refresh behavior

Why fifth:

- reliability matters more after the basic loop exists

## 12. Detailed Milestones For Rushik

### Milestone A: Backend Contracts

Rushik should finish:

- normalized market payload definition
- alert row definition
- list of required SQL reads and writes

### Milestone B: Scanner Skeleton

Rushik should finish:

- DB connection helper
- latest-price retrieval logic
- deterministic spread evaluation skeleton
- alert insert/update flow

### Milestone C: Terminal Skeleton

Rushik should finish:

- Textual app entry point
- dashboard screen layout
- alert table connected to backend query
- dismiss action connected to alert update

### Milestone D: End-To-End Loop

Rushik should finish:

- scanner updates snapshots and alerts
- terminal displays current alerts
- dismiss action reflects in DB

## 13. Questions Rushik Should Keep Asking During Implementation

These are the questions that matter most while building:

- what exact shape am I receiving from the API side
- what exact rows does the terminal need
- what exact rule determines that an alert is new versus duplicate
- what exact rule determines that an alert is stale or expired
- what exact fields are stable in the current schema versus likely to move

## 14. What Not To Do Right Now

Rushik should avoid these traps early:

- building a fancy terminal before scanner outputs exist
- embedding arbitrage logic inside UI code
- waiting for perfect long-term schema redesign
- over-optimizing the LLM mapping layer before the scan loop works
- coupling the backend only to the terminal and making web reuse harder

## 15. Personal Working Loop

Rushik should use this loop while building:

1. lock one contract
2. implement one backend capability
3. verify what data it reads and writes
4. connect one terminal behavior to it
5. only then move to the next layer

This keeps work controlled and reduces overwhelm.

## 16. What To Do Next

The immediate next move should be:

1. define the normalized payload contract
2. define the active-alert query shape
3. define the dismiss-alert mutation

Those three things are the foundation for everything else in Rushik's lane.

## 17. Final Summary

Rushik should think about the work this way:

- backend first
- terminal second
- contracts before polish
- shared application logic, not UI-specific logic

If Rushik builds the scanner and alert system cleanly, the terminal becomes straightforward and the web app can reuse the same backend outputs later.
