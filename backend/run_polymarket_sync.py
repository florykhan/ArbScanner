from __future__ import annotations

import argparse
import logging

from backend.services.market_data_service import MarketDataService
from backend.services.market_registry_service import MarketRegistryService
from backend.services.polymarket_service import PolymarketService
from backend.services.scanner_service import ScannerService
from backend.utils.config import PolymarketConfig
from backend.utils.db import db_session


def configure_logging() -> None:
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync live Polymarket market data into ArbScanner")
    parser.add_argument("--limit", type=int, default=50, help="Number of active markets to fetch")
    return parser.parse_args()


def main() -> None:
    configure_logging()
    args = parse_args()

    polymarket_config = PolymarketConfig.from_env()
    polymarket_service = PolymarketService(polymarket_config)
    registry_service = MarketRegistryService()
    market_data_service = MarketDataService()
    scanner_service = ScannerService()

    quotes = polymarket_service.fetch_active_binary_quotes(limit=args.limit)
    if not quotes:
        logging.info("No supported Polymarket binary markets returned")
        return

    with db_session() as connection:
        registry_service.ensure_quotes_registered(
            connection,
            quotes,
            exchange_api_base_url=polymarket_config.gamma_base_url,
        )
        hydrated_quotes = market_data_service.hydrate_quotes(connection, quotes)
        inserted_snapshots = market_data_service.persist_snapshots(connection, hydrated_quotes)
        alert_ids = scanner_service.run_scan_cycle(connection, hydrated_quotes)

    logging.info("Fetched %s normalized Polymarket quote(s)", len(quotes))
    logging.info("Persisted %s snapshot(s)", inserted_snapshots)
    logging.info("Created or refreshed %s active alert(s)", len(alert_ids))


if __name__ == "__main__":
    main()
