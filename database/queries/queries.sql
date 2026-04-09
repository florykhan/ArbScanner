-- Join query: active arbitrage alerts ordered by best margin first.
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

-- Join query: markets for each event across exchanges.
SELECT
  e.`Title`,
  ex.`Name` AS `Exchange_Name`,
  m.`Market_id`,
  m.`Exchange_market_code`
FROM `Event` e
JOIN `Market` m ON e.`Event_id` = m.`Event_id`
JOIN `Exchange` ex ON m.`Exchange_id` = ex.`Exchange_id`
ORDER BY e.`Title`, ex.`Name`;

-- Join query: event to market mapping overview.
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

-- Snapshot history for a contract. Replace ? with a concrete contract id such as 13.
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

-- Contracts under a market. Replace ? with a concrete market id such as 10.
SELECT
  c.`Contract_id`,
  c.`Outcome_label`
FROM `Contract` c
WHERE c.`Market_id` = ?
ORDER BY c.`Contract_id`;

-- Division query: events available on all three tracked exchanges.
SELECT
  e.`Event_id`,
  e.`Title`
FROM `Event` e
JOIN `MarketMapping` mm ON mm.`Event_id` = e.`Event_id`
WHERE NOT EXISTS (
  SELECT 1
  FROM `Exchange` ex
  WHERE ex.`Name` IN ('Manifold Markets', 'Polymarket', 'Kalshi')
    AND NOT EXISTS (
      SELECT 1
      FROM `Market` m
      WHERE m.`Mapping_id` = mm.`Mapping_id`
        AND m.`Exchange_id` = ex.`Exchange_id`
    )
)
ORDER BY e.`Event_id`;

-- Aggregation query: summary statistics for active arbitrage alerts.
SELECT
  COUNT(*) AS `Active_Alert_Count`,
  ROUND(MIN(`Profit_margin`) * 100, 2) AS `Min_Profit_Percent`,
  ROUND(MAX(`Profit_margin`) * 100, 2) AS `Max_Profit_Percent`,
  ROUND(AVG(`Profit_margin`) * 100, 2) AS `Avg_Profit_Percent`
FROM `ArbitrageAlert`
WHERE `Status` = 'Active';

-- Aggregation with GROUP BY: markets and average YES price by exchange.
SELECT
  ex.`Name` AS `Exchange_Name`,
  COUNT(DISTINCT m.`Market_id`) AS `Market_Count`,
  ROUND(AVG(ps.`Last`), 4) AS `Avg_Yes_Last_Price`
FROM `Exchange` ex
JOIN `Market` m ON m.`Exchange_id` = ex.`Exchange_id`
JOIN `Contract` c
  ON c.`Market_id` = m.`Market_id`
 AND c.`Outcome_label` = 'YES'
JOIN `PriceSnapshot` ps ON ps.`Contract_id` = c.`Contract_id`
GROUP BY ex.`Exchange_id`, ex.`Name`
ORDER BY `Market_Count` DESC, ex.`Name`;

-- Update operation demo. Run inside a transaction so the demo can be rolled back.
START TRANSACTION;

UPDATE `ArbitrageAlert`
SET `Status` = 'Resolved'
WHERE `Alert_id` = 1;

SELECT
  `Alert_id`,
  `Mapping_id`,
  `Profit_margin`,
  `Detected_at`,
  `Status`
FROM `ArbitrageAlert`
WHERE `Alert_id` = 1;

ROLLBACK;

-- Delete with cascade demo. Deleting Contract 13 removes its PriceSnapshot rows.
START TRANSACTION;

SELECT COUNT(*) AS `Snapshots_Before_Delete`
FROM `PriceSnapshot`
WHERE `Contract_id` = 13;

DELETE FROM `Contract`
WHERE `Contract_id` = 13;

SELECT COUNT(*) AS `Snapshots_After_Delete`
FROM `PriceSnapshot`
WHERE `Contract_id` = 13;

ROLLBACK;
