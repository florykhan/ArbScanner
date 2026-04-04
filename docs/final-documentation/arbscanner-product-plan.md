# ArbScanner Product Plan

## 1. Product Definition

ArbScanner is a single-user, local-first prediction market arbitrage workstation.

Its job is to continuously scan multiple prediction exchanges, determine which markets refer to the same real-world event, compare opposing outcomes across venues, detect negative-risk opportunities, and surface those opportunities through a fast terminal interface.

This is not a SaaS product.
This is not a multi-user platform.
This is not a web app.

The intended shape is:

- one operator
- one machine
- one local database
- one always-on scanner
- one terminal dashboard used as a control surface

The product should feel like a personal trading tool that stays running in the background and becomes visible when the user opens the terminal UI.

## 2. Product Ethos

ArbScanner should be built around the following principles:

- Local-first. The system is designed for one user operating on their own machine.
- Operator-first. The software should help the user make decisions quickly, not impress them with a flashy UI.
- Information-dense. The terminal should expose the state of the system in a way that is readable in seconds.
- Correctness over volume. A smaller number of trustworthy alerts is better than a large number of weak or noisy alerts.
- Deterministic where possible. The arbitrage engine should be math-driven and repeatable.
- Intelligence where necessary. Market mapping is semantic and should use an LLM with web context rather than brittle regex-only logic.
- Separation of concerns. The semantic mapping system and the real-time scanning engine are different systems and should not be mixed together.

## 3. Core Use Case

The main use case is simple:

1. The user starts ArbScanner on their own machine.
2. ArbScanner ingests market data from supported exchanges.
3. ArbScanner maps raw markets to trusted canonical events.
4. ArbScanner continuously scans trusted mappings for arbitrage opportunities.
5. ArbScanner records alerts in the database.
6. The user opens the terminal UI to see what the system is doing, inspect opportunities, and dismiss noise.

The core user question is:

"Across the markets I trust, is there a guaranteed-profit spread right now?"

Everything in the system should support answering that question.

## 4. Problem Statement

Prediction markets are fragmented across exchanges.

The same underlying event can appear on multiple platforms with different naming, wording, liquidity, and pricing. Those differences create inefficiencies. If opposite outcomes across different exchanges can be bought for less than the guaranteed settlement value, the spread may imply a risk-free or near-risk-free opportunity.

The hard part is not only the math.
The hard part is knowing whether two contracts truly refer to the same event and whether their outcomes are genuinely opposite in settlement terms.

That means ArbScanner has two distinct product problems:

- semantic understanding of market equivalence
- deterministic detection of arbitrage once equivalence is trusted

## 5. Target User

The target user is the builder-operator:

- a technically comfortable individual
- running the tool locally
- scanning markets for personal use
- willing to manually inspect opportunities
- not requiring multi-user collaboration, tenancy, or hosted infrastructure

This can later be open-sourced, but the product should still be designed as a personal workstation tool rather than a shared platform.

## 6. Non-Goals

The following are explicitly out of scope for the initial product direction:

- multi-user accounts
- hosted deployment
- browser-based dashboard as the primary interface
- collaborative workflows
- trade execution automation in early phases
- portfolio management
- tax reporting
- social features
- enterprise-grade permissions

These can be revisited later if the product direction changes, but they should not shape the architecture now.

## 7. High-Level System Model

ArbScanner should be understood as two major operating surfaces:

### 7.1 Background Scanner

This is the always-on process.

Responsibilities:

- fetch market data from exchange APIs
- normalize raw inputs
- resolve or apply trusted mappings
- evaluate arbitrage opportunities
- write snapshots, scan logs, and alerts to the database
- manage alert freshness and lifecycle

### 7.2 Terminal Dashboard

This is the operator interface.

Responsibilities:

- show scanner health and status
- show active alerts
- show recent scan activity
- allow dismissal or acknowledgement of alerts
- make the system understandable in seconds

The terminal UI is not the scanner itself. It is the view into the scanner.

## 8. End-to-End User Experience

### 8.1 Starting the System

When the user starts ArbScanner, the expected behavior is:

