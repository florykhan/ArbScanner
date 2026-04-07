-- Active arbitrage alerts ordered by best margin first.
SELECT
  a.`Alert_id`,
  e.`Title` AS `Event_Name`,
  ROUND(a.`Profit_margin` * 100, 2) AS `Profit_Percent`,
  a.`Detected_at`,
  a.`Status`
FROM `ArbitrageAlert` a
JOIN `MarketMapping` mm ON a.`Mapping_id` = mm.`Mapping_id`
JOIN `Event` e ON mm.`Event_id` = e.`Event_id`
WHERE a.`Status` = 'Active'
ORDER BY a.`Profit_margin` DESC;

-- Markets for each event across exchanges.
SELECT
  e.`Title`,
  ex.`Name` AS `Exchange_Name`,
  m.`Market_id`,
  m.`Exchange_market_code`
FROM `Event` e
JOIN `Market` m ON e.`Event_id` = m.`Event_id`
JOIN `Exchange` ex ON m.`Exchange_id` = ex.`Exchange_id`
ORDER BY e.`Title`, ex.`Name`;

-- Snapshot history for a contract.
SELECT
  ps.`Contract_id`,
  ps.`Snapshot_time`,
  ps.`Bid`,
  ps.`Ask`,
  ps.`Last`,
  ps.`Spread`
FROM `PriceSnapshot` ps
WHERE ps.`Contract_id` = ?
ORDER BY ps.`Snapshot_time` DESC;

-- Contracts under a market.
SELECT
  c.`Contract_id`,
  c.`Outcome_label`
FROM `Contract` c
WHERE c.`Market_id` = ?
ORDER BY c.`Contract_id`;

-- Event to market mapping overview.
SELECT
  mm.`Mapping_id`,
  e.`Title`,
  e.`Category`,
  ex.`Name` AS `Exchange_Name`,
  m.`Exchange_market_code`,
  m.`Market_id`
FROM `MarketMapping` mm
JOIN `Event` e ON e.`Event_id` = mm.`Event_id`
JOIN `Market` m ON m.`Mapping_id` = mm.`Mapping_id`
JOIN `Exchange` ex ON ex.`Exchange_id` = m.`Exchange_id`
ORDER BY mm.`Mapping_id`, ex.`Name`;
