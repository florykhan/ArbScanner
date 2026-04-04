from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode, urlparse
from urllib.request import urlopen

from backend.utils.db import DEFAULT_DB_PATH, connect, initialize_database


MANIFOLD_BASE_URL = "https://api.manifold.markets"


@dataclass
class IngestSummary:
    fetched: int = 0
    imported: int = 0
    skipped_non_binary: int = 0


def _iso_from_millis(value: int | None) -> str | None:
    if value is None:
        return None
    return datetime.fromtimestamp(value / 1000, tz=timezone.utc).replace(microsecond=0).isoformat()


def _slug_from_market(market: dict[str, Any]) -> str:
    url = market.get("url")
    if url:
        slug = urlparse(url).path.rstrip("/").split("/")[-1]
        if slug:
            return slug
    return market["id"]


def fetch_markets(limit: int = 25) -> list[dict[str, Any]]:
    params = urlencode({"limit": limit})
    with urlopen(f"{MANIFOLD_BASE_URL}/v0/markets?{params}", timeout=30) as response:
        return json.load(response)


def _get_or_create_exchange(connection) -> int:
    row = connection.execute(
        "SELECT Exchange_id FROM Exchange WHERE Name = ?",
        ("Manifold Markets",),
    ).fetchone()
    if row:
        return row["Exchange_id"]

    cursor = connection.execute(
        """
        INSERT INTO Exchange (Name, API_base_url)
        VALUES (?, ?)
        """,
        ("Manifold Markets", MANIFOLD_BASE_URL),
    )
    return int(cursor.lastrowid)


def _get_or_create_event(connection, market: dict[str, Any]) -> int:
    close_time = _iso_from_millis(market.get("closeTime"))
    row = connection.execute(
        """
        SELECT Event_id
        FROM Event
        WHERE Title = ? AND COALESCE(Close_time, '') = COALESCE(?, '')
        """,
        (market["question"], close_time),
    ).fetchone()
    if row:
        return row["Event_id"]

    cursor = connection.execute(
        """
        INSERT INTO Event (Title, Category, Close_time)
        VALUES (?, ?, ?)
        """,
        (
            market["question"],
            "manifold-import",
            close_time,
        ),
    )
    return int(cursor.lastrowid)


def _get_or_create_mapping(connection, event_id: int) -> int:
    row = connection.execute(
        "SELECT Mapping_id FROM MarketMapping WHERE Event_id = ?",
        (event_id,),
    ).fetchone()
    if row:
        return row["Mapping_id"]

    cursor = connection.execute(
        """
        INSERT INTO MarketMapping (Event_id, Notes, Created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        """,
        (
            event_id,
            "Auto-created from Manifold ingestion. Cross-exchange grouping is still a manual review step.",
        ),
    )
    return int(cursor.lastrowid)


def _upsert_market(connection, exchange_id: int, event_id: int, mapping_id: int, market: dict[str, Any]) -> int:
    market_code = _slug_from_market(market)
    row = connection.execute(
        """
        SELECT Market_id
        FROM Market
        WHERE Exchange_id = ? AND Exchange_market_code = ?
        """,
        (exchange_id, market_code),
    ).fetchone()
    if row:
        connection.execute(
            """
            UPDATE Market
            SET Event_id = ?, Mapping_id = ?
            WHERE Market_id = ?
            """,
            (event_id, mapping_id, row["Market_id"]),
        )
        return row["Market_id"]

    cursor = connection.execute(
        """
        INSERT INTO Market (Exchange_id, Event_id, Mapping_id, Exchange_market_code)
        VALUES (?, ?, ?, ?)
        """,
        (exchange_id, event_id, mapping_id, market_code),
    )
    return int(cursor.lastrowid)


def _upsert_binary_contracts(connection, market_id: int) -> dict[str, int]:
    connection.execute(
        """
        INSERT INTO BinaryMarket (Market_id, Yes_label, No_label)
        VALUES (?, ?, ?)
        ON CONFLICT(Market_id) DO UPDATE SET
          Yes_label = excluded.Yes_label,
          No_label = excluded.No_label
        """,
        (market_id, "YES", "NO"),
    )

    contract_ids: dict[str, int] = {}
    for label in ("YES", "NO"):
        row = connection.execute(
            """
            SELECT Contract_id
            FROM Contract
            WHERE Market_id = ? AND Outcome_label = ?
            """,
            (market_id, label),
        ).fetchone()
        if row:
            contract_ids[label] = row["Contract_id"]
            continue

        cursor = connection.execute(
            """
            INSERT INTO Contract (Market_id, Outcome_label)
            VALUES (?, ?)
            """,
            (market_id, label),
        )
        contract_ids[label] = int(cursor.lastrowid)
    return contract_ids


def _insert_snapshot(connection, contract_id: int, snapshot_time: str, last_price: float | None) -> None:
    connection.execute(
        """
        INSERT OR REPLACE INTO PriceSnapshot (
            Contract_id,
            Snapshot_time,
            Bid,
            Ask,
            Last,
            Spread
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        (contract_id, snapshot_time, None, None, last_price, None),
    )


def ingest_binary_markets(
    db_path: Path | str = DEFAULT_DB_PATH,
    *,
    limit: int = 25,
) -> IngestSummary:
    initialize_database(db_path, with_seed=False)
    markets = fetch_markets(limit=limit)
    summary = IngestSummary(fetched=len(markets))

    with connect(db_path) as connection:
        exchange_id = _get_or_create_exchange(connection)

        for market in markets:
            if market.get("outcomeType") != "BINARY":
                summary.skipped_non_binary += 1
                continue

            event_id = _get_or_create_event(connection, market)
            mapping_id = _get_or_create_mapping(connection, event_id)
            market_id = _upsert_market(connection, exchange_id, event_id, mapping_id, market)
            contract_ids = _upsert_binary_contracts(connection, market_id)

            snapshot_time = _iso_from_millis(
                market.get("lastUpdatedTime")
                or market.get("lastBetTime")
                or market.get("closeTime")
                or market.get("createdTime")
            )
            probability = market.get("probability")
            if snapshot_time and probability is not None:
                # The list endpoint exposes the midpoint probability but not a tradable bid/ask book,
                # so the scaffold stores that value as Last and leaves the quote fields null.
                _insert_snapshot(connection, contract_ids["YES"], snapshot_time, float(probability))
                _insert_snapshot(connection, contract_ids["NO"], snapshot_time, round(1 - float(probability), 4))

            summary.imported += 1

    return summary
