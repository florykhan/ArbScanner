from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from backend.models.alert_view import AlertRow


class AlertService:
    """Application-facing reads and writes for arbitrage alerts."""

    ACTIVE_ALERTS_QUERY = """
        SELECT
            aa.Alert_id AS alert_id,
            e.Title AS event_title,
            GROUP_CONCAT(DISTINCT ex.Name ORDER BY ex.Name SEPARATOR ' | ') AS mapped_exchanges,
            aa.Profit_margin AS profit_margin,
            aa.Status AS status,
            aa.Detected_at AS detected_at
        FROM ArbitrageAlert aa
        JOIN MarketMapping mm ON mm.Mapping_id = aa.Mapping_id
        JOIN Event e ON e.Event_id = mm.Event_id
        LEFT JOIN Market m
            ON m.Mapping_id = mm.Mapping_id
            OR (m.Mapping_id IS NULL AND m.Event_id = mm.Event_id)
        LEFT JOIN Exchange ex ON ex.Exchange_id = m.Exchange_id
        WHERE aa.Status = %s
        GROUP BY
            aa.Alert_id,
            e.Title,
            aa.Profit_margin,
            aa.Status,
            aa.Detected_at
        ORDER BY aa.Profit_margin DESC, aa.Detected_at DESC
    """

    NEXT_ALERT_ID_QUERY = """
        SELECT COALESCE(MAX(Alert_id), 0) + 1 AS next_alert_id
        FROM ArbitrageAlert
    """

    INSERT_ALERT_QUERY = """
        INSERT INTO ArbitrageAlert (
            Alert_id,
            Mapping_id,
            Profit_margin,
            Detected_at,
            Status
        ) VALUES (%s, %s, %s, %s, %s)
    """

    ACTIVE_ALERT_FOR_MAPPING_QUERY = """
        SELECT Alert_id AS alert_id
        FROM ArbitrageAlert
        WHERE Mapping_id = %s AND Status = %s
        ORDER BY Detected_at DESC
        LIMIT 1
    """

    UPDATE_ALERT_QUERY = """
        UPDATE ArbitrageAlert
        SET Profit_margin = %s,
            Detected_at = %s,
            Status = %s
        WHERE Alert_id = %s
    """

    DISMISS_ALERT_QUERY = """
        UPDATE ArbitrageAlert
        SET Status = %s
        WHERE Alert_id = %s
    """

    def list_active_alerts(self, connection: Any) -> list[AlertRow]:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(self.ACTIVE_ALERTS_QUERY, ("Active",))
            rows = cursor.fetchall()
            return [AlertRow.from_row(row) for row in rows]
        finally:
            cursor.close()

    def create_alert(
        self,
        connection: Any,
        mapping_id: int,
        profit_margin: Decimal,
        detected_at: datetime,
        status: str = "Active",
    ) -> int:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(self.NEXT_ALERT_ID_QUERY)
            row = cursor.fetchone()
            next_alert_id = int(row["next_alert_id"])
            cursor.execute(
                self.INSERT_ALERT_QUERY,
                (
                    next_alert_id,
                    mapping_id,
                    profit_margin,
                    detected_at,
                    status,
                ),
            )
            connection.commit()
            return next_alert_id
        finally:
            cursor.close()

    def upsert_active_alert(
        self,
        connection: Any,
        mapping_id: int,
        profit_margin: Decimal,
        detected_at: datetime,
    ) -> int:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(self.ACTIVE_ALERT_FOR_MAPPING_QUERY, (mapping_id, "Active"))
            row = cursor.fetchone()

            if row:
                alert_id = int(row["alert_id"])
                cursor.execute(
                    self.UPDATE_ALERT_QUERY,
                    (profit_margin, detected_at, "Active", alert_id),
                )
                connection.commit()
                return alert_id
        finally:
            cursor.close()

        return self.create_alert(
            connection=connection,
            mapping_id=mapping_id,
            profit_margin=profit_margin,
            detected_at=detected_at,
            status="Active",
        )

    def dismiss_alert(self, connection: Any, alert_id: int) -> None:
        cursor = connection.cursor()
        try:
            cursor.execute(self.DISMISS_ALERT_QUERY, ("Expired", alert_id))
            connection.commit()
        finally:
            cursor.close()