1. connect to the local database
2. load supported exchanges and trusted mappings
3. fetch fresh market data from exchange APIs
4. perform an initial full scan of the trusted market universe
5. write snapshots and alerts
6. enter a continuous scan loop

The first startup impression should be:

- system connected
- data sources reachable
- trusted market universe loaded
- initial scan complete
- current opportunities available

### 8.2 Ongoing Operation

Once running, ArbScanner should loop continuously:

1. poll exchange APIs
2. update price snapshots
3. scan all trusted mapped events
4. create new alerts when opportunities appear
5. mark stale or invalid alerts as expired
6. emit scan log entries

The system should feel quiet and reliable, not noisy or theatrical.

### 8.3 Opening the Terminal UI

When the user opens the terminal dashboard, they should immediately see:

- whether the scanner is healthy
- when the last scan ran
- how many events were scanned
- how many active alerts exist
- which opportunities are worth looking at right now

The terminal should let the user navigate quickly, inspect state, and dismiss irrelevant alerts.

### 8.4 Expected Daily Usage

The expected pattern is:

- the scanner runs in the background
- the user opens the terminal when they want visibility
- the user does not babysit the system constantly
- the user uses the dashboard as a trading console, not a toy interface

## 9. Data and Logic Model

### 9.1 Two Different Kinds of Logic

ArbScanner has two fundamentally different kinds of logic:

#### A. Market Mapping Logic

This is an inference problem.

Question:
"Do these raw markets from different exchanges refer to the same underlying event, and are their outcomes actually comparable?"

This logic is semantic, contextual, and non-trivial. It should use an LLM with web context, exchange page context, and resolution-rule awareness when needed.

Regex and string matching can support this process, but should not be treated as the final authority.

#### B. Arbitrage Evaluation Logic

This is a deterministic decision problem.

Question:
"Given trusted mappings and current prices, do these contracts imply a profitable negative-risk spread?"

This logic should be math-driven, predictable, testable, and fast.

### 9.2 Important Architectural Rule

The semantic mapping system should not sit in the hot real-time scan loop.

The right shape is:

- mapping pipeline: slower, inference-heavy, confidence-driven
- arbitrage engine: faster, deterministic, repeatedly scanning trusted mappings

This keeps the scanner fast, debuggable, and cheaper to operate.

## 10. Market Universe Strategy

The product should eventually scan all supported markets on supported exchanges, but not all raw markets should immediately enter the arbitrage engine.

The practical rule should be:

- ingest broad raw market data
- trust only mapped and approved market groups for arbitrage scanning
- scan all trusted mapped events each cycle

So the scanner should cover the whole trusted universe, not the whole unverified internet.

For early phases, the trusted universe can be much smaller and manually curated.

## 11. Core Detection Concept

The first arbitrage strategy is negative risk across mutually exclusive outcomes.

Example:

- Exchange A: `Yes` ask = `0.45`
- Exchange B: `No` ask = `0.50`
- Total cost = `0.95`
- Guaranteed payout = `1.00`
- Gross profit = `0.05`

The initial engine should answer:

"Is the sum of the cheapest opposing positions below the settlement floor?"

Later phases can add:

- fee-aware calculations
- liquidity-aware sizing
- slippage modeling
- stale quote rejection
- multi-outcome market logic
- more advanced spread classes

## 12. Alert Lifecycle

An alert should move through a simple lifecycle:

- `Active`: currently believed to be valid
- `Expired`: dismissed by the user or invalidated by newer prices

In later phases, lifecycle states may expand:

- `Acknowledged`
- `Executed`
- `Suppressed`
- `Invalid`

But for the initial product, keeping this simple is better.

## 13. Proposed Product Modes

To keep the design clean, ArbScanner should be thought of as three operating modes even if they live in one repository.

### 13.1 Scanner Mode

Runs continuously.

Responsibilities:

- API polling
- snapshot persistence
- arbitrage evaluation
- alert lifecycle updates

### 13.2 Terminal Mode

Runs when the user wants visibility.

Responsibilities:

- read system status
- show alert table
- show activity feed
- allow alert dismissal

### 13.3 Maintenance and Admin Mode

Used for setup and tooling.

Responsibilities:

