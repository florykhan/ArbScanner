from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass(frozen=True)
class ActivityItem:
    """Time-ordered activity line derived from persisted backend state."""

    occurred_at: datetime
    message: str
    source: str


@dataclass(frozen=True)
class DashboardStats:
    """Summary metrics the terminal can render without computing locally."""

    active_alert_count: int
    top_profit_margin: Decimal | None
    latest_detected_at: datetime | None
    total_snapshots: int
    latest_snapshot_at: datetime | None
    scanner_message: str
