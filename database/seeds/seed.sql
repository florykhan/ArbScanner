INSERT OR IGNORE INTO Exchange (Exchange_id, Name, API_base_url) VALUES
    (1, 'Manifold Markets', 'https://api.manifold.markets'),
    (2, 'Polymarket', 'https://clob.polymarket.com'),
    (3, 'Kalshi', 'https://api.elections.kalshi.com');

INSERT OR IGNORE INTO Event (Event_id, Title, Category, Close_time) VALUES
    (1, 'Will the US approve a federal TikTok divest-or-ban law in 2026?', 'politics', '2026-12-31T23:59:59Z'),
    (2, 'Will Bitcoin trade above $120,000 by June 30, 2026?', 'crypto', '2026-06-30T23:59:59Z'),
    (3, 'Will SpaceX launch Starship to orbit before July 1, 2026?', 'science', '2026-06-30T23:59:59Z');

INSERT OR IGNORE INTO MarketMapping (Mapping_id, Event_id, Notes, Created_at) VALUES
    (1, 1, 'Canonical mapping for US TikTok legislation markets.', '2026-04-01T16:00:00Z'),
    (2, 2, 'Cross-exchange BTC price target mapping.', '2026-04-01T16:05:00Z'),
    (3, 3, 'SpaceX orbital launch comparison mapping.', '2026-04-01T16:10:00Z');

INSERT OR IGNORE INTO Market (Market_id, Exchange_id, Event_id, Mapping_id, Exchange_market_code) VALUES
    (1, 1, 1, 1, 'will-congress-pass-a-tiktok-divest-or-ban-law-in-2026'),
    (2, 2, 1, 1, 'tiktok-ban-law-2026'),
    (3, 1, 2, 2, 'will-bitcoin-be-above-120k-on-june-30-2026'),
    (4, 3, 2, 2, 'BTC-120K-30JUN26'),
    (5, 1, 3, 3, 'will-starship-reach-orbit-before-july-2026'),
    (6, 2, 3, 3, 'spacex-starship-orbit-before-july-2026');

INSERT OR IGNORE INTO BinaryMarket (Market_id, Yes_label, No_label) VALUES
    (1, 'YES', 'NO'),
    (2, 'YES', 'NO'),
    (3, 'YES', 'NO'),
    (4, 'YES', 'NO'),
    (5, 'YES', 'NO'),
    (6, 'YES', 'NO');

INSERT OR IGNORE INTO Contract (Contract_id, Market_id, Outcome_label) VALUES
    (1, 1, 'YES'),
    (2, 1, 'NO'),
    (3, 2, 'YES'),
    (4, 2, 'NO'),
    (5, 3, 'YES'),
    (6, 3, 'NO'),
    (7, 4, 'YES'),
    (8, 4, 'NO'),
    (9, 5, 'YES'),
    (10, 5, 'NO'),
    (11, 6, 'YES'),
    (12, 6, 'NO');

INSERT OR IGNORE INTO PriceSnapshot (Contract_id, Snapshot_time, Bid, Ask, Last, Spread) VALUES
    (1, '2026-04-01T16:00:00Z', 0.4100, 0.4400, 0.4300, 0.0300),
    (2, '2026-04-01T16:00:00Z', 0.5600, 0.5900, 0.5700, 0.0300),
    (3, '2026-04-01T16:00:00Z', 0.4800, 0.5100, 0.5000, 0.0300),
    (4, '2026-04-01T16:00:00Z', 0.4900, 0.5200, 0.5000, 0.0300),
    (5, '2026-04-01T16:05:00Z', 0.3600, 0.3900, 0.3800, 0.0300),
    (6, '2026-04-01T16:05:00Z', 0.6100, 0.6400, 0.6200, 0.0300),
    (7, '2026-04-01T16:05:00Z', 0.4200, 0.4500, 0.4400, 0.0300),
    (8, '2026-04-01T16:05:00Z', 0.5500, 0.5800, 0.5600, 0.0300),
    (9, '2026-04-01T16:10:00Z', 0.2900, 0.3200, 0.3000, 0.0300),
    (10, '2026-04-01T16:10:00Z', 0.6800, 0.7100, 0.7000, 0.0300),
    (11, '2026-04-01T16:10:00Z', 0.3400, 0.3700, 0.3600, 0.0300),
    (12, '2026-04-01T16:10:00Z', 0.6300, 0.6600, 0.6400, 0.0300),
    (1, '2026-04-02T16:00:00Z', 0.4200, 0.4500, 0.4400, 0.0300),
    (3, '2026-04-02T16:00:00Z', 0.5000, 0.5300, 0.5200, 0.0300),
    (5, '2026-04-02T16:05:00Z', 0.3900, 0.4200, 0.4100, 0.0300),
    (7, '2026-04-02T16:05:00Z', 0.4300, 0.4600, 0.4500, 0.0300);

INSERT OR IGNORE INTO ArbitrageAlert (Alert_id, Mapping_id, Profit_margin, Detected_at, Status) VALUES
    (1, 1, 0.0700, '2026-04-02T16:00:30Z', 'Active'),
    (2, 2, 0.0400, '2026-04-02T16:05:30Z', 'Resolved'),
    (3, 3, 0.0500, '2026-04-02T16:10:30Z', 'Active');