- configure supported exchanges
- review mappings
- seed or migrate data
- test adapters

This mode does not need to be polished in the early phases.

## 14. Recommended Repository Boundary

The clean split for this repository should be:

### Root `backend/`

Owns:

- exchange API adapters
- normalization logic
- semantic market mapping pipeline
- deterministic arbitrage engine
- DB access layer
- alert services
- scanner loop

### `terminal/`

Owns:

- Textual application
- terminal layout
- widgets
- polling and refresh behavior for the UI
- keyboard interaction

The terminal should consume backend-owned read and action functions rather than reimplementing scanner logic or business rules.

## 15. Desired End-User Experience

The desired feeling is:

- the tool is always on
- it is fast to inspect
- it is trustworthy
- it looks serious
- it stays out of the way until needed

The user should be able to open the terminal and understand the system state within roughly five seconds.

The product should feel closer to a personal market console than a polished consumer app.

## 16. Phase-by-Phase Plan

This plan is intentionally high level so that deeper design and implementation can be delegated later.

### Phase 0: Product Alignment and Local Architecture

Goal:
Establish the local-first, single-user shape of the product and lock the system boundaries.

Deliverables:

- product plan and architecture notes
- repository structure aligned around backend plus terminal
- local environment assumptions documented
- scanner mode versus terminal mode clearly separated

Key decisions to lock:

- single-user local operation
- scanner runs independently of terminal visibility
- root backend owns business logic
- terminal owns presentation only

Done means:
The team can describe the product in one sentence and agree on how it behaves when started.

### Phase 1: Direct API Ingestion Foundations

Goal:
Connect directly to target exchange APIs and prove reliable raw data ingestion.

Deliverables:

- exchange adapter layer
- per-exchange fetchers
- normalized raw market payload format
- snapshot persistence
- logging around fetch success and failure

Questions to answer:

- which exchanges are supported first
- what rate limits apply
- what fields are required from each exchange
- how timestamps are normalized

Not in this phase:

- LLM-based mapping finalization
- advanced alerting
- terminal polish

Done means:
ArbScanner can repeatedly ingest raw market data from chosen exchanges and persist usable snapshots.

### Phase 2: Semantic Market Mapping System

Goal:
Build the system that decides which markets refer to the same underlying event.

Deliverables:

- canonical event concept
- candidate matching workflow
- LLM-assisted mapping process with web-aware context
- confidence score or review status
- evidence storage or rationale notes
- trusted mapping output consumable by the scanner

Key design rule:
This layer is slower and more intelligent than the scanner. It should prepare trusted truth, not run inside the hot path every scan cycle.

Questions to answer:

- how mappings are approved
- how manual review works
- what confidence threshold qualifies as trusted
- how outcome polarity is stored

Done means:
The system can take raw cross-exchange markets and produce a trusted mapped event universe for scanning.

### Phase 3: Deterministic Arbitrage Engine

Goal:
Turn trusted mappings and live prices into actionable alerts.

Deliverables:

- engine that evaluates negative-risk opportunities
- latest-price selection logic
- fee and freshness assumptions documented
- dedupe rules for alert creation
- alert lifecycle management

Key rule:
No guessing in this layer. Inputs should already be trusted enough to compute against.

Questions to answer:

- how duplicate alerts are suppressed
- how long alerts remain active
- whether stale quotes are ignored
- whether minimum spread thresholds are enforced

Done means:
The engine can scan the trusted market universe on a loop and create stable alerts in the database.

### Phase 4: Terminal Dashboard

Goal:
Expose scanner state and opportunities through a serious, low-friction terminal interface.

Deliverables:

- dashboard layout
- scanner status and health summary
- alert table
- scan activity feed
- keyboard navigation
- alert dismissal action

Terminal UX goals:

- understand state quickly
- navigate with keyboard only
- keep important numbers visible
- avoid decorative clutter

Done means:
The operator can open the terminal, see what the scanner is doing, inspect active opportunities, and dismiss noise.

### Phase 5: Operational Hardening

Goal:
Make the product dependable for long-running personal use.

Deliverables:

