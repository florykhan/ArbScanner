from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any, Sequence

import mysql.connector

from backend.models.alert_view import AlertDetail, AlertRow
from backend.models.dashboard_view import ActivityItem, DashboardStats
from backend.services.alert_service import AlertService
from backend.services.dashboard_service import DashboardService
from backend.utils.config import DatabaseConfig
from backend.utils.db import db_session
from terminal.tui.query_loader import split_sql_statements
from terminal.tui.widgets.heatmap import HeatmapData, HeatmapEventRow


_HEATMAP_QUERY = """
    SELECT
        aa.Alert_id        AS alert_id,
        e.Title            AS event_title,
        aa.Profit_margin   AS profit_margin,
        ex.Name            AS exchange_name
    FROM ArbitrageAlert aa
    JOIN MarketMapping mm
        ON mm.Mapping_id = aa.Mapping_id
    JOIN Event e
        ON e.Event_id = mm.Event_id
    LEFT JOIN Market m
        ON m.Mapping_id = mm.Mapping_id
        OR (m.Mapping_id IS NULL AND m.Event_id = mm.Event_id)
    LEFT JOIN Exchange ex
        ON ex.Exchange_id = m.Exchange_id
    WHERE aa.Status = 'Active'
    ORDER BY aa.Profit_margin DESC, e.Title
"""

_MAX_QUERY_ROWS = 500


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

    def load_alert_detail(self, alert_id: int) -> AlertDetail | None:
        with db_session(self.db_config) as connection:
            return self.alert_service.get_alert_detail(connection, alert_id)

    # ── Ad-hoc query helpers (SQL inspector + :query palette) ──

    def run_query(
        self,
        sql: str,
        params: Sequence[Any] = (),
    ) -> tuple[list[str], list[tuple]]:
        """Execute a SQL body (possibly multi-statement) and return the
        last result set that produced rows.

        Supports the rubric's transaction demos (START TRANSACTION / UPDATE
        / SELECT / ROLLBACK) by executing statements one at a time and
        picking the final statement with a row-returning description.

        Rows are capped to ``_MAX_QUERY_ROWS`` to keep the TUI responsive.
        """
        statements = split_sql_statements(sql)
        if not statements:
            return [], []

        params_tuple: tuple = tuple(params) if params else ()
        last_cols: list[str] = []
        last_rows: list[tuple] = []

        with db_session(self.db_config) as connection:
            cursor = connection.cursor()
            try:
                param_idx = 0
                for stmt in statements:
                    placeholders = stmt.count("%s")
                    if placeholders == 0:
                        cursor.execute(stmt)
                    else:
                        slice_ = params_tuple[
                            param_idx : param_idx + placeholders
                        ]
                        if len(slice_) < placeholders:
                            slice_ = slice_ + tuple(
                                [1] * (placeholders - len(slice_))
                            )
                        cursor.execute(stmt, slice_)
                        param_idx += placeholders

                    if cursor.description:
                        last_cols = [
                            str(desc[0]) for desc in cursor.description
                        ]
                        # Consume all rows so the next statement can run
                        # without "Unread result found" errors, then clip.
                        fetched = cursor.fetchall()
                        last_rows = list(fetched[:_MAX_QUERY_ROWS])
            finally:
                cursor.close()

        return last_cols, last_rows

    def load_heatmap(self) -> HeatmapData:
        """Aggregate active-alert margins into an event × exchange grid."""
        try:
            with db_session(self.db_config) as connection:
                cursor = connection.cursor(dictionary=True)
                try:
                    cursor.execute(_HEATMAP_QUERY)
                    rows = cursor.fetchall()
                finally:
                    cursor.close()
        except mysql.connector.Error:
            return HeatmapData()

        event_order: list[str] = []
        event_margins: dict[str, dict[str, float]] = {}
        event_max: dict[str, float] = {}
        exchanges: list[str] = []

        for row in rows:
            title = str(row["event_title"])
            exchange = row.get("exchange_name")
            margin_raw = row.get("profit_margin")

            if margin_raw is None:
                pct = 0.0
            else:
                pct = float(Decimal(str(margin_raw)) * Decimal("100"))

            if title not in event_margins:
                event_margins[title] = {}
                event_order.append(title)
                event_max[title] = pct
            else:
                if pct > event_max[title]:
                    event_max[title] = pct

            if exchange:
                ex_name = str(exchange)
                if ex_name not in exchanges:
                    exchanges.append(ex_name)
                event_margins[title][ex_name] = max(
                    event_margins[title].get(ex_name, 0.0),
                    pct,
                )

        exchanges.sort()
        ordered_events = sorted(
            event_order,
            key=lambda title: event_max.get(title, 0.0),
            reverse=True,
        )

        heatmap_rows = [
            HeatmapEventRow(
                event_title=title,
                exchange_margins=event_margins[title],
            )
            for title in ordered_events
        ]

        return HeatmapData(exchanges=exchanges, rows=heatmap_rows)
