# ArbScanner Database Design

This document describes the database design used for the ArbScanner backend. It is consistent with the implemented schema in [database/schema/schema.sql](/Users/arina/areenve.github.io/ArbScanner/database/schema/schema.sql) and follows the logical design required for the database portion of the project: relational schema, functional dependencies, candidate keys, foreign keys, and normalization to Third Normal Form (3NF). The implementation target for the retained SQL artifacts is MySQL using InnoDB tables.

## 1. Relational Schema

### EXCHANGE

`EXCHANGE(Exchange_id, Name, API_base_url)`

- Primary key: `Exchange_id`
- Candidate keys: `Exchange_id`, `Name`
- Foreign keys: none
- Important unique constraints:
  - `Name` is `UNIQUE`

### EVENT

`EVENT(Event_id, Title, Category, Close_time)`

- Primary key: `Event_id`
- Candidate keys: `Event_id`
- Foreign keys: none
- Important unique constraints: none

### MARKETMAPPING

`MARKETMAPPING(Mapping_id, Event_id, Notes, Created_at)`

- Primary key: `Mapping_id`
- Candidate keys: `Mapping_id`
- Foreign keys:
  - `Event_id -> EVENT(Event_id)`
- Important unique constraints: none

### MARKET

`MARKET(Market_id, Exchange_id, Event_id, Mapping_id, Exchange_market_code)`

- Primary key: `Market_id`
- Candidate keys: `Market_id`, `(Exchange_id, Exchange_market_code)`
- Foreign keys:
  - `Exchange_id -> EXCHANGE(Exchange_id)`
  - `Event_id -> EVENT(Event_id)`
  - `Mapping_id -> MARKETMAPPING(Mapping_id)`
- Important unique constraints:
  - `(Exchange_id, Exchange_market_code)` is `UNIQUE`

### BINARYMARKET

`BINARYMARKET(Market_id, Yes_label, No_label)`

- Primary key: `Market_id`
- Candidate keys: `Market_id`
- Foreign keys:
  - `Market_id -> MARKET(Market_id)`
- Important unique constraints: none beyond the primary key

### CONTRACT

`CONTRACT(Contract_id, Market_id, Outcome_label)`

- Primary key: `Contract_id`
- Candidate keys: `Contract_id`, `(Market_id, Outcome_label)`
- Foreign keys:
  - `Market_id -> MARKET(Market_id)`
- Important unique constraints:
  - `(Market_id, Outcome_label)` is `UNIQUE`

### PRICESNAPSHOT

`PRICESNAPSHOT(Contract_id, Snapshot_time, Bid, Ask, Last, Spread)`

- Primary key: `(Contract_id, Snapshot_time)`
- Candidate keys: `(Contract_id, Snapshot_time)`
- Foreign keys:
  - `Contract_id -> CONTRACT(Contract_id)`
- Important unique constraints:
  - composite primary key `(Contract_id, Snapshot_time)`

### ARBITRAGEALERT

`ARBITRAGEALERT(Alert_id, Mapping_id, Profit_margin, Detected_at, Status)`

- Primary key: `Alert_id`
- Candidate keys: `Alert_id`
- Foreign keys:
  - `Mapping_id -> MARKETMAPPING(Mapping_id)`
- Important unique constraints: none

## 2. Functional Dependencies

The following functional dependencies are justified by primary keys or explicit uniqueness constraints in the implemented schema.

### EXCHANGE

- `Exchange_id -> Name, API_base_url`
- `Name -> Exchange_id, API_base_url`

The second FD holds because `Name` is declared `UNIQUE`.

### EVENT

- `Event_id -> Title, Category, Close_time`

### MARKETMAPPING

- `Mapping_id -> Event_id, Notes, Created_at`

### MARKET

- `Market_id -> Exchange_id, Event_id, Mapping_id, Exchange_market_code`
- `(Exchange_id, Exchange_market_code) -> Market_id, Event_id, Mapping_id`

The second FD holds because `(Exchange_id, Exchange_market_code)` is declared `UNIQUE`.

### BINARYMARKET

- `Market_id -> Yes_label, No_label`

### CONTRACT

- `Contract_id -> Market_id, Outcome_label`
- `(Market_id, Outcome_label) -> Contract_id`

The second FD holds because `(Market_id, Outcome_label)` is declared `UNIQUE`.

### PRICESNAPSHOT

- `(Contract_id, Snapshot_time) -> Bid, Ask, Last, Spread`

### ARBITRAGEALERT

- `Alert_id -> Mapping_id, Profit_margin, Detected_at, Status`

## 3. Candidate Keys and Primary Keys

