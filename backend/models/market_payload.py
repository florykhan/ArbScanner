from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any, Mapping


@dataclass(frozen=True)
class NormalizedQuote:
    """Normalized quote shape consumed by scanner logic."""

    exchange_name: str
    exchange_market_code: str
    event_title: str
    outcome_label: str
    bid: Decimal
    ask: Decimal
    last: Decimal
    snapshot_time: datetime
    mapping_id: int | None = None
    event_id: int | None = None
    market_id: int | None = None
    contract_id: int | None = None
    source_url: str | None = None

    @classmethod
    def from_dict(cls, payload: Mapping[str, Any]) -> "NormalizedQuote":
        return cls(
            exchange_name=str(payload["exchange_name"]),
            exchange_market_code=str(payload["exchange_market_code"]),
            event_title=str(payload["event_title"]),
            outcome_label=str(payload["outcome_label"]),
            bid=Decimal(str(payload["bid"])),
            ask=Decimal(str(payload["ask"])),
            last=Decimal(str(payload["last"])),
            snapshot_time=payload["snapshot_time"],
            mapping_id=payload.get("mapping_id"),
            event_id=payload.get("event_id"),
            market_id=payload.get("market_id"),
            contract_id=payload.get("contract_id"),
            source_url=payload.get("source_url"),
        )

    @property
    def normalized_outcome(self) -> str:
        return self.outcome_label.strip().lower()

    def validate(self) -> None:
        if not self.exchange_name:
            raise ValueError("exchange_name is required")
        if not self.exchange_market_code:
            raise ValueError("exchange_market_code is required")
        if not self.event_title:
            raise ValueError("event_title is required")
        if self.ask < 0 or self.bid < 0 or self.last < 0:
            raise ValueError("quote values cannot be negative")