- retry logic
- failure logging
- startup checks
- stale data detection
- health indicators
- better local run scripts
- basic automated tests for deterministic engine logic

Questions to answer:

- what happens when an exchange API fails
- what happens when DB access fails
- how the system recovers after downtime
- how the scanner is supervised locally

Done means:
The system can stay running for extended periods without becoming fragile or opaque.

### Phase 6: Advanced Intelligence and Trading Workflow

Goal:
Expand from a scanner into a stronger operator tool once the foundation is stable.

Potential additions:

- richer mapping confidence workflows
- more exchanges
- more complex arbitrage types
- notifications
- opportunity ranking
- liquidity-aware position sizing
- execution-assist tooling
- eventual optional trade automation

This phase should only begin after the core loop is reliable.

## 17. Recommended First Implementation Slice

Even though the long-term plan starts with direct APIs, the first implementation slice should still be narrow enough to prove the architecture.

Recommended slice:

1. connect to one or two real exchange APIs
2. normalize raw responses
3. define a tiny trusted mapped market universe manually
4. evaluate one deterministic negative-risk rule
5. persist alerts
6. show those alerts in the terminal

This proves the end-to-end system without needing a full autonomous mapping pipeline on day one.

## 18. Open Design Questions

These questions should be resolved before deeper implementation work is delegated:

- Which exchange APIs are in phase 1?
- What is the canonical normalized market schema?
- What is the trusted mapping schema?
- How is outcome polarity represented?
- How are fees handled in spread calculations?
- What quote freshness threshold makes a price usable?
- What exact rule prevents duplicate alert spam?
- Should scanner and terminal run as separate commands?
- What startup command should feel like the default user entry point?

## 19. Suggested Delegation Boundaries

This plan is suitable for splitting into later focused workstreams.

Possible subsets:

- exchange adapter design
- mapping system data model
- deterministic engine spec
- terminal UI spec
- alert lifecycle and dedupe rules
- local operations and run model

Each of those can be expanded independently once the top-level product shape is accepted.

## 20. Summary

ArbScanner is best understood as a local, always-on arbitrage scanner plus a terminal control panel.

The market mapping layer is semantic and should use LLM-assisted inference with web-aware context.
The arbitrage engine is deterministic and should operate only on trusted mapped inputs.

The product should be built for one user, one machine, and one serious operating workflow.

The most important thing to preserve through every phase is the architectural separation between:

- slow, intelligent market understanding
- fast, repeatable arbitrage evaluation

If that line stays clean, the system can evolve safely.

## 21. Current Team Project Context

This repository is serving two realities at once:

- a long-term personal product vision centered on a terminal-first operator workflow
- a course project with milestone requirements around schema design, normalization, SQL, documentation, demo presentation, and a visible application interface

That means the implementation should be shaped so it can satisfy the class deliverable without damaging the long-term product direction.

The practical implication is:

- the backend should be interface-agnostic
- the same backend should be able to support both a web frontend and a terminal UI
- database milestone work should be respected as part of the course deliverable
- product logic should not be trapped inside the web layer

## 22. Current Working Team Split

Based on the current group discussion, the working split should be treated as follows unless the team explicitly changes it.

### 22.1 Anna and Areen

Own:

- functional dependencies
- schema design
- 3NF normalization milestone
- SQL-focused database milestone work
- dataset collection or backup data work for reporting needs
- report-facing data references where required

Their work should be treated as the academic database foundation of the project.

### 22.2 Ilian

Owns:

- main web frontend
- UI structure for the class demo
- frontend integration direction
- likely final visual integration of the main demo flow

There is also a stated intent from Ilian to handle exchange API endpoint connection work.

That creates an important dependency boundary:

- if Ilian fully owns exchange adapters, backend logic should consume normalized data from that layer
- if Ilian does not complete or own that layer, API ingestion may need to shift into backend ownership

### 22.3 Rushik

Owns:

- terminal UI
- backend application logic
- scanner flow
- arbitrage logic
- alert creation and lifecycle handling
- database integration from the application side

This means Rushik's role is not the academic database milestone itself and not the main web frontend. The role is the operator-facing and logic-heavy part of the system.

## 23. Rushik's Personal Workstream