### EXCHANGE

- Primary key: `Exchange_id`
- Alternate candidate key: `Name`

### EVENT

- Primary key: `Event_id`
- No alternate candidate key is enforced in the schema

### MARKETMAPPING

- Primary key: `Mapping_id`
- No alternate candidate key is enforced in the schema

### MARKET

- Primary key: `Market_id`
- Alternate candidate key: `(Exchange_id, Exchange_market_code)`

### BINARYMARKET

- Primary key: `Market_id`
- No alternate candidate key is enforced in the schema

### CONTRACT

- Primary key: `Contract_id`
- Alternate candidate key: `(Market_id, Outcome_label)`

### PRICESNAPSHOT

- Primary key and candidate key: `(Contract_id, Snapshot_time)`

### ARBITRAGEALERT

- Primary key: `Alert_id`
- No alternate candidate key is enforced in the schema

## 4. Foreign Keys

- `MARKETMAPPING.Event_id` references `EVENT.Event_id`
- `MARKET.Exchange_id` references `EXCHANGE.Exchange_id`
- `MARKET.Event_id` references `EVENT.Event_id`
- `MARKET.Mapping_id` references `MARKETMAPPING.Mapping_id`
- `BINARYMARKET.Market_id` references `MARKET.Market_id`
- `CONTRACT.Market_id` references `MARKET.Market_id`
- `PRICESNAPSHOT.Contract_id` references `CONTRACT.Contract_id`
- `ARBITRAGEALERT.Mapping_id` references `MARKETMAPPING.Mapping_id`

Implementation note:

- `BINARYMARKET.Market_id` uses `ON DELETE CASCADE`
- `PRICESNAPSHOT.Contract_id` uses `ON DELETE CASCADE`

These cascade rules are implementation details of referential maintenance and do not change the logical schema.

## 5. 3NF Justification

### EXCHANGE

`EXCHANGE` is in 3NF because the only non-trivial dependencies have determinants `Exchange_id` or `Name`, and both are candidate keys. Therefore every non-key attribute depends on a key and there are no transitive dependencies among non-key attributes.

### EVENT

`EVENT` is in 3NF because `Event_id` is the only determinant for non-key attributes. The relation has a single-attribute key, so there are no partial dependencies, and `Title`, `Category`, and `Close_time` depend only on `Event_id`.

### MARKETMAPPING

`MARKETMAPPING` is in 3NF because `Mapping_id` determines `Event_id`, `Notes`, and `Created_at`. Since the primary key is a single attribute, there are no partial dependencies, and there is no evidence of non-key attributes determining other non-key attributes.

### MARKET

`MARKET` is in 3NF because the non-trivial dependencies have determinants `Market_id` or `(Exchange_id, Exchange_market_code)`, both of which are candidate keys. Non-key attributes depend on a key, the whole key, and nothing but the key.

### BINARYMARKET

`BINARYMARKET` is in 3NF because `Market_id` is the key and determines `Yes_label` and `No_label`. There are no partial dependencies or transitive dependencies.

### CONTRACT

`CONTRACT` is in 3NF because the non-trivial dependencies have determinants `Contract_id` or `(Market_id, Outcome_label)`, both of which are candidate keys. Thus every non-key attribute depends directly on a key.

### PRICESNAPSHOT

`PRICESNAPSHOT` is in 3NF because `Bid`, `Ask`, `Last`, and `Spread` depend on the full composite key `(Contract_id, Snapshot_time)`. There are no partial dependencies on only `Contract_id` or only `Snapshot_time`, and no transitive dependencies are implied by the schema.

### ARBITRAGEALERT

`ARBITRAGEALERT` is in 3NF because `Alert_id` determines `Mapping_id`, `Profit_margin`, `Detected_at`, and `Status`. The relation has a single-attribute key and no non-key determinant is implied by the schema.

## 6. BCNF Note

This design also satisfies BCNF under the listed functional dependencies.

For each relation, every determinant that appears in the documented non-trivial functional dependencies is a candidate key or superkey:

- `EXCHANGE`: `Exchange_id` and `Name`
- `EVENT`: `Event_id`
- `MARKETMAPPING`: `Mapping_id`
- `MARKET`: `Market_id` and `(Exchange_id, Exchange_market_code)`
- `BINARYMARKET`: `Market_id`
- `CONTRACT`: `Contract_id` and `(Market_id, Outcome_label)`
- `PRICESNAPSHOT`: `(Contract_id, Snapshot_time)`
- `ARBITRAGEALERT`: `Alert_id`

Therefore the relations are not only in 3NF, but also in BCNF with respect to the FDs justified by the implemented constraints.
