from __future__ import annotations

import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Iterable

from backend.models.market_payload import NormalizedQuote
from backend.utils.config import PolymarketConfig


def _parse_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc).replace(
        tzinfo=None
    )


def _parse_decimal(value: Any) -> Decimal:
    return Decimal(str(value))


class PolymarketService:
    """Public market-data adapter for Polymarket."""

    def __init__(self, config: PolymarketConfig | None = None) -> None:
        self.config = config or PolymarketConfig.from_env()

    def fetch_active_binary_quotes(self, limit: int = 10) -> list[NormalizedQuote]:
        markets = self._fetch_markets(limit=limit)
        binary_markets = [market for market in markets if self._is_supported_binary_market(market)]
        if not binary_markets:
            return []

        token_ids = [
            token_id
            for market in binary_markets
            for token_id in json.loads(market["clobTokenIds"])
        ]
        books = self._fetch_books(token_ids)
        quotes: list[NormalizedQuote] = []

        for market in binary_markets:
            quotes.extend(self._normalize_market(market, books))

        return quotes

    def _fetch_markets(self, *, limit: int) -> list[dict[str, Any]]:
        params = urllib.parse.urlencode(
            {
                "active": "true",
                "closed": "false",
                "limit": str(limit),
            }
        )
        url = f"{self.config.gamma_base_url}/markets?{params}"
        return self._request_json(url)

    def _fetch_books(self, token_ids: Iterable[str]) -> dict[str, dict[str, Any]]:
        payload = json.dumps([{"token_id": token_id} for token_id in token_ids]).encode()
        books = self._request_json(
            f"{self.config.clob_base_url}/books",
            method="POST",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        return {str(book["asset_id"]): book for book in books}

    def _normalize_market(
        self,
        market: dict[str, Any],
        books_by_token_id: dict[str, dict[str, Any]],
    ) -> list[NormalizedQuote]:
        outcomes = json.loads(market["outcomes"])
        token_ids = json.loads(market["clobTokenIds"])
        outcome_prices = json.loads(market["outcomePrices"])
        snapshot_time = _parse_datetime(market["updatedAt"])
        exchange_market_code = str(market["conditionId"])
        event_title = str(market["question"])
        source_url = f"https://polymarket.com/event/{market['slug']}"

        normalized_quotes: list[NormalizedQuote] = []

        for outcome_label, token_id, fallback_price in zip(outcomes, token_ids, outcome_prices):
            book = books_by_token_id.get(str(token_id), {})
            best_bid = self._best_price(book.get("bids"), fallback_price)
            best_ask = self._best_price(book.get("asks"), fallback_price)
            last_trade_price = book.get("last_trade_price", fallback_price)

            normalized_quotes.append(
                NormalizedQuote(
                    exchange_name="Polymarket",
                    exchange_market_code=exchange_market_code,
                    event_title=event_title,
                    outcome_label=str(outcome_label),
                    bid=_parse_decimal(best_bid),
                    ask=_parse_decimal(best_ask),
                    last=_parse_decimal(last_trade_price),
                    snapshot_time=snapshot_time,
                    source_url=source_url,
                )
            )

        return normalized_quotes

    def _best_price(self, levels: Any, fallback_price: Any) -> Decimal:
        if not levels:
            return _parse_decimal(fallback_price)

        first_level = levels[0]
        if isinstance(first_level, dict):
            price = first_level.get("price", fallback_price)
        else:
            price = fallback_price
        return _parse_decimal(price)

    def _is_supported_binary_market(self, market: dict[str, Any]) -> bool:
        if not market.get("active") or market.get("closed") or not market.get("acceptingOrders"):
            return False
        if not market.get("enableOrderBook"):
            return False

        try:
            outcomes = json.loads(market["outcomes"])
            token_ids = json.loads(market["clobTokenIds"])
        except (KeyError, json.JSONDecodeError, TypeError):
            return False

        normalized_outcomes = {str(outcome).strip().lower() for outcome in outcomes}
        return normalized_outcomes == {"yes", "no"} and len(token_ids) == 2

    def _request_json(
        self,
        url: str,
        *,
        method: str = "GET",
        data: bytes | None = None,
        headers: dict[str, str] | None = None,
    ) -> Any:
        request_headers = {"User-Agent": self.config.user_agent}
        if headers:
            request_headers.update(headers)

        request = urllib.request.Request(
            url,
            data=data,
            headers=request_headers,
            method=method,
        )

        with urllib.request.urlopen(request) as response:
            return json.load(response)
