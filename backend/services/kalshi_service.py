from __future__ import annotations

import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from backend.models.market_payload import NormalizedQuote
from backend.utils.config import KalshiConfig


def _parse_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)

    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc).replace(
        tzinfo=None,
        microsecond=0,
    )


def _parse_decimal(value: Any, default: str = "0") -> Decimal:
    if value in (None, ""):
        return Decimal(default)
    return Decimal(str(value))


def _compact_title(title: str, ticker: str, limit: int = 255) -> str:
    if len(title) <= limit:
        return title

    suffix = f" [{ticker}]"
    available = max(limit - len(suffix), 0)
    return title[:available].rstrip() + suffix


class KalshiService:
    """Public market-data adapter for Kalshi binary markets."""

    def __init__(self, config: KalshiConfig | None = None) -> None:
        self.config = config or KalshiConfig.from_env()

    def fetch_active_binary_quotes(self, limit: int = 50) -> list[NormalizedQuote]:
        quotes: list[NormalizedQuote] = []
        cursor: str | None = None
        matched_markets = 0

        while matched_markets < limit:
            batch = self._fetch_markets(limit=min(max(limit * 2, 100), 200), cursor=cursor)
            markets = batch.get("markets", [])
            if not markets:
                break

            for market in markets:
                if not self._is_supported_binary_market(market):
                    continue

                quotes.extend(self._normalize_market(market))
                matched_markets += 1
                if matched_markets >= limit:
                    break

            cursor = batch.get("cursor")
            if not cursor:
                break

        return quotes

    def _fetch_markets(self, *, limit: int, cursor: str | None) -> dict[str, Any]:
        params = {"limit": str(limit)}
        if cursor:
            params["cursor"] = cursor
        url = f"{self.config.api_base_url}/markets?{urllib.parse.urlencode(params)}"
        return self._request_json(url)

    def _normalize_market(self, market: dict[str, Any]) -> list[NormalizedQuote]:
        snapshot_time = _parse_datetime(
            market.get("updated_time") or market.get("created_time") or market.get("close_time")
        )
        exchange_market_code = str(market["ticker"])
        event_title = _compact_title(str(market["title"]), exchange_market_code)
        last_yes = _parse_decimal(market.get("last_price_dollars"), default="0")
        yes_bid = _parse_decimal(market.get("yes_bid_dollars"), default=str(last_yes))
        yes_ask = _parse_decimal(market.get("yes_ask_dollars"), default=str(last_yes))
        no_bid = _parse_decimal(
            market.get("no_bid_dollars"),
            default=str(Decimal("1") - last_yes),
        )
        no_ask = _parse_decimal(
            market.get("no_ask_dollars"),
            default=str(Decimal("1") - last_yes),
        )
        no_last = Decimal("1") - last_yes

        return [
            NormalizedQuote(
                exchange_name="Kalshi",
                exchange_market_code=exchange_market_code,
                event_title=event_title,
                outcome_label="Yes",
                bid=yes_bid,
                ask=yes_ask,
                last=last_yes,
                snapshot_time=snapshot_time,
                source_url=None,
            ),
            NormalizedQuote(
                exchange_name="Kalshi",
                exchange_market_code=exchange_market_code,
                event_title=event_title,
                outcome_label="No",
                bid=no_bid,
                ask=no_ask,
                last=no_last,
                snapshot_time=snapshot_time,
                source_url=None,
            ),
        ]

    def _is_supported_binary_market(self, market: dict[str, Any]) -> bool:
        return (
            market.get("market_type") == "binary"
            and market.get("status") == "active"
            and market.get("ticker")
            and market.get("title")
        )

    def _request_json(self, url: str) -> dict[str, Any]:
        request = urllib.request.Request(
            url,
            headers={"User-Agent": self.config.user_agent},
            method="GET",
        )

        with urllib.request.urlopen(request) as response:
            return json.load(response)
