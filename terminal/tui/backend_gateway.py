from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Sequence

import mysql.connector

from backend.models.alert_view import AlertRow
from backend.services.alert_service import AlertService
from backend.utils.config import DatabaseConfig
from backend.utils.db import db_session


@dataclass(frozen=True)
class DashboardSnapshot:
    """Terminal-facing snapshot built from backend-owned alert reads."""

    active_alerts: Sequence[AlertRow]
    refreshed_at: datetime
    connection_ok: bool
    connection_message: str
    scanner_message: str

    @property
    def active_alert_count(self) -> int:
        return len(self.active_alerts)

    @property
    def top_profit_margin(self) -> Decimal | None:
        if not self.active_alerts:
            return None
        return max(alert.profit_margin for alert in self.active_alerts)

    @property
    def latest_detected_at(self) -> datetime | None:
        if not self.active_alerts:
            return None
        return max(alert.detected_at for alert in self.active_alerts)


class TerminalBackendGateway:
    """Thin adapter between the Textual app and backend services."""

    def __init__(
        self,
        alert_service: AlertService | None = None,
        db_config: DatabaseConfig | None = None,
    ) -> None:
        self.alert_service = alert_service or AlertService()
        self.db_config = db_config or DatabaseConfig.from_env()

    def load_dashboard_snapshot(self) -> DashboardSnapshot:
        refreshed_at = datetime.now().replace(microsecond=0)

        try:
            with db_session(self.db_config) as connection:
                active_alerts = self.alert_service.list_active_alerts(connection)
        except mysql.connector.Error as exc:
            return DashboardSnapshot(
                active_alerts=[],
                refreshed_at=refreshed_at,
                connection_ok=False,
                connection_message=f"DB error: {exc}",
                scanner_message="Scanner state contract is not exposed yet.",
            )

        return DashboardSnapshot(
            active_alerts=active_alerts,
            refreshed_at=refreshed_at,
            connection_ok=True,
            connection_message=(
                f"Connected to {self.db_config.database} as {self.db_config.user}"
            ),
            scanner_message="Active alerts are live. Scan log feed is still pending backend exposure.",
        )

    def dismiss_alert(self, alert_id: int) -> None:
        with db_session(self.db_config) as connection:
            self.alert_service.dismiss_alert(connection, alert_id)
