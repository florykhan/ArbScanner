from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from backend.models.alert_view import AlertDetail, AlertMarketDetail, AlertRow


class AlertService:
    """Application-facing reads and writes for arbitrage alerts."""

    ACTIVE_ALERTS_QUERY = """
        SELECT
            aa.Alert_id AS alert_id,
            e.Event_id AS event_id,
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
            e.Event_id,
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

    ALERT_DETAIL_SUMMARY_QUERY = """
        SELECT
            aa.Alert_id AS alert_id,
            aa.Mapping_id AS mapping_id,
            e.Event_id AS event_id,
            e.Title AS event_title,
            e.Category AS category,
            e.Close_time AS close_time,
            aa.Profit_margin AS profit_margin,
            aa.Status AS status,
            aa.Detected_at AS detected_at,
            mm.Notes AS mapping_notes,
            mm.Created_at AS mapping_created_at,
            COUNT(DISTINCT m.Exchange_id) AS exchange_count,
            COUNT(DISTINCT m.Market_id) AS market_count,
            MAX(ps.Snapshot_time) AS latest_snapshot_at
        FROM ArbitrageAlert aa
        JOIN MarketMapping mm ON mm.Mapping_id = aa.Mapping_id
        JOIN Event e ON e.Event_id = mm.Event_id
        LEFT JOIN Market m
            ON m.Mapping_id = mm.Mapping_id
            OR (m.Mapping_id IS NULL AND m.Event_id = mm.Event_id)
        LEFT JOIN Contract c ON c.Market_id = m.Market_id
        LEFT JOIN PriceSnapshot ps ON ps.Contract_id = c.Contract_id
        WHERE aa.Alert_id = %s
        GROUP BY
            aa.Alert_id,
            aa.Mapping_id,
            e.Event_id,
            e.Title,
            e.Category,
            e.Close_time,
            aa.Profit_margin,
            aa.Status,
            aa.Detected_at,
            mm.Notes,
            mm.Created_at
        LIMIT 1
    """

    ALERT_DETAIL_MARKETS_QUERY = """
        SELECT
            ex.Name AS exchange_name,
            m.Market_id AS market_id,
            m.Exchange_market_code AS market_code,
            COALESCE(MAX(CASE WHEN UPPER(c.Outcome_label) = 'YES' THEN bm.Yes_label END), 'YES') AS yes_label,
            COALESCE(MAX(CASE WHEN UPPER(c.Outcome_label) = 'NO' THEN bm.No_label END), 'NO') AS no_label,
            MAX(CASE WHEN UPPER(c.Outcome_label) = 'YES' THEN snap.Bid END) AS yes_bid,
            MAX(CASE WHEN UPPER(c.Outcome_label) = 'YES' THEN snap.Ask END) AS yes_ask,
            MAX(CASE WHEN UPPER(c.Outcome_label) = 'YES' THEN snap.Last END) AS yes_last,
            MAX(CASE WHEN UPPER(c.Outcome_label) = 'YES' THEN snap.Snapshot_time END) AS yes_snapshot_time,
            MAX(CASE WHEN UPPER(c.Outcome_label) = 'NO' THEN snap.Bid END) AS no_bid,
            MAX(CASE WHEN UPPER(c.Outcome_label) = 'NO' THEN snap.Ask END) AS no_ask,
            MAX(CASE WHEN UPPER(c.Outcome_label) = 'NO' THEN snap.Last END) AS no_last,
            MAX(CASE WHEN UPPER(c.Outcome_label) = 'NO' THEN snap.Snapshot_time END) AS no_snapshot_time
        FROM ArbitrageAlert aa
        JOIN MarketMapping mm ON mm.Mapping_id = aa.Mapping_id
        JOIN Event e ON e.Event_id = mm.Event_id
        JOIN Market m
            ON m.Mapping_id = mm.Mapping_id
            OR (m.Mapping_id IS NULL AND m.Event_id = mm.Event_id)
        JOIN Exchange ex ON ex.Exchange_id = m.Exchange_id
        LEFT JOIN BinaryMarket bm ON bm.Market_id = m.Market_id
        LEFT JOIN Contract c ON c.Market_id = m.Market_id
        LEFT JOIN (
            SELECT
                ps.Contract_id,
                ps.Snapshot_time,
                ps.Bid,
                ps.Ask,
                ps.Last,
                ps.Spread
            FROM PriceSnapshot ps
            JOIN (
                SELECT
                    Contract_id,
                    MAX(Snapshot_time) AS latest_snapshot_time
                FROM PriceSnapshot
                GROUP BY Contract_id
            ) latest
                ON latest.Contract_id = ps.Contract_id
               AND latest.latest_snapshot_time = ps.Snapshot_time
        ) snap ON snap.Contract_id = c.Contract_id
        WHERE aa.Alert_id = %s
        GROUP BY
            ex.Name,
            m.Market_id,
            m.Exchange_market_code
        ORDER BY ex.Name, m.Exchange_market_code
    """

    LIST_ALERTS_QUERY = """
        SELECT
            aa.Alert_id AS alert_id,
            e.Title AS event_title,
            GROUP_CONCAT(DISTINCT ex.Name ORDER BY ex.Name SEPARATOR ' | ') AS mapped_exchanges,
            aa.Profit_margin AS profit_margin,
            aa.Status AS status,
            aa.Detected_at AS detected_at,
            e.Event_id AS event_id
        FROM ArbitrageAlert aa
        JOIN MarketMapping mm ON mm.Mapping_id = aa.Mapping_id
        JOIN Event e ON e.Event_id = mm.Event_id
        LEFT JOIN Market m
            ON m.Mapping_id = mm.Mapping_id
            OR (m.Mapping_id IS NULL AND m.Event_id = mm.Event_id)
        LEFT JOIN Exchange ex ON ex.Exchange_id = m.Exchange_id
        WHERE (%s IS NULL OR aa.Status = %s)
        GROUP BY
            aa.Alert_id,
            e.Event_id,
            e.Title,
            aa.Profit_margin,
            aa.Status,
            aa.Detected_at
        ORDER BY aa.Detected_at DESC, aa.Profit_margin DESC
    """

    def list_active_alerts(self, connection: Any) -> list[AlertRow]:
        return self.list_alerts(connection, status="Active")

    def list_alerts(self, connection: Any, status: str | None = None) -> list[AlertRow]:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(self.LIST_ALERTS_QUERY, (status, status))
            rows = cursor.fetchall()
            return [AlertRow.from_row(row) for row in rows]
        finally:
            cursor.close()

    def get_alert_detail(self, connection: Any, alert_id: int) -> AlertDetail | None:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(self.ALERT_DETAIL_SUMMARY_QUERY, (alert_id,))
            summary = cursor.fetchone()
            if summary is None:
                return None

            cursor.execute(self.ALERT_DETAIL_MARKETS_QUERY, (alert_id,))
            market_rows = cursor.fetchall()
            markets = [AlertMarketDetail.from_row(row) for row in market_rows]
            return AlertDetail.from_row(summary, markets=markets)
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
