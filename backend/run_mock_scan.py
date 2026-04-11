from __future__ import annotations

import logging

import mysql.connector

from backend.services.alert_service import AlertService
from backend.services.market_data_service import MarketDataService, build_mock_quotes
from backend.services.scanner_service import ScannerService
from backend.utils.config import DatabaseConfig
from backend.utils.db import db_session


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="[%(levelname)s] %(message)s",
    )


def main() -> None:
    configure_logging()
    market_data_service = MarketDataService()
    scanner_service = ScannerService()
    alert_service = AlertService()
    db_config = DatabaseConfig.from_env()

    try:
        with db_session(db_config) as connection:
            quotes = build_mock_quotes()
            hydrated_quotes = market_data_service.hydrate_quotes(connection, quotes)
            inserted_snapshots = market_data_service.persist_snapshots(connection, hydrated_quotes)
            alert_ids = scanner_service.run_scan_cycle(connection, hydrated_quotes)
            active_alerts = alert_service.list_active_alerts(connection)
    except mysql.connector.Error as exc:
        logging.error("Database connection or query failed: %s", exc)
        logging.error(
            "Current DB config: host=%s port=%s database=%s socket=%s user=%s",
            db_config.host,
            db_config.port,
            db_config.database,
            db_config.unix_socket or "<none>",
            db_config.user,
        )
        logging.error(
            "Set ARBSCANNER_DB_HOST / ARBSCANNER_DB_PORT or ARBSCANNER_DB_SOCKET "
            "to match your local MySQL setup."
        )
        return

    logging.info("Persisted %s snapshot(s)", inserted_snapshots)
    logging.info("Created or refreshed %s active alert(s)", len(alert_ids))

    if active_alerts:
        for alert in active_alerts:
            logging.info(
                "Alert %s | %s | %s | %.2f%% | %s",
                alert.alert_id,
                alert.event_title,
                alert.mapped_exchanges,
                float(alert.profit_margin_percent),
                alert.status,
            )
    else:
        logging.info("No active alerts found")


if __name__ == "__main__":
    main()
