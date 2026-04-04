from __future__ import annotations

from dataclasses import replace
from datetime import datetime
from decimal import Decimal
from typing import Any, Iterable

from backend.models.market_payload import NormalizedQuote


def _optional_int(value: Any) -> int | None:
    return None if value is None else int(value)


def _required_int(value: Any, field: str) -> int:
    if value is None:
        raise ValueError(f"Resolved row has NULL {field}; cannot hydrate quote")
    return int(value)


class MarketDataService:
    """Resolve normalized quotes against the current schema and persist snapshots."""

    RESOLVE_QUOTE_QUERY = """
        SELECT
            ex.Exchange_id AS exchange_id,
            m.Market_id AS market_id,
            COALESCE(m.Mapping_id, mm.Mapping_id) AS mapping_id,
            e.Event_id AS event_id,
            c.Contract_id AS contract_id
        FROM Exchange ex
        JOIN Market m
            ON m.Exchange_id = ex.Exchange_id
        JOIN Event e
            ON e.Event_id = m.Event_id
        LEFT JOIN MarketMapping mm
            ON mm.Event_id = e.Event_id
        JOIN Contract c
            ON c.Market_id = m.Market_id
        WHERE ex.Name = %s
          AND m.Exchange_market_code = %s
          AND c.Outcome_label = %s
        LIMIT 1
    """

    SNAPSHOT_EXISTS_QUERY = """
        SELECT 1
        FROM PriceSnapshot
        WHERE Contract_id = %s AND Snapshot_time = %s
        LIMIT 1
    """

    INSERT_SNAPSHOT_QUERY = """
        INSERT INTO PriceSnapshot (
            Contract_id,
            Snapshot_time,
            Bid,
            Ask,
            Last,
            Spread
        ) VALUES (%s, %s, %s, %s, %s, %s)
    """

    def hydrate_quotes(
        self,
        connection: Any,
        quotes: Iterable[NormalizedQuote],
    ) -> list[NormalizedQuote]:
        """Resolve local DB identifiers for normalized quotes."""

        hydrated_quotes: list[NormalizedQuote] = []
        cursor = connection.cursor(dictionary=True)

        try:
            for quote in quotes:
                if quote.contract_id is not None and quote.mapping_id is not None:
                    hydrated_quotes.append(quote)
                    continue

                cursor.execute(
                    self.RESOLVE_QUOTE_QUERY,
                    (
                        quote.exchange_name,
                        quote.exchange_market_code,
                        quote.outcome_label,
                    ),
                )
                row = cursor.fetchone()

                if not row:
                    raise ValueError(
                        "Unable to resolve quote identifiers for "
                        f"{quote.exchange_name}:{quote.exchange_market_code}:{quote.outcome_label}"
                    )

                hydrated_quotes.append(
                    replace(
                        quote,
                        mapping_id=_optional_int(row["mapping_id"]),
                        event_id=_optional_int(row["event_id"]),
                        market_id=_optional_int(row["market_id"]),
                        contract_id=_required_int(row["contract_id"], "contract_id"),
                    )
                )
        finally:
            cursor.close()

        return hydrated_quotes

    def persist_snapshots(self, connection: Any, quotes: Iterable[NormalizedQuote]) -> int:
        """Insert unique snapshots for the provided quotes."""

        inserted_count = 0
        cursor = connection.cursor()

        try:
            for quote in quotes:
                if quote.contract_id is None:
                    raise ValueError("quote.contract_id is required before persisting snapshots")

                cursor.execute(
                    self.SNAPSHOT_EXISTS_QUERY,
                    (quote.contract_id, quote.snapshot_time),
                )
                if cursor.fetchone():
                    continue

                spread = quote.ask - quote.bid
                cursor.execute(
                    self.INSERT_SNAPSHOT_QUERY,
                    (
                        quote.contract_id,
                        quote.snapshot_time,
                        quote.bid,
                        quote.ask,
                        quote.last,
                        spread,
                    ),
                )
                inserted_count += 1

            connection.commit()
            return inserted_count
        finally:
            cursor.close()


def build_mock_quotes(snapshot_time: datetime | None = None) -> list[NormalizedQuote]:
    """Return a small trusted quote set for initial end-to-end scans."""

    snapshot_time = snapshot_time or datetime.now().replace(microsecond=0)

    return [
        NormalizedQuote(
            exchange_name="Polymarket",
            exchange_market_code="POLY_US_2028",
            event_title="US Presidential Election 2028",
            outcome_label="Yes",
            bid=Decimal("0.44"),
            ask=Decimal("0.45"),
            last=Decimal("0.445"),
            snapshot_time=snapshot_time,
            source_url="https://clob.polymarket.com",
        ),
        NormalizedQuote(
            exchange_name="Kalshi",
            exchange_market_code="KAL_US_2028",
            event_title="US Presidential Election 2028",
            outcome_label="No",
            bid=Decimal("0.49"),
            ask=Decimal("0.50"),
            last=Decimal("0.495"),
            snapshot_time=snapshot_time,
            source_url="https://api.elections.kalshi.com",
        ),
    ]
