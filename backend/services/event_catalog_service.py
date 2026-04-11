from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any


def _decimal(value: Any) -> float | None:
    if value is None:
        return None
    return float(Decimal(str(value)))


def _dt(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    return None


@dataclass(frozen=True)
class EventListRow:
    event_id: int
    title: str
    category: str | None
    close_time: datetime | None
    market_count: int
    mapping_count: int


@dataclass(frozen=True)
class EventMarketContractRow:
    exchange_name: str
    market_id: int
    exchange_market_code: str
    outcome_label: str
    bid: float | None
    ask: float | None
    last: float | None
    spread: float | None
    snapshot_time: datetime | None


class EventCatalogService:
    """Read-only catalog queries for web UI (events, markets, snapshots)."""

    LIST_EVENTS_QUERY = """
        SELECT
            e.Event_id AS event_id,
            e.Title AS title,
            e.Category AS category,
            e.Close_time AS close_time,
            (SELECT COUNT(*) FROM Market m WHERE m.Event_id = e.Event_id) AS market_count,
            (SELECT COUNT(*) FROM MarketMapping mm WHERE mm.Event_id = e.Event_id) AS mapping_count
        FROM Event e
        ORDER BY e.Event_id ASC
    """

    EVENT_HEADER_QUERY = """
        SELECT Event_id AS event_id, Title AS title, Category AS category, Close_time AS close_time
        FROM Event
        WHERE Event_id = %s
        LIMIT 1
    """

    LATEST_SNAPSHOT_SUBQUERY = """
        SELECT
            ps.Contract_id,
            ps.Snapshot_time,
            ps.Bid,
            ps.Ask,
            ps.Last,
            ps.Spread
        FROM PriceSnapshot ps
        JOIN (
            SELECT Contract_id, MAX(Snapshot_time) AS latest_snapshot_time
            FROM PriceSnapshot
            GROUP BY Contract_id
        ) latest
            ON latest.Contract_id = ps.Contract_id
           AND latest.latest_snapshot_time = ps.Snapshot_time
    """

    EVENT_MARKET_ROWS_QUERY = f"""
        SELECT
            ex.Name AS exchange_name,
            m.Market_id AS market_id,
            m.Exchange_market_code AS exchange_market_code,
            c.Outcome_label AS outcome_label,
            snap.Bid AS bid,
            snap.Ask AS ask,
            snap.Last AS last,
            snap.Spread AS spread,
            snap.Snapshot_time AS snapshot_time
        FROM Market m
        JOIN Exchange ex ON ex.Exchange_id = m.Exchange_id
        JOIN Contract c ON c.Market_id = m.Market_id
        LEFT JOIN ({LATEST_SNAPSHOT_SUBQUERY.strip()}) snap ON snap.Contract_id = c.Contract_id
        WHERE m.Event_id = %s
        ORDER BY ex.Name, m.Exchange_market_code, c.Outcome_label
    """

    YES_HISTORY_QUERY = f"""
        SELECT
            ps.Snapshot_time AS snapshot_time,
            ex.Name AS exchange_name,
            ps.Last AS last_value,
            ps.Bid AS bid,
            ps.Ask AS ask
        FROM PriceSnapshot ps
        JOIN Contract c ON c.Contract_id = ps.Contract_id
        JOIN Market m ON m.Market_id = c.Market_id
        JOIN Exchange ex ON ex.Exchange_id = m.Exchange_id
        WHERE m.Event_id = %s
          AND UPPER(TRIM(c.Outcome_label)) IN ('YES', 'Y')
        ORDER BY ps.Snapshot_time ASC
        LIMIT %s
    """

    SPREAD_BY_DAY_QUERY = """
        SELECT DATE(Snapshot_time) AS day, AVG(Spread) AS avg_spread
        FROM PriceSnapshot
        WHERE Snapshot_time >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
        GROUP BY DATE(Snapshot_time)
        ORDER BY day ASC
    """

    ALERTS_BY_DAY_QUERY = """
        SELECT DATE(Detected_at) AS day, COUNT(*) AS alert_count
        FROM ArbitrageAlert
        WHERE Detected_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
        GROUP BY DATE(Detected_at)
        ORDER BY day ASC
    """

    def list_events(self, connection: Any) -> list[EventListRow]:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(self.LIST_EVENTS_QUERY)
            rows = cursor.fetchall()
            out: list[EventListRow] = []
            for row in rows:
                out.append(
                    EventListRow(
                        event_id=int(row["event_id"]),
                        title=str(row["title"]),
                        category=(
                            str(row["category"]) if row.get("category") is not None else None
                        ),
                        close_time=_dt(row.get("close_time")),
                        market_count=int(row.get("market_count") or 0),
                        mapping_count=int(row.get("mapping_count") or 0),
                    )
                )
            return out
        finally:
            cursor.close()

    def get_event_header(self, connection: Any, event_id: int) -> dict[str, Any] | None:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(self.EVENT_HEADER_QUERY, (event_id,))
            return cursor.fetchone()
        finally:
            cursor.close()

    def list_event_market_rows(self, connection: Any, event_id: int) -> list[EventMarketContractRow]:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(self.EVENT_MARKET_ROWS_QUERY, (event_id,))
            rows = cursor.fetchall()
            return [
                EventMarketContractRow(
                    exchange_name=str(row["exchange_name"]),
                    market_id=int(row["market_id"]),
                    exchange_market_code=str(row["exchange_market_code"]),
                    outcome_label=str(row["outcome_label"]),
                    bid=_decimal(row.get("bid")),
                    ask=_decimal(row.get("ask")),
                    last=_decimal(row.get("last")),
                    spread=_decimal(row.get("spread")),
                    snapshot_time=_dt(row.get("snapshot_time")),
                )
                for row in rows
            ]
        finally:
            cursor.close()

    def list_yes_price_points(self, connection: Any, event_id: int, limit: int = 2000) -> list[dict[str, Any]]:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(self.YES_HISTORY_QUERY, (event_id, limit))
            rows = cursor.fetchall()
            out = []
            for row in rows:
                ts = _dt(row.get("snapshot_time"))
                out.append(
                    {
                        "snapshot_time": ts.isoformat() if ts else None,
                        "exchange_name": str(row["exchange_name"]),
                        "last": _decimal(row.get("last_value")),
                        "bid": _decimal(row.get("bid")),
                        "ask": _decimal(row.get("ask")),
                    }
                )
            return out
        finally:
            cursor.close()

    def synthetic_yes_no_edge(self, rows: list[EventMarketContractRow]) -> dict[str, Any] | None:
        """Best YES ask + best NO ask across mapped markets (cross-venue heuristic)."""
        yes_asks: list[tuple[Decimal, str, str]] = []
        no_asks: list[tuple[Decimal, str, str]] = []
        for r in rows:
            label = r.outcome_label.strip().upper()
            if r.ask is None:
                continue
            ask = Decimal(str(r.ask))
            key = (r.exchange_name, r.exchange_market_code)
            if label in ("YES", "Y"):
                yes_asks.append((ask, r.exchange_name, r.exchange_market_code))
            elif label in ("NO", "N"):
                no_asks.append((ask, r.exchange_name, r.exchange_market_code))
        if not yes_asks or not no_asks:
            return None
        best_yes = min(yes_asks, key=lambda t: t[0])
        best_no = min(no_asks, key=lambda t: t[0])
        pair = best_yes[0] + best_no[0]
        edge = Decimal("1") - pair
        return {
            "pair_cost": float(pair),
            "edge_percent": float(edge * Decimal("100")),
            "yes_exchange": best_yes[1],
            "no_exchange": best_no[1],
            "yes_market_code": best_yes[2],
            "no_market_code": best_no[2],
        }

    def home_timeseries(self, connection: Any) -> dict[str, Any]:
        cursor = connection.cursor(dictionary=True)
        spread_rows: list[dict[str, Any]] = []
        alert_rows: list[dict[str, Any]] = []
        try:
            cursor.execute(self.SPREAD_BY_DAY_QUERY)
            for row in cursor.fetchall() or []:
                day = row["day"]
                spread_rows.append(
                    {
                        "day": day.isoformat() if hasattr(day, "isoformat") else str(day),
                        "avg_spread": float(row["avg_spread"]) if row.get("avg_spread") is not None else None,
                    }
                )
            cursor.execute(self.ALERTS_BY_DAY_QUERY)
            for row in cursor.fetchall() or []:
                day = row["day"]
                alert_rows.append(
                    {
                        "day": day.isoformat() if hasattr(day, "isoformat") else str(day),
                        "count": int(row["alert_count"] or 0),
                    }
                )
        finally:
            cursor.close()
        return {"snapshot_spread_by_day": spread_rows, "alerts_by_day": alert_rows}
