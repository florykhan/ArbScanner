from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Iterable

from backend.models.market_payload import NormalizedQuote

SETTLEMENT_FLOOR = Decimal("1.00")


@dataclass(frozen=True)
class DetectedOpportunity:
    """Deterministic negative-risk result for one mapped event."""

    event_title: str
    mapping_id: int | None
    yes_exchange: str
    yes_ask: Decimal
    no_exchange: str
    no_ask: Decimal
    total_cost: Decimal
    profit_margin: Decimal
    detected_at: datetime


def _group_key(quote: NormalizedQuote) -> tuple[int | None, str]:
    return quote.mapping_id, quote.event_title


def find_binary_negative_risk_opportunities(
    quotes: Iterable[NormalizedQuote],
    settlement_floor: Decimal = SETTLEMENT_FLOOR,
) -> list[DetectedOpportunity]:
    """Return negative-risk opportunities for trusted yes/no quote groups."""

    grouped_quotes: dict[tuple[int | None, str], list[NormalizedQuote]] = defaultdict(list)

    for quote in quotes:
        quote.validate()
        grouped_quotes[_group_key(quote)].append(quote)

    opportunities: list[DetectedOpportunity] = []

    for (_, event_title), event_quotes in grouped_quotes.items():
        yes_quotes = [
            quote for quote in event_quotes if quote.normalized_outcome in {"yes", "true"}
        ]
        no_quotes = [
            quote for quote in event_quotes if quote.normalized_outcome in {"no", "false"}
        ]

        if not yes_quotes or not no_quotes:
            continue

        best_yes = min(yes_quotes, key=lambda quote: quote.ask)
        best_no = min(no_quotes, key=lambda quote: quote.ask)
        total_cost = best_yes.ask + best_no.ask

        if total_cost >= settlement_floor:
            continue

        opportunities.append(
            DetectedOpportunity(
                event_title=event_title,
                mapping_id=best_yes.mapping_id or best_no.mapping_id,
                yes_exchange=best_yes.exchange_name,
                yes_ask=best_yes.ask,
                no_exchange=best_no.exchange_name,
                no_ask=best_no.ask,
                total_cost=total_cost,
                profit_margin=settlement_floor - total_cost,
                detected_at=max(best_yes.snapshot_time, best_no.snapshot_time),
            )
        )

    opportunities.sort(key=lambda opportunity: opportunity.profit_margin, reverse=True)
    return opportunities
