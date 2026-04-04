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

    @classmethod
    def from_row(cls, row: Mapping[str, Any]) -> "AlertRow":
        return cls(
            alert_id=int(row["alert_id"]),
            event_title=str(row["event_title"]),
            mapped_exchanges=str(row["mapped_exchanges"]),
            profit_margin=Decimal(str(row["profit_margin"])),
            status=str(row["status"]),
            detected_at=row["detected_at"],
        )

    @property
    def profit_margin_percent(self) -> Decimal:
        return self.profit_margin * Decimal("100")
