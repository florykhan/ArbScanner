PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Exchange (
    Exchange_id INTEGER PRIMARY KEY,
    Name VARCHAR(255) NOT NULL UNIQUE,
    API_base_url VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Event (
    Event_id INTEGER PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Category VARCHAR(100),
    Close_time DATETIME
);

CREATE TABLE IF NOT EXISTS MarketMapping (
    Mapping_id INTEGER PRIMARY KEY,
    Event_id INTEGER NOT NULL,
    Notes VARCHAR(255),
    Created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Event_id) REFERENCES Event(Event_id)
);

CREATE TABLE IF NOT EXISTS Market (
    Market_id INTEGER PRIMARY KEY,
    Exchange_id INTEGER NOT NULL,
    Event_id INTEGER NOT NULL,
    Mapping_id INTEGER,
    Exchange_market_code VARCHAR(100) NOT NULL,
    FOREIGN KEY (Exchange_id) REFERENCES Exchange(Exchange_id),
    FOREIGN KEY (Event_id) REFERENCES Event(Event_id),
    FOREIGN KEY (Mapping_id) REFERENCES MarketMapping(Mapping_id),
    UNIQUE (Exchange_id, Exchange_market_code)
);

CREATE TABLE IF NOT EXISTS BinaryMarket (
    Market_id INTEGER PRIMARY KEY,
    Yes_label VARCHAR(50),
    No_label VARCHAR(50),
    FOREIGN KEY (Market_id) REFERENCES Market(Market_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Contract (
    Contract_id INTEGER PRIMARY KEY,
    Market_id INTEGER NOT NULL,
    Outcome_label VARCHAR(100) NOT NULL,
    FOREIGN KEY (Market_id) REFERENCES Market(Market_id),
    UNIQUE (Market_id, Outcome_label)
);

CREATE TABLE IF NOT EXISTS PriceSnapshot (
    Contract_id INTEGER NOT NULL,
    Snapshot_time DATETIME NOT NULL,
    Bid DECIMAL(10, 4),
    Ask DECIMAL(10, 4),
    Last DECIMAL(10, 4),
    Spread DECIMAL(10, 4),
    PRIMARY KEY (Contract_id, Snapshot_time),
    FOREIGN KEY (Contract_id) REFERENCES Contract(Contract_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ArbitrageAlert (
    Alert_id INTEGER PRIMARY KEY,
    Mapping_id INTEGER NOT NULL,
    Profit_margin DECIMAL(5, 4),
    Detected_at DATETIME,
    Status VARCHAR(50),
    FOREIGN KEY (Mapping_id) REFERENCES MarketMapping(Mapping_id)
);

CREATE INDEX IF NOT EXISTS idx_market_event_id ON Market(Event_id);
CREATE INDEX IF NOT EXISTS idx_market_mapping_id ON Market(Mapping_id);
CREATE INDEX IF NOT EXISTS idx_contract_market_id ON Contract(Market_id);
CREATE INDEX IF NOT EXISTS idx_pricesnapshot_time ON PriceSnapshot(Snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_alert_status_margin ON ArbitrageAlert(Status, Profit_margin DESC);

CREATE VIEW IF NOT EXISTS ActiveArbitrageAlerts AS
SELECT
    a.Alert_id,
    a.Mapping_id,
    e.Event_id,
    e.Title AS Event_Name,
    ROUND(a.Profit_margin * 100, 2) AS Profit_Percent,
    a.Detected_at,
    a.Status
FROM ArbitrageAlert AS a
JOIN MarketMapping AS mm ON a.Mapping_id = mm.Mapping_id
JOIN Event AS e ON mm.Event_id = e.Event_id
WHERE a.Status = 'Active';

CREATE VIEW IF NOT EXISTS EventMarketOverview AS
SELECT
    e.Event_id,
    e.Title,
    e.Category,
    e.Close_time,
    mm.Mapping_id,
    ex.Name AS Exchange_Name,
    m.Market_id,
    m.Exchange_market_code
FROM Event AS e
JOIN MarketMapping AS mm ON mm.Event_id = e.Event_id
JOIN Market AS m ON m.Mapping_id = mm.Mapping_id
JOIN Exchange AS ex ON ex.Exchange_id = m.Exchange_id;
