from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Sequence

import mysql.connector

from backend.models.alert_view import AlertRow
from backend.models.dashboard_view import ActivityItem, DashboardStats
from backend.services.alert_service import AlertService
from backend.services.dashboard_service import DashboardService
from backend.utils.config import DatabaseConfig
from backend.utils.db import db_session


@dataclass(frozen=True)
class DashboardSnapshot:
    """Terminal-facing snapshot built from backend-owned alert reads."""

    active_alerts: Sequence[AlertRow]
    stats: DashboardStats | None
    recent_activity: Sequence[ActivityItem]
    refreshed_at: datetime
    connection_ok: bool
    connection_message: str
    scanner_message: str

    @property
    def active_alert_count(self) -> int:
        if self.stats is not None:
            return self.stats.active_alert_count
        return len(self.active_alerts)

    @property
    def top_profit_margin(self) -> Decimal | None:
        if self.stats is not None:
            return self.stats.top_profit_margin
        if not self.active_alerts:
            return None
        return max(alert.profit_margin for alert in self.active_alerts)

    @property
    def latest_detected_at(self) -> datetime | None:
        if self.stats is not None:
            return self.stats.latest_detected_at
        if not self.active_alerts:
            return None
        return max(alert.detected_at for alert in self.active_alerts)

    @property
    def total_snapshots(self) -> int:
        if self.stats is None:
            return 0
        return self.stats.total_snapshots

    @property
    def latest_snapshot_at(self) -> datetime | None:
        if self.stats is None:
            return None
        return self.stats.latest_snapshot_at


class TerminalBackendGateway:
    """Thin adapter between the Textual app and backend services."""

    def __init__(
        self,
        alert_service: AlertService | None = None,
        dashboard_service: DashboardService | None = None,
        db_config: DatabaseConfig | None = None,
    ) -> None:
        self.alert_service = alert_service or AlertService()
        self.dashboard_service = dashboard_service or DashboardService()
        self.db_config = db_config or DatabaseConfig.from_env()

    def load_dashboard_snapshot(self) -> DashboardSnapshot:
        refreshed_at = datetime.now().replace(microsecond=0)

        try:
            with db_session(self.db_config) as connection:
                active_alerts = self.alert_service.list_active_alerts(connection)
                stats = self.dashboard_service.load_stats(connection)
                recent_activity = self.dashboard_service.list_recent_activity(connection)
        except mysql.connector.Error as exc:
            return DashboardSnapshot(
                active_alerts=[],
                stats=None,
                recent_activity=[],
                refreshed_at=refreshed_at,
                connection_ok=False,
                connection_message=f"DB error: {exc}",
                scanner_message="Scanner state contract unavailable due to DB error.",
            )

        return DashboardSnapshot(
            active_alerts=active_alerts,
            stats=stats,
            recent_activity=recent_activity,
            refreshed_at=refreshed_at,
            connection_ok=True,
            connection_message=(
                f"Connected to {self.db_config.database} as {self.db_config.user}"
            ),
            scanner_message=stats.scanner_message,
        )

    def dismiss_alert(self, alert_id: int) -> None:
        with db_session(self.db_config) as connection:
            self.alert_service.dismiss_alert(connection, alert_id)
