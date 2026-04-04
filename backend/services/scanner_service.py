from __future__ import annotations

from typing import Any, Iterable

from backend.models.market_payload import NormalizedQuote
from backend.services.alert_service import AlertService
from backend.services.arbitrage_service import find_binary_negative_risk_opportunities


class ScannerService:
    """Thin orchestration layer for one scan cycle."""

    def __init__(self, alert_service: AlertService | None = None) -> None:
        self.alert_service = alert_service or AlertService()

    def run_scan_cycle(
        self,
        connection: Any,
        quotes: Iterable[NormalizedQuote],
    ) -> list[int]:
        alert_ids: list[int] = []
        opportunities = find_binary_negative_risk_opportunities(quotes)

        for opportunity in opportunities:
            if opportunity.mapping_id is None:
                continue

            alert_id = self.alert_service.upsert_active_alert(
                connection=connection,
                mapping_id=opportunity.mapping_id,
                profit_margin=opportunity.profit_margin,
                detected_at=opportunity.detected_at,
            )
            alert_ids.append(alert_id)

        return alert_ids
