from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable

from backend.models.market_payload import NormalizedQuote


class MarketRegistryService:
    """Create or reuse DB rows for exchange markets before snapshot ingestion."""

    FIND_EXCHANGE_QUERY = """
        SELECT Exchange_id
        FROM Exchange
        WHERE Name = %s
        LIMIT 1
    """

    INSERT_EXCHANGE_QUERY = """
        INSERT INTO Exchange (Exchange_id, Name, API_base_url)
        VALUES (%s, %s, %s)
    """

    FIND_EVENT_QUERY = """
        SELECT Event_id
        FROM Event
        WHERE Title = %s
        LIMIT 1
    """

    INSERT_EVENT_QUERY = """
        INSERT INTO Event (Event_id, Title, Category, Close_time)
        VALUES (%s, %s, %s, %s)
    """

    FIND_MAPPING_QUERY = """
        SELECT Mapping_id
        FROM MarketMapping
        WHERE Event_id = %s
        LIMIT 1
    """

    INSERT_MAPPING_QUERY = """
        INSERT INTO MarketMapping (Mapping_id, Event_id, Notes, Created_at)
        VALUES (%s, %s, %s, %s)
    """

    FIND_MARKET_QUERY = """
        SELECT Market_id
        FROM Market
        WHERE Exchange_id = %s AND Exchange_market_code = %s
        LIMIT 1
    """

    INSERT_MARKET_QUERY = """
        INSERT INTO Market (Market_id, Exchange_id, Event_id, Mapping_id, Exchange_market_code)
        VALUES (%s, %s, %s, %s, %s)
    """

    UPDATE_MARKET_MAPPING_QUERY = """
        UPDATE Market
        SET Event_id = %s,
            Mapping_id = %s
        WHERE Market_id = %s
    """

    FIND_BINARY_MARKET_QUERY = """
        SELECT Market_id
        FROM BinaryMarket
        WHERE Market_id = %s
        LIMIT 1
    """

    INSERT_BINARY_MARKET_QUERY = """
        INSERT INTO BinaryMarket (Market_id, Yes_label, No_label)
        VALUES (%s, %s, %s)
    """

    FIND_CONTRACT_QUERY = """
        SELECT Contract_id
        FROM Contract
        WHERE Market_id = %s AND Outcome_label = %s
        LIMIT 1
    """

    INSERT_CONTRACT_QUERY = """
        INSERT INTO Contract (Contract_id, Market_id, Outcome_label)
        VALUES (%s, %s, %s)
    """

    NEXT_ID_QUERIES = {
        "exchange": "SELECT COALESCE(MAX(Exchange_id), 0) + 1 FROM Exchange",
        "event": "SELECT COALESCE(MAX(Event_id), 0) + 1 FROM Event",
        "mapping": "SELECT COALESCE(MAX(Mapping_id), 0) + 1 FROM MarketMapping",
        "market": "SELECT COALESCE(MAX(Market_id), 0) + 1 FROM Market",
        "contract": "SELECT COALESCE(MAX(Contract_id), 0) + 1 FROM Contract",
    }

    def ensure_quotes_registered(
        self,
        connection: Any,
        quotes: Iterable[NormalizedQuote],
        *,
        exchange_api_base_url: str,
        category: str = "Prediction",
    ) -> None:
        quotes = list(quotes)
        if not quotes:
            return

        exchange_name = quotes[0].exchange_name
        exchange_id = self._ensure_exchange(connection, exchange_name, exchange_api_base_url)

        grouped_quotes: dict[str, list[NormalizedQuote]] = {}
        for quote in quotes:
            grouped_quotes.setdefault(quote.exchange_market_code, []).append(quote)

        for exchange_market_code, market_quotes in grouped_quotes.items():
            event_title = market_quotes[0].event_title
            event_id = self._ensure_event(connection, event_title, category, None)
            mapping_id = self._ensure_mapping(connection, event_id, exchange_name)
            market_id = self._ensure_market(
                connection,
                exchange_id=exchange_id,
                event_id=event_id,
                mapping_id=mapping_id,
                exchange_market_code=exchange_market_code,
            )
            self._ensure_binary_market(connection, market_id)
            for quote in market_quotes:
                self._ensure_contract(connection, market_id, quote.outcome_label)

        connection.commit()

    def _next_id(self, connection: Any, key: str) -> int:
        cursor = connection.cursor()
        try:
            cursor.execute(self.NEXT_ID_QUERIES[key])
            row = cursor.fetchone()
            return int(row[0])
        finally:
            cursor.close()

    def _ensure_exchange(self, connection: Any, name: str, api_base_url: str) -> int:
        cursor = connection.cursor()
        try:
            cursor.execute(self.FIND_EXCHANGE_QUERY, (name,))
            row = cursor.fetchone()
            if row:
                return int(row[0])

            next_id = self._next_id(connection, "exchange")
            cursor.execute(self.INSERT_EXCHANGE_QUERY, (next_id, name, api_base_url))
            return next_id
        finally:
            cursor.close()

    def _ensure_event(
        self,
        connection: Any,
        title: str,
        category: str,
        close_time: datetime | None,
    ) -> int:
        cursor = connection.cursor()
        try:
            cursor.execute(self.FIND_EVENT_QUERY, (title,))
            row = cursor.fetchone()
            if row:
                return int(row[0])

            next_id = self._next_id(connection, "event")
            cursor.execute(self.INSERT_EVENT_QUERY, (next_id, title, category, close_time))
            return next_id
        finally:
            cursor.close()

    def _ensure_mapping(self, connection: Any, event_id: int, exchange_name: str) -> int:
        cursor = connection.cursor()
        try:
            cursor.execute(self.FIND_MAPPING_QUERY, (event_id,))
            row = cursor.fetchone()
            if row:
                return int(row[0])

            next_id = self._next_id(connection, "mapping")
            note = f"Auto-created from {exchange_name} sync"
            cursor.execute(
                self.INSERT_MAPPING_QUERY,
                (next_id, event_id, note, datetime.now().replace(microsecond=0)),
            )
            return next_id
        finally:
            cursor.close()

    def _ensure_market(
        self,
        connection: Any,
        *,
        exchange_id: int,
        event_id: int,
        mapping_id: int,
        exchange_market_code: str,
    ) -> int:
        cursor = connection.cursor()
        try:
            cursor.execute(self.FIND_MARKET_QUERY, (exchange_id, exchange_market_code))
            row = cursor.fetchone()
            if row:
                market_id = int(row[0])
                cursor.execute(
                    self.UPDATE_MARKET_MAPPING_QUERY,
                    (event_id, mapping_id, market_id),
                )
                return market_id

            next_id = self._next_id(connection, "market")
            cursor.execute(
                self.INSERT_MARKET_QUERY,
                (next_id, exchange_id, event_id, mapping_id, exchange_market_code),
            )
            return next_id
        finally:
            cursor.close()

    def _ensure_binary_market(self, connection: Any, market_id: int) -> None:
        cursor = connection.cursor()
        try:
            cursor.execute(self.FIND_BINARY_MARKET_QUERY, (market_id,))
            if cursor.fetchone():
                return
            cursor.execute(self.INSERT_BINARY_MARKET_QUERY, (market_id, "Yes", "No"))
        finally:
            cursor.close()

    def _ensure_contract(self, connection: Any, market_id: int, outcome_label: str) -> int:
        cursor = connection.cursor()
        try:
            cursor.execute(self.FIND_CONTRACT_QUERY, (market_id, outcome_label))
            row = cursor.fetchone()
            if row:
                return int(row[0])

            next_id = self._next_id(connection, "contract")
            cursor.execute(self.INSERT_CONTRACT_QUERY, (next_id, market_id, outcome_label))
            return next_id
        finally:
            cursor.close()
