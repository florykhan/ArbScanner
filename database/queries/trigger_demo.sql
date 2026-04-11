START TRANSACTION;

SET @demo_contract_id := 1;
SET @demo_mapping_id := (
    SELECT m.`Mapping_id`
    FROM `Contract` AS c
    JOIN `Market` AS m ON m.`Market_id` = c.`Market_id`
    WHERE c.`Contract_id` = @demo_contract_id
);

INSERT INTO `PriceSnapshot` (
    `Contract_id`,
    `Snapshot_time`,
    `Bid`,
    `Ask`,
    `Last`,
    `Spread`
)
VALUES (
    @demo_contract_id,
    '2026-04-10 12:00:00',
    0.0800,
    0.1000,
    0.0900,
    NULL
);

SELECT
    `Alert_id`,
    `Mapping_id`,
    `Profit_margin`,
    `Detected_at`,
    `Status`
FROM `ArbitrageAlert`
WHERE `Mapping_id` = @demo_mapping_id
ORDER BY `Detected_at` DESC, `Alert_id` DESC;

SET @demo_alert_id := (
    SELECT `Alert_id`
    FROM `ArbitrageAlert`
    WHERE `Mapping_id` = @demo_mapping_id
    ORDER BY `Detected_at` DESC, `Alert_id` DESC
    LIMIT 1
);

UPDATE `ArbitrageAlert`
SET `Status` = 'Resolved'
WHERE `Alert_id` = @demo_alert_id;

SELECT
    `Log_id`,
    `Alert_id`,
    `Old_status`,
    `New_status`,
    `Changed_at`
FROM `AlertAuditLog`
WHERE `Alert_id` = @demo_alert_id
ORDER BY `Changed_at` DESC, `Log_id` DESC;

ROLLBACK;
