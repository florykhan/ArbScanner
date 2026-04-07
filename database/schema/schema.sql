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
