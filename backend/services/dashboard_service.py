from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any

from backend.models.dashboard_view import ActivityItem, DashboardStats


def _normalize_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if hasattr(value, "isoformat"):
        return value
    return None


class DashboardService:
    """Backend-owned dashboard reads for terminal and web surfaces."""

    SUMMARY_QUERY = """
        SELECT
            (SELECT COUNT(*)
             FROM ArbitrageAlert
             WHERE Status = 'Active') AS active_alert_count,
            (SELECT MAX(Profit_margin)
             FROM ArbitrageAlert
             WHERE Status = 'Active') AS top_profit_margin,
            (SELECT MAX(Detected_at)
             FROM ArbitrageAlert
             WHERE Status = 'Active') AS latest_detected_at,
            (SELECT COUNT(*)
             FROM PriceSnapshot) AS total_snapshots,
            (SELECT MAX(Snapshot_time)
             FROM PriceSnapshot) AS latest_snapshot_at
    """

    RECENT_ALERT_ACTIVITY_QUERY = """
        SELECT
            aa.Detected_at AS occurred_at,
            CONCAT(
                'Alert ',
                aa.Alert_id,
                ' ',
                LOWER(aa.Status),
                ' for ',
                e.Title,
                ' at ',
                ROUND(aa.Profit_margin * 100, 2),
                '%'
            ) AS message,
            'alert' AS source
        FROM ArbitrageAlert aa
        JOIN MarketMapping mm
            ON mm.Mapping_id = aa.Mapping_id
        JOIN Event e
            ON e.Event_id = mm.Event_id
        ORDER BY aa.Detected_at DESC
        LIMIT %s
    """

    RECENT_SNAPSHOT_ACTIVITY_QUERY = """
        SELECT
            ps.Snapshot_time AS occurred_at,
            CONCAT(
                'Snapshot ',
                ex.Name,
                ' / ',
                e.Title,
                ' / ',
                c.Outcome_label,
                ' ask=',
                FORMAT(ps.Ask, 4)
            ) AS message,
            'snapshot' AS source
        FROM PriceSnapshot ps
        JOIN Contract c
            ON c.Contract_id = ps.Contract_id
        JOIN Market m
            ON m.Market_id = c.Market_id
        JOIN Event e
            ON e.Event_id = m.Event_id
        JOIN Exchange ex
            ON ex.Exchange_id = m.Exchange_id
        ORDER BY ps.Snapshot_time DESC
        LIMIT %s
    """

    def load_stats(self, connection: Any) -> DashboardStats:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(self.SUMMARY_QUERY)
            row = cursor.fetchone() or {}
        finally:
            cursor.close()

        latest_snapshot_at = _normalize_datetime(row.get("latest_snapshot_at"))
        latest_detected_at = _normalize_datetime(row.get("latest_detected_at"))
        top_profit_margin = row.get("top_profit_margin")

        return DashboardStats(
            active_alert_count=int(row.get("active_alert_count") or 0),
            top_profit_margin=(
                None if top_profit_margin is None else Decimal(str(top_profit_margin))
            ),
            latest_detected_at=latest_detected_at,
            total_snapshots=int(row.get("total_snapshots") or 0),
            latest_snapshot_at=latest_snapshot_at,
            scanner_message=self._build_scanner_message(latest_snapshot_at),
        )

    def list_recent_activity(
        self,
        connection: Any,
        limit: int = 8,
    ) -> list[ActivityItem]:
        per_query_limit = max(limit, 1)
        cursor = connection.cursor(dictionary=True)

        try:
            cursor.execute(self.RECENT_ALERT_ACTIVITY_QUERY, (per_query_limit,))
            alert_rows = cursor.fetchall()
            cursor.execute(self.RECENT_SNAPSHOT_ACTIVITY_QUERY, (per_query_limit,))
            snapshot_rows = cursor.fetchall()
        finally:
            cursor.close()

        items = [
            ActivityItem(
                occurred_at=_normalize_datetime(row["occurred_at"]),
                message=str(row["message"]),
                source=str(row["source"]),
            )
            for row in [*alert_rows, *snapshot_rows]
            if _normalize_datetime(row.get("occurred_at")) is not None
        ]

        items.sort(key=lambda item: item.occurred_at, reverse=True)
        return items[:limit]

    def _build_scanner_message(self, latest_snapshot_at: datetime | None) -> str:
        if latest_snapshot_at is None:
            return "No snapshots recorded yet."

        age = datetime.now() - latest_snapshot_at

        if age <= timedelta(minutes=15):
            return "Snapshot stream looks fresh."
        if age <= timedelta(hours=24):
            return "Snapshot stream is older than 15 minutes."
        return "Snapshot stream appears stale."