Rushik's work should be designed around one core responsibility:

"Given trusted market data, make the app behave like a real arbitrage scanner and expose that behavior through the terminal."

That breaks into two areas.

### 23.1 Backend Logic Ownership

Rushik should own:

- scanner orchestration
- normalized market consumption
- market comparison logic
- deterministic arbitrage evaluation
- alert persistence
- alert status updates
- reads needed by the terminal dashboard

The backend should answer questions like:

- what markets were scanned
- what opportunities are active
- why an alert exists
- when an alert became stale or was dismissed

### 23.2 Terminal UI Ownership

Rushik should own:

- terminal-first operator experience
- dashboard layout
- active alert table
- scan feed or activity log
- keyboard actions
- dismissal flow
- health and status visibility

The terminal should be treated as a serious operator console, not as a copy of the web UI.

## 24. How Rushik's Work Fits With Everyone Else's

The clean mental model is:

- Anna and Areen define and validate the database foundation
- Ilian defines the web-facing presentation layer
- Rushik defines the application behavior and terminal operator flow

In practical terms:

- the DB team defines what data structures exist
- the API layer provides market data
- Rushik turns that data into scanner behavior
- the terminal reads from Rushik-owned backend logic
- the web frontend can also consume the same backend outputs where needed

This means Rushik should not wait for the full web app to be done before building useful backend logic.

It also means the backend should not be written as "terminal-only" logic. It should be shared application logic that the terminal uses directly and the web app can reuse later.

## 25. Required Handoff Into Rushik's Backend

If Ilian owns the exchange API adapter layer, the backend should request a clear normalized contract from that layer.

Rushik should not have to parse five different exchange response shapes inside the arbitrage engine.

The required handoff should be one normalized market payload shape containing fields such as:

- exchange name
- exchange market code
- canonical or candidate event title
- contract or outcome label
- bid
- ask
- last
- snapshot timestamp
- any exchange-specific identifiers needed for traceability

At a higher level, Rushik should expect:

- one standard input shape for scanner logic
- not one parser per exchange inside the arbitrage engine

This boundary is important because it keeps the backend logic clean and avoids overlap between API adapter work and scanner work.

## 26. How To Design Rushik's Backend Around The Team Split

Rushik's backend should be shaped as a shared service layer, not as terminal-only code and not as frontend-specific code.

The design rule should be:

- input side: consume normalized market data and trusted mappings
- processing side: evaluate opportunities and manage alerts
- output side: expose clean reads for both terminal and web views

That suggests a simple internal layering:

### 26.1 Input Layer

Consumes:

- exchange adapter output from Ilian if available
- database tables and schema designed by Anna and Areen
- trusted mappings

### 26.2 Processing Layer

Owns:

- latest-price selection
- negative-risk calculations
- stale quote checks
- dedupe logic
- alert lifecycle

### 26.3 Presentation Support Layer

Provides:

- alert list queries
- scanner status queries
- recent activity queries
- alert dismissal actions

This last layer is what both the terminal and the web layer should consume.

## 27. Rushik's Practical Deliverables

The most realistic deliverables for Rushik, given the team split, are:

- backend scanner loop
- deterministic arbitrage engine
- alert service
- DB integration from the application side
- terminal dashboard
- any glue needed to connect normalized API data to scanner behavior

Nice-to-have but not required for Rushik's core role:

- owning the entire exchange ingestion layer
- rewriting schema work
- rebuilding the main web frontend

## 28. Recommended Short-Term Build Order For Rushik

To stay aligned with the team and avoid being blocked, Rushik should work in this order:

1. lock the expected normalized market payload contract
2. build backend logic against that contract
3. build terminal reads and actions on top of backend outputs
4. integrate with the actual DB schema once the DB milestone shape is stable
5. connect live API-fed data once the adapter handoff is ready

This order matters because it lets Rushik make progress even if the API or web frontend side is still moving.

## 29. Current Role Summary For Rushik

In the simplest possible words:

- Rushik is building the brain that scans for opportunities
- Rushik is building the terminal that shows what the brain is doing
- Rushik is not responsible for the database normalization milestone
- Rushik is not responsible for the main web frontend
- Rushik may consume API data from Ilian, unless API ownership shifts later

