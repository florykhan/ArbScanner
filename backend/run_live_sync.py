from __future__ import annotations

import argparse
import logging

from backend.models.market_payload import NormalizedQuote
from backend.services.kalshi_service import KalshiService
from backend.services.manifold_service import ManifoldService
from backend.services.market_data_service import MarketDataService
from backend.services.market_registry_service import MarketRegistryService
from backend.services.polymarket_service import PolymarketService
from backend.services.scanner_service import ScannerService
from backend.services.title_mapper_service import TitleMapperService
from backend.utils.config import KalshiConfig, ManifoldConfig, PolymarketConfig
from backend.utils.db import db_session


def configure_logging() -> None:
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Sync live Polymarket, Manifold, and Kalshi data into ArbScanner in one scan cycle"
    )
    parser.add_argument(
        "--polymarket-limit",
        type=int,
        default=50,
        help="Number of active Polymarket markets to fetch",
    )
    parser.add_argument(
        "--manifold-limit",
        type=int,
        default=50,
        help="Number of recent Manifold markets to fetch",
    )
    parser.add_argument(
        "--kalshi-limit",
        type=int,
        default=50,
        help="Number of active Kalshi markets to fetch",
    )
    return parser.parse_args()


def _register_exchange_quotes(
    connection: object,
    registry_service: MarketRegistryService,
    quotes: list[NormalizedQuote],
    exchange_api_base_url: str,
) -> None:
    if not quotes:
        return
    registry_service.ensure_quotes_registered(
        connection,
        quotes,
        exchange_api_base_url=exchange_api_base_url,
    )


def main() -> None:
    configure_logging()
    args = parse_args()

    polymarket_config = PolymarketConfig.from_env()
    manifold_config = ManifoldConfig.from_env()
    kalshi_config = KalshiConfig.from_env()

    polymarket_quotes = PolymarketService(polymarket_config).fetch_active_binary_quotes(
        limit=args.polymarket_limit
    )
    manifold_quotes = ManifoldService(manifold_config).fetch_active_binary_quotes(
        limit=args.manifold_limit
    )
    kalshi_quotes = KalshiService(kalshi_config).fetch_active_binary_quotes(limit=args.kalshi_limit)

    all_quotes = polymarket_quotes + manifold_quotes + kalshi_quotes
    if not all_quotes:
        logging.info("No supported live quotes returned from any exchange")
        return

    registry_service = MarketRegistryService()
    market_data_service = MarketDataService()
    scanner_service = ScannerService()
    title_mapper_service = TitleMapperService()

    mapped_quotes, mapped_groups = title_mapper_service.remap_quotes(all_quotes)

    with db_session() as connection:
        _register_exchange_quotes(
            connection,
            registry_service,
            [quote for quote in mapped_quotes if quote.exchange_name == "Polymarket"],
            polymarket_config.gamma_base_url,
        )
        _register_exchange_quotes(
            connection,
            registry_service,
            [quote for quote in mapped_quotes if quote.exchange_name == "Manifold"],
            manifold_config.api_base_url,
        )
        _register_exchange_quotes(
            connection,
            registry_service,
            [quote for quote in mapped_quotes if quote.exchange_name == "Kalshi"],
            kalshi_config.api_base_url,
        )
        hydrated_quotes = market_data_service.hydrate_quotes(connection, mapped_quotes)
        inserted_snapshots = market_data_service.persist_snapshots(connection, hydrated_quotes)
        alert_ids = scanner_service.run_scan_cycle(connection, hydrated_quotes)

    logging.info("Fetched %s Polymarket quote(s)", len(polymarket_quotes))
    logging.info("Fetched %s Manifold quote(s)", len(manifold_quotes))
    logging.info("Fetched %s Kalshi quote(s)", len(kalshi_quotes))
    logging.info("Mapped %s cross-exchange title group(s)", len(mapped_groups))
    for group in mapped_groups[:5]:
        logging.info(
            "Mapped title group | %s | %s",
            " | ".join(group.exchanges),
            group.canonical_title,
        )
    logging.info("Persisted %s snapshot(s)", inserted_snapshots)
    logging.info("Created or refreshed %s active alert(s)", len(alert_ids))


if __name__ == "__main__":
    main()
