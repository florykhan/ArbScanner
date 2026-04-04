from __future__ import annotations

import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from backend.models.market_payload import NormalizedQuote
from backend.utils.config import ManifoldConfig


def _timestamp_ms_to_utc_naive(value: int | float | None) -> datetime:
    if value is None:
        return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)

    return datetime.fromtimestamp(float(value) / 1000, tz=timezone.utc).replace(
        tzinfo=None,
        microsecond=0,
    )


def _clamp_probability(value: Any) -> Decimal:
    probability = Decimal(str(value))
    if probability < Decimal("0"):
        return Decimal("0")
    if probability > Decimal("1"):
        return Decimal("1")
    return probability


class ManifoldService:
    """Public market-data adapter for Manifold binary markets."""

    def __init__(self, config: ManifoldConfig | None = None) -> None:
        self.config = config or ManifoldConfig.from_env()

    def fetch_active_binary_quotes(self, limit: int = 10) -> list[NormalizedQuote]:
        markets = self._fetch_markets(limit=max(limit * 10, 50))
        quotes: list[NormalizedQuote] = []
        matched_markets = 0

        for market in markets:
            if not self._is_supported_binary_market(market):
                continue
            quotes.extend(self._normalize_market(market))
            matched_markets += 1
            if matched_markets >= limit:
                break

        return quotes

    def _fetch_markets(self, *, limit: int) -> list[dict[str, Any]]:
        params = urllib.parse.urlencode({"limit": str(limit)})
        url = f"{self.config.api_base_url}/markets?{params}"
        return self._request_json(url)

    def _normalize_market(self, market: dict[str, Any]) -> list[NormalizedQuote]:
        probability = _clamp_probability(
            market.get("probability", market.get("p", Decimal("0.5")))
        )
        inverse_probability = Decimal("1") - probability
        snapshot_time = _timestamp_ms_to_utc_naive(
            market.get("lastUpdatedTime") or market.get("createdTime")
        )
        event_title = str(market["question"])
        exchange_market_code = str(market["id"])
        source_url = str(market.get("url") or f"https://manifold.markets/{market['slug']}")

        return [
            NormalizedQuote(
                exchange_name="Manifold",
                exchange_market_code=exchange_market_code,
                event_title=event_title,
                outcome_label="Yes",
                bid=probability,
                ask=probability,
                last=probability,
                snapshot_time=snapshot_time,
                source_url=source_url,
            ),
            NormalizedQuote(
                exchange_name="Manifold",
                exchange_market_code=exchange_market_code,
                event_title=event_title,
                outcome_label="No",
                bid=inverse_probability,
                ask=inverse_probability,
                last=inverse_probability,
                snapshot_time=snapshot_time,
                source_url=source_url,
            ),
        ]

    def _is_supported_binary_market(self, market: dict[str, Any]) -> bool:
        return (
            market.get("outcomeType") == "BINARY"
            and not market.get("isResolved", False)
            and market.get("question")
            and market.get("id")
        )

    def _request_json(self, url: str) -> Any:
        request = urllib.request.Request(
            url,
            headers={"User-Agent": self.config.user_agent},
            method="GET",
        )

        with urllib.request.urlopen(request) as response:
            return json.load(response)
