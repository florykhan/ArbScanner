CREATE TABLE IF NOT EXISTS `Exchange` (
    `Exchange_id` INT NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(255) NOT NULL,
    `API_base_url` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`Exchange_id`),
    UNIQUE KEY `uq_exchange_name` (`Name`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Event` (
    `Event_id` INT NOT NULL AUTO_INCREMENT,
    `Title` VARCHAR(255) NOT NULL,
    `Category` VARCHAR(100),
    `Close_time` DATETIME,
    PRIMARY KEY (`Event_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `MarketMapping` (
    `Mapping_id` INT NOT NULL AUTO_INCREMENT,
    `Event_id` INT NOT NULL,
    `Notes` VARCHAR(255),
    `Created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`Mapping_id`),
    CONSTRAINT `fk_marketmapping_event`
        FOREIGN KEY (`Event_id`) REFERENCES `Event`(`Event_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Market` (
    `Market_id` INT NOT NULL AUTO_INCREMENT,
    `Exchange_id` INT NOT NULL,
    `Event_id` INT NOT NULL,
    `Mapping_id` INT,
    `Exchange_market_code` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`Market_id`),
    UNIQUE KEY `uq_market_exchange_code` (`Exchange_id`, `Exchange_market_code`),
    KEY `idx_market_event_id` (`Event_id`),
    KEY `idx_market_mapping_id` (`Mapping_id`),
    CONSTRAINT `fk_market_exchange`
        FOREIGN KEY (`Exchange_id`) REFERENCES `Exchange`(`Exchange_id`),
    CONSTRAINT `fk_market_event`
        FOREIGN KEY (`Event_id`) REFERENCES `Event`(`Event_id`),
    CONSTRAINT `fk_market_mapping`
        FOREIGN KEY (`Mapping_id`) REFERENCES `MarketMapping`(`Mapping_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `BinaryMarket` (
    `Market_id` INT NOT NULL,
    `Yes_label` VARCHAR(50),
    `No_label` VARCHAR(50),
    PRIMARY KEY (`Market_id`),
    CONSTRAINT `fk_binarymarket_market`
        FOREIGN KEY (`Market_id`) REFERENCES `Market`(`Market_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Contract` (
    `Contract_id` INT NOT NULL AUTO_INCREMENT,
    `Market_id` INT NOT NULL,
    `Outcome_label` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`Contract_id`),
    UNIQUE KEY `uq_contract_market_outcome` (`Market_id`, `Outcome_label`),
    KEY `idx_contract_market_id` (`Market_id`),
    CONSTRAINT `fk_contract_market`
        FOREIGN KEY (`Market_id`) REFERENCES `Market`(`Market_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `PriceSnapshot` (
    `Contract_id` INT NOT NULL,
    `Snapshot_time` DATETIME NOT NULL,
    `Bid` DECIMAL(10, 4),
    `Ask` DECIMAL(10, 4),
    `Last` DECIMAL(10, 4),
    `Spread` DECIMAL(10, 4),
    PRIMARY KEY (`Contract_id`, `Snapshot_time`),
    KEY `idx_pricesnapshot_time` (`Snapshot_time`),
    CONSTRAINT `fk_pricesnapshot_contract`
        FOREIGN KEY (`Contract_id`) REFERENCES `Contract`(`Contract_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `ArbitrageAlert` (
    `Alert_id` INT NOT NULL AUTO_INCREMENT,
    `Mapping_id` INT NOT NULL,
    `Profit_margin` DECIMAL(5, 4),
    `Detected_at` DATETIME,
    `Status` VARCHAR(50),
    PRIMARY KEY (`Alert_id`),
    KEY `idx_alert_status_margin` (`Status`, `Profit_margin`),
    CONSTRAINT `fk_alert_mapping`
        FOREIGN KEY (`Mapping_id`) REFERENCES `MarketMapping`(`Mapping_id`)
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW `ActiveArbitrageAlerts` AS
SELECT
    a.`Alert_id`,
    a.`Mapping_id`,
    e.`Event_id`,
    e.`Title` AS `Event_Name`,
    ROUND(a.`Profit_margin` * 100, 2) AS `Profit_Percent`,
    a.`Detected_at`,
    a.`Status`
FROM `ArbitrageAlert` AS a
JOIN `MarketMapping` AS mm ON a.`Mapping_id` = mm.`Mapping_id`
JOIN `Event` AS e ON mm.`Event_id` = e.`Event_id`
WHERE a.`Status` = 'Active';

CREATE OR REPLACE VIEW `EventMarketOverview` AS
SELECT
    e.`Event_id`,
    e.`Title`,
    e.`Category`,
    e.`Close_time`,
    mm.`Mapping_id`,
    ex.`Name` AS `Exchange_Name`,
    m.`Market_id`,
    m.`Exchange_market_code`
FROM `Event` AS e
JOIN `MarketMapping` AS mm ON mm.`Event_id` = e.`Event_id`
JOIN `Market` AS m ON m.`Mapping_id` = mm.`Mapping_id`
JOIN `Exchange` AS ex ON ex.`Exchange_id` = m.`Exchange_id`;

ALTER TABLE `PriceSnapshot`
    ADD CONSTRAINT `chk_pricesnapshot_bid_range`
        CHECK (`Bid` IS NULL OR (`Bid` >= 0 AND `Bid` <= 1)),
    ADD CONSTRAINT `chk_pricesnapshot_ask_range`
        CHECK (`Ask` IS NULL OR (`Ask` >= 0 AND `Ask` <= 1)),
    ADD CONSTRAINT `chk_pricesnapshot_last_range`
        CHECK (`Last` IS NULL OR (`Last` >= 0 AND `Last` <= 1)),
    ADD CONSTRAINT `chk_pricesnapshot_bid_leq_ask`
        CHECK (`Bid` IS NULL OR `Ask` IS NULL OR `Bid` <= `Ask`);

ALTER TABLE `ArbitrageAlert`
    ADD CONSTRAINT `chk_arbitragealert_profit_margin_range`
        CHECK (`Profit_margin` IS NULL OR (`Profit_margin` >= 0 AND `Profit_margin` <= 1)),
    ADD CONSTRAINT `chk_arbitragealert_status`
        CHECK (`Status` IN ('Active', 'Resolved', 'Expired'));

CREATE TABLE IF NOT EXISTS `AlertAuditLog` (
    `Log_id` INT NOT NULL AUTO_INCREMENT,
    `Alert_id` INT NOT NULL,
    `Old_status` VARCHAR(50),
    `New_status` VARCHAR(50),
    `Changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`Log_id`),
    KEY `idx_alertauditlog_alert_id` (`Alert_id`),
    CONSTRAINT `fk_alertauditlog_alert`
        FOREIGN KEY (`Alert_id`) REFERENCES `ArbitrageAlert`(`Alert_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

DELIMITER //

DROP TRIGGER IF EXISTS `trg_snapshot_compute_spread`//
CREATE TRIGGER `trg_snapshot_compute_spread`
BEFORE INSERT ON `PriceSnapshot`
FOR EACH ROW
BEGIN
    IF NEW.`Spread` IS NULL AND NEW.`Bid` IS NOT NULL AND NEW.`Ask` IS NOT NULL THEN
        SET NEW.`Spread` = NEW.`Ask` - NEW.`Bid`;
    END IF;
END//

DROP TRIGGER IF EXISTS `trg_alert_audit_status`//
CREATE TRIGGER `trg_alert_audit_status`
AFTER UPDATE ON `ArbitrageAlert`
FOR EACH ROW
BEGIN
    IF NOT (OLD.`Status` <=> NEW.`Status`) THEN
        INSERT INTO `AlertAuditLog` (
            `Alert_id`,
            `Old_status`,
            `New_status`,
            `Changed_at`
        )
        VALUES (
            NEW.`Alert_id`,
            OLD.`Status`,
            NEW.`Status`,
            NOW()
        );
    END IF;
END//

DROP TRIGGER IF EXISTS `trg_snapshot_detect_arb`//
CREATE TRIGGER `trg_snapshot_detect_arb`
AFTER INSERT ON `PriceSnapshot`
FOR EACH ROW
BEGIN
    DECLARE v_mapping_id INT;
    DECLARE v_min_yes DECIMAL(10, 4);
    DECLARE v_min_no DECIMAL(10, 4);
    DECLARE v_profit_margin DECIMAL(5, 4);
    DECLARE v_active_alert_id INT;

    SELECT m.`Mapping_id`
    INTO v_mapping_id
    FROM `Contract` AS c
    JOIN `Market` AS m ON m.`Market_id` = c.`Market_id`
    WHERE c.`Contract_id` = NEW.`Contract_id`
    LIMIT 1;

    IF v_mapping_id IS NOT NULL THEN
        SELECT MIN(ps.`Ask`)
        INTO v_min_yes
        FROM `PriceSnapshot` AS ps
        JOIN `Contract` AS c ON c.`Contract_id` = ps.`Contract_id`
        JOIN `Market` AS m ON m.`Market_id` = c.`Market_id`
        WHERE m.`Mapping_id` = v_mapping_id
          AND UPPER(c.`Outcome_label`) = 'YES';

        SELECT MIN(ps.`Ask`)
        INTO v_min_no
        FROM `PriceSnapshot` AS ps
        JOIN `Contract` AS c ON c.`Contract_id` = ps.`Contract_id`
        JOIN `Market` AS m ON m.`Market_id` = c.`Market_id`
        WHERE m.`Mapping_id` = v_mapping_id
          AND UPPER(c.`Outcome_label`) = 'NO';

        IF v_min_yes IS NOT NULL
           AND v_min_no IS NOT NULL
           AND (v_min_yes + v_min_no) < 1 THEN
            SET v_profit_margin = 1 - (v_min_yes + v_min_no);

            SELECT a.`Alert_id`
            INTO v_active_alert_id
            FROM `ArbitrageAlert` AS a
            WHERE a.`Mapping_id` = v_mapping_id
              AND a.`Status` = 'Active'
            ORDER BY a.`Detected_at` DESC, a.`Alert_id` DESC
            LIMIT 1;

            IF v_active_alert_id IS NULL THEN
                INSERT INTO `ArbitrageAlert` (
                    `Mapping_id`,
                    `Profit_margin`,
                    `Detected_at`,
                    `Status`
                )
                VALUES (
                    v_mapping_id,
                    v_profit_margin,
                    NOW(),
                    'Active'
                );
            ELSE
                UPDATE `ArbitrageAlert`
                SET `Profit_margin` = v_profit_margin,
                    `Detected_at` = NOW(),
                    `Status` = 'Active'
                WHERE `Alert_id` = v_active_alert_id;
            END IF;
        END IF;
    END IF;
END//

DELIMITER ;