The safest design stance is:

"Build the backend so it can power both the terminal and the web app, but optimize the operator experience around the terminal."

For Rushik's execution-focused plan, see [rushik-backend-terminal-plan.md](/Users/Rushik/Downloads/ArbScanner/docs/final-documentation/rushik-backend-terminal-plan.md).

## 30. Current Database Baseline

For the course project and the current implementation phase, the SQL dump created by the database team should be treated as the active baseline schema.

That means:

- the backend should build against this schema now
- the terminal should read from this schema now
- the team should not casually redesign tables mid-implementation unless everyone explicitly agrees

This schema is the current contract for application development.

At the same time, it should be understood as a baseline schema, not necessarily the final long-term product schema.

## 31. Current Baseline Tables And Their Product Meaning

The current baseline schema defines the following core entities.

### 31.1 `Exchange`

Represents each prediction venue.

Product meaning:

- where data came from
- which platform a market belongs to
- what API base is associated with that exchange

### 31.2 `Event`

Represents the canonical underlying event being tracked.

Product meaning:

- the real-world event the system thinks it is scanning
- the top-level item users conceptually care about

### 31.3 `MarketMapping`

Represents the mapping layer connecting equivalent cross-exchange markets to a shared event.

Product meaning:

- the trust bridge between raw exchange markets and scanner logic
- the grouping unit the arbitrage engine scans against

### 31.4 `Market`

Represents an exchange-specific market attached to an event and mapping.

Product meaning:

- one venue-specific market instance
- the exchange-specific handle or code that identifies it

### 31.5 `BinaryMarket`

Represents explicit yes/no semantics for binary markets.

Product meaning:

- tells the system that the market is binary
- provides the yes/no labels needed for simple negative-risk logic

### 31.6 `Contract`

Represents an outcome contract within a market.

Product meaning:

- the specific outcome being priced
- the entity whose quotes are stored over time

### 31.7 `PriceSnapshot`

Represents a point-in-time quote for a contract.

Product meaning:

- the time-series market data the scanner computes on
- the latest bid/ask/last the engine uses for evaluation

### 31.8 `ArbitrageAlert`

Represents a persisted opportunity detected by the engine.

Product meaning:

- the output of scanner logic
- the main table the terminal and web views should surface

## 32. How The Current Schema Fits Rushik's Work

Rushik's backend and terminal work should use the current baseline schema in this practical way:

### 32.1 Rushik Reads

Rushik's logic should read from:

- `Exchange`
- `Event`
- `MarketMapping`
- `Market`
- `BinaryMarket`
- `Contract`
- `PriceSnapshot`

These tables provide the market universe, current price state, and the mapping structure needed for deterministic scanning.

### 32.2 Rushik Writes

Rushik's logic should primarily write to:

- `PriceSnapshot` when new prices are ingested or persisted from live API data
- `ArbitrageAlert` when opportunities are found or updated

### 32.3 Rushik Updates

Rushik's terminal interaction should update:

- `ArbitrageAlert.Status` when an alert is dismissed or expired

### 32.4 Rushik Displays

Rushik's terminal UI should mainly display rows derived from joins across:

- `ArbitrageAlert`
- `MarketMapping`
- `Event`
- `Market`
- `Exchange`

That is the core readable operator view.

## 33. What This Means Practically

In simple terms:

- yes, this SQL dump is the structure Rushik should code against right now
- no, it should not be assumed to be the final forever schema for the personal product vision

For the current team project, the safest move is:

- treat this dump as the active DB contract
- build backend and terminal code around it
- only propose schema extensions later if there is a clear need and team agreement

## 34. How The Schema Should Appear In Planning Docs

Yes, the database structure should be reflected in the plan.

However, the product plan should not be turned into a raw SQL dump file.

The better structure is:

- keep the actual SQL schema in the database/schema area or a dedicated SQL dump file
- keep a high-level schema interpretation in the product plan
- explain how each table maps to application behavior and ownership

That is why this plan now records the database as the current baseline contract rather than copying the entire SQL dump verbatim into the main planning narrative.
