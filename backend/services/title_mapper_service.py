from __future__ import annotations

import json
import re
from dataclasses import dataclass, replace
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable

from backend.models.market_payload import NormalizedQuote


STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "before",
    "by",
    "for",
    "from",
    "how",
    "if",
    "in",
    "is",
    "of",
    "on",
    "or",
    "the",
    "to",
    "what",
    "when",
    "which",
    "who",
    "will",
    "would",
}

TOKEN_PATTERN = re.compile(r"[a-z0-9]+")
ALIAS_RULES_PATH = Path(__file__).resolve().parents[1] / "config" / "title_alias_rules.json"


@dataclass(frozen=True)
class MappedMarketGroup:
    canonical_title: str
    exchanges: tuple[str, ...]
    titles: tuple[str, ...]
    market_count: int


@dataclass(frozen=True)
class RegexAliasRule:
    canonical_title: str
    patterns: dict[str, str]


def _title_tokens(title: str) -> list[str]:
    return [
        token
        for token in TOKEN_PATTERN.findall(title.lower())
        if token not in STOP_WORDS and len(token) > 1
    ]


def _normalized_title(title: str) -> str:
    return " ".join(_title_tokens(title))


def _jaccard_similarity(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    return len(left & right) / len(left | right)


def _titles_match(left: str, right: str) -> bool:
    left_norm = _normalized_title(left)
    right_norm = _normalized_title(right)

    if not left_norm or not right_norm:
        return False

    if left_norm == right_norm:
        return True

    left_tokens = set(left_norm.split())
    right_tokens = set(right_norm.split())
    overlap = len(left_tokens & right_tokens)
    jaccard = _jaccard_similarity(left_tokens, right_tokens)
    ratio = SequenceMatcher(None, left_norm, right_norm).ratio()

    if jaccard < 0.55:
        return False

    if overlap >= 4 and ratio >= 0.78:
        return True
    if overlap >= 3 and ratio >= 0.86:
        return True
    return False


class TitleMapperService:
    """Temporary title-based mapper for cross-exchange MVP scans."""

    def __init__(self) -> None:
        self.alias_rules = self._load_alias_rules()

    def remap_quotes(self, quotes: Iterable[NormalizedQuote]) -> tuple[list[NormalizedQuote], list[MappedMarketGroup]]:
        market_quotes: dict[tuple[str, str], list[NormalizedQuote]] = {}
        for quote in quotes:
            market_quotes.setdefault((quote.exchange_name, quote.exchange_market_code), []).append(quote)

        market_entries = [
            {
                "key": key,
                "exchange_name": grouped_quotes[0].exchange_name,
                "event_title": grouped_quotes[0].event_title,
                "effective_title": self._apply_alias_rule(
                    grouped_quotes[0].exchange_name,
                    grouped_quotes[0].event_title,
                ),
            }
            for key, grouped_quotes in market_quotes.items()
        ]

        groups: list[dict[str, object]] = []

        for entry in market_entries:
            placed = False
            for group in groups:
                if _titles_match(str(entry["effective_title"]), str(group["canonical_title"])):
                    group["entries"].append(entry)
                    placed = True
                    break

            if not placed:
                groups.append(
                    {
                        "canonical_title": entry["effective_title"],
                        "entries": [entry],
                    }
                )

        market_to_canonical: dict[tuple[str, str], str] = {}
        mapped_groups: list[MappedMarketGroup] = []

        for group in groups:
            entries = list(group["entries"])
            canonical_title = min(
                (str(item["effective_title"]) for item in entries),
                key=lambda title: (len(title), title.lower()),
            )
            exchanges = tuple(sorted({str(item["exchange_name"]) for item in entries}))
            titles = tuple(sorted({str(item["event_title"]) for item in entries}))

            for item in entries:
                market_to_canonical[item["key"]] = canonical_title

            if len(exchanges) > 1:
                mapped_groups.append(
                    MappedMarketGroup(
                        canonical_title=canonical_title,
                        exchanges=exchanges,
                        titles=titles,
                        market_count=len(entries),
                    )
                )

        remapped_quotes = [
            replace(
                quote,
                event_title=market_to_canonical.get(
                    (quote.exchange_name, quote.exchange_market_code),
                    quote.event_title,
                ),
            )
            for quote in quotes
        ]

        return remapped_quotes, mapped_groups

    def _load_alias_rules(self) -> list[RegexAliasRule]:
        if not ALIAS_RULES_PATH.exists():
            return []

        data = json.loads(ALIAS_RULES_PATH.read_text())
        rules: list[RegexAliasRule] = []

        for item in data:
            canonical_title = str(item.get("canonical_title", "")).strip()
            patterns = item.get("patterns", {})
            if not canonical_title or not isinstance(patterns, dict):
                continue
            rules.append(
                RegexAliasRule(
                    canonical_title=canonical_title,
                    patterns={str(key): str(value) for key, value in patterns.items()},
                )
            )

        return rules

    def _apply_alias_rule(self, exchange_name: str, event_title: str) -> str:
        for rule in self.alias_rules:
            exchange_pattern = rule.patterns.get(exchange_name) or rule.patterns.get("*")
            if exchange_pattern and re.search(exchange_pattern, event_title, flags=re.IGNORECASE):
                return rule.canonical_title
        return event_title
