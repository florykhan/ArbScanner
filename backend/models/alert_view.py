from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any, Mapping


@dataclass(frozen=True)
class AlertRow:
    """Readable alert row returned to UI clients."""

    alert_id: int
    event_title: str
    mapped_exchanges: str
    profit_margin: Decimal
    status: str
    detected_at: datetime
    event_id: int | None = None

    @classmethod
    def from_row(cls, row: Mapping[str, Any]) -> "AlertRow":
        eid = row.get("event_id")
        return cls(
            alert_id=int(row["alert_id"]),
            event_title=str(row["event_title"]),
            mapped_exchanges=str(row["mapped_exchanges"] or ""),
            profit_margin=Decimal(str(row["profit_margin"])),
            status=str(row["status"]),
            detected_at=row["detected_at"],
            event_id=None if eid is None else int(eid),
        )

    @property
    def profit_margin_percent(self) -> Decimal:
        return self.profit_margin * Decimal("100")


@dataclass(frozen=True)
class AlertMarketDetail:
    """Venue-level market view for a selected alert."""

    exchange_name: str
    market_id: int
    market_code: str
    yes_label: str
    no_label: str
    yes_bid: Decimal | None
    yes_ask: Decimal | None
    yes_last: Decimal | None
    yes_snapshot_time: datetime | None
    no_bid: Decimal | None
    no_ask: Decimal | None
    no_last: Decimal | None
    no_snapshot_time: datetime | None

    @classmethod
    def from_row(cls, row: Mapping[str, Any]) -> "AlertMarketDetail":
        def _decimal(value: Any) -> Decimal | None:
            if value is None:
                return None
            return Decimal(str(value))

        return cls(
            exchange_name=str(row["exchange_name"]),
            market_id=int(row["market_id"]),
            market_code=str(row["market_code"]),
            yes_label=str(row.get("yes_label") or "YES"),
            no_label=str(row.get("no_label") or "NO"),
            yes_bid=_decimal(row.get("yes_bid")),
            yes_ask=_decimal(row.get("yes_ask")),
            yes_last=_decimal(row.get("yes_last")),
            yes_snapshot_time=row.get("yes_snapshot_time"),
            no_bid=_decimal(row.get("no_bid")),
            no_ask=_decimal(row.get("no_ask")),
            no_last=_decimal(row.get("no_last")),
            no_snapshot_time=row.get("no_snapshot_time"),
        )

    @property
    def pair_cost(self) -> Decimal | None:
        if self.yes_ask is None or self.no_ask is None:
            return None
        return self.yes_ask + self.no_ask

    @property
    def pair_edge(self) -> Decimal | None:
        cost = self.pair_cost
        if cost is None:
            return None
        return Decimal("1") - cost

    @property
    def freshest_snapshot_time(self) -> datetime | None:
        candidates = [
            value for value in (self.yes_snapshot_time, self.no_snapshot_time) if value
        ]
        if not candidates:
            return None
        return max(candidates)


@dataclass(frozen=True)
class AlertDetail:
    """Expanded operator detail for one alert."""

    alert_id: int
    mapping_id: int
    event_id: int
    event_title: str
    category: str | None
    close_time: datetime | None
    profit_margin: Decimal
    status: str
    detected_at: datetime
    mapping_notes: str | None
    mapping_created_at: datetime | None
    exchange_count: int
    market_count: int
    latest_snapshot_at: datetime | None
    markets: tuple[AlertMarketDetail, ...]

    @classmethod
    def from_row(
        cls,
        row: Mapping[str, Any],
        *,
        markets: list[AlertMarketDetail],
    ) -> "AlertDetail":
        return cls(
            alert_id=int(row["alert_id"]),
            mapping_id=int(row["mapping_id"]),
            event_id=int(row["event_id"]),
            event_title=str(row["event_title"]),
            category=str(row["category"]) if row.get("category") is not None else None,
            close_time=row.get("close_time"),
            profit_margin=Decimal(str(row["profit_margin"])),
            status=str(row["status"]),
            detected_at=row["detected_at"],
            mapping_notes=(
                str(row["mapping_notes"]) if row.get("mapping_notes") is not None else None
            ),
            mapping_created_at=row.get("mapping_created_at"),
            exchange_count=int(row.get("exchange_count") or 0),
            market_count=int(row.get("market_count") or 0),
            latest_snapshot_at=row.get("latest_snapshot_at"),
            markets=tuple(markets),
        )

    @property
    def profit_margin_percent(self) -> Decimal:
        return self.profit_margin * Decimal("100")

    @property
    def synthetic_pair_cost(self) -> Decimal | None:
        yes = self.best_yes_market
        no = self.best_no_market
        if yes is None or no is None or yes.yes_ask is None or no.no_ask is None:
            return None
        return yes.yes_ask + no.no_ask

    @property
    def synthetic_edge_percent(self) -> Decimal | None:
        cost = self.synthetic_pair_cost
        if cost is None:
            return None
        return (Decimal("1") - cost) * Decimal("100")

    @property
    def best_yes_market(self) -> AlertMarketDetail | None:
        candidates = [market for market in self.markets if market.yes_ask is not None]
        if not candidates:
            return None
        return min(candidates, key=lambda market: market.yes_ask or Decimal("99"))

    @property
    def best_no_market(self) -> AlertMarketDetail | None:
        candidates = [market for market in self.markets if market.no_ask is not None]
        if not candidates:
            return None
        return min(candidates, key=lambda market: market.no_ask or Decimal("99"))
