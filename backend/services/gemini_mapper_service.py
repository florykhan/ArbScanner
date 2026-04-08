from __future__ import annotations

import hashlib
import json
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Iterable

from backend.models.market_payload import NormalizedQuote
from backend.services.title_mapper_service import MappedMarketGroup
from backend.utils.config import GeminiConfig


CACHE_PATH = Path(__file__).resolve().parents[1] / "config" / "gemini_match_cache.json"


@dataclass(frozen=True)
class MarketEntry:
    key: tuple[str, str]
    exchange_name: str
    event_title: str


@dataclass(frozen=True)
class GeminiMatchDecision:
    match: bool
    canonical_title: str | None
    reason: str


class _DisjointSet:
    def __init__(self, items: list[int]) -> None:
        self.parent = {item: item for item in items}

    def find(self, item: int) -> int:
        root = item
        while self.parent[root] != root:
            root = self.parent[root]
        while self.parent[item] != item:
            next_item = self.parent[item]
            self.parent[item] = root
            item = next_item
        return root

    def union(self, left: int, right: int) -> None:
        left_root = self.find(left)
        right_root = self.find(right)
        if left_root != right_root:
            self.parent[right_root] = left_root


class GeminiMapperService:
    """AI-assisted cross-exchange title matcher with local caching."""

    def __init__(self, config: GeminiConfig | None = None) -> None:
        self.config = config or GeminiConfig.from_env()
        self._cache = self._load_cache()

    @property
    def is_enabled(self) -> bool:
        return self.config.enabled and bool(self.config.api_key)

    def remap_quotes(
        self,
        quotes: Iterable[NormalizedQuote],
    ) -> tuple[list[NormalizedQuote], list[MappedMarketGroup]]:
        if not self.is_enabled:
            return list(quotes), []

        market_quotes: dict[tuple[str, str], list[NormalizedQuote]] = {}
        for quote in quotes:
            market_quotes.setdefault((quote.exchange_name, quote.exchange_market_code), []).append(quote)

        entries = [
            MarketEntry(
                key=key,
                exchange_name=grouped_quotes[0].exchange_name,
                event_title=grouped_quotes[0].event_title,
            )
            for key, grouped_quotes in market_quotes.items()
        ]

        decisions = self._resolve_candidate_pairs(entries)
        groups = self._build_groups(entries, decisions)

        if not groups:
            return list(quotes), []

        canonical_by_market: dict[tuple[str, str], str] = {}
        mapped_groups: list[MappedMarketGroup] = []

        for indices in groups:
            grouped_entries = [entries[index] for index in indices]
            exchanges = tuple(sorted({entry.exchange_name for entry in grouped_entries}))
            if len(exchanges) <= 1:
                continue

            titles = tuple(sorted({entry.event_title for entry in grouped_entries}))
            canonical_title = min(titles, key=lambda title: (len(title), title.lower()))

            for entry in grouped_entries:
                canonical_by_market[entry.key] = canonical_title

            mapped_groups.append(
                MappedMarketGroup(
                    canonical_title=canonical_title,
                    exchanges=exchanges,
                    titles=titles,
                    market_count=len(grouped_entries),
                )
            )

        remapped_quotes = [
            replace(
                quote,
                event_title=canonical_by_market.get(
                    (quote.exchange_name, quote.exchange_market_code),
                    quote.event_title,
                ),
            )
            for quote in quotes
        ]

        return remapped_quotes, mapped_groups

    def _resolve_candidate_pairs(
        self,
        entries: list[MarketEntry],
    ) -> dict[tuple[int, int], GeminiMatchDecision]:
        scored_candidates: list[tuple[float, tuple[int, int]]] = []
        decisions: dict[tuple[int, int], GeminiMatchDecision] = {}

        for left_index, left_entry in enumerate(entries):
            for right_index in range(left_index + 1, len(entries)):
                right_entry = entries[right_index]
                if left_entry.exchange_name == right_entry.exchange_name:
                    continue
                score = self._candidate_score(left_entry.event_title, right_entry.event_title)
                if score <= 0:
                    continue
                scored_candidates.append((score, (left_index, right_index)))

        scored_candidates.sort(key=lambda item: item[0], reverse=True)
        candidates = [pair for _, pair in scored_candidates[: self.config.max_candidate_pairs]]

        uncached_pairs: list[tuple[int, int]] = []
        for pair in candidates:
            left_index, right_index = pair
            left_entry = entries[left_index]
            right_entry = entries[right_index]
            cached_decision = self._get_cached_decision(left_entry, right_entry)
            if cached_decision is not None:
                decisions[pair] = cached_decision
            else:
                uncached_pairs.append(pair)

        batches = [
            uncached_pairs[index : index + self.config.batch_size]
            for index in range(0, len(uncached_pairs), self.config.batch_size)
        ]

        def evaluate_batch(batch: list[tuple[int, int]]) -> dict[tuple[int, int], GeminiMatchDecision]:
            return self._match_batch(entries, batch)

        with ThreadPoolExecutor(max_workers=self.config.max_workers) as executor:
            for batch_result in executor.map(evaluate_batch, batches):
                decisions.update(batch_result)

        self._save_cache()
        return decisions

    def _build_groups(
        self,
        entries: list[MarketEntry],
        decisions: dict[tuple[int, int], GeminiMatchDecision],
    ) -> list[list[int]]:
        disjoint_set = _DisjointSet(list(range(len(entries))))

        for (left_index, right_index), decision in decisions.items():
            if decision.match:
                disjoint_set.union(left_index, right_index)

        grouped_indices: dict[int, list[int]] = {}
        for index in range(len(entries)):
            grouped_indices.setdefault(disjoint_set.find(index), []).append(index)

        return list(grouped_indices.values())

    def _candidate_score(self, left_title: str, right_title: str) -> float:
        left_tokens = self._tokens(left_title)
        right_tokens = self._tokens(right_title)
        if not left_tokens or not right_tokens:
            return 0.0

        shared = left_tokens & right_tokens
        year_bonus = 0.4 if self._years(left_tokens) & self._years(right_tokens) else 0.0
        overlap_score = min(len(shared) / 4, 1.0)
        ratio_score = len("".join(shared)) / max(
            len("".join(left_tokens | right_tokens)),
            1,
        )

        score = overlap_score + ratio_score + year_bonus
        return score if shared or year_bonus else 0.0

    def _match_batch(
        self,
        entries: list[MarketEntry],
        batch: list[tuple[int, int]],
    ) -> dict[tuple[int, int], GeminiMatchDecision]:
        if not batch:
            return {}

        prompt_lines = [
            "You are matching prediction market titles across exchanges.",
            "For each pair, decide if both titles refer to the same exact binary question.",
            "Be conservative.",
            "A match requires the same underlying real-world proposition or event and the same settlement meaning.",
            "Do not match markets that merely share a topic, person, country, sport, or year.",
            "Return only JSON as an array of objects with keys: id, match, canonical_title, reason.",
            "If match is false, canonical_title must be null.",
            "",
            "Pairs:",
        ]

        for batch_index, (left_index, right_index) in enumerate(batch):
            left_entry = entries[left_index]
            right_entry = entries[right_index]
            prompt_lines.extend(
                [
                    f"- id: {batch_index}",
                    f"  market_a_exchange: {left_entry.exchange_name}",
                    f"  market_a_title: {left_entry.event_title}",
                    f"  market_b_exchange: {right_entry.exchange_name}",
                    f"  market_b_title: {right_entry.event_title}",
                ]
            )

        prompt = "\n".join(prompt_lines)

        url = (
            f"{self.config.api_base_url}/models/{self.config.model}:generateContent?"
            f"{urllib.parse.urlencode({'key': self.config.api_key or ''})}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0,
                "responseMimeType": "application/json",
            },
        }
        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode(),
            headers={
                "Content-Type": "application/json",
                "User-Agent": self.config.user_agent,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=self.config.request_timeout_seconds) as response:
                body = json.load(response)

            text = (
                body.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "[]")
            )
            parsed_items = self._parse_json_array_response(text)
        except Exception as exc:
            parsed_items = []
            failure_reason = f"Gemini request failed: {exc}"
        else:
            failure_reason = "Gemini did not return a decision for this pair"

        decisions: dict[tuple[int, int], GeminiMatchDecision] = {}
        decisions_by_id = {
            int(item["id"]): item
            for item in parsed_items
            if isinstance(item, dict) and str(item.get("id", "")).isdigit()
        }

        for batch_index, pair in enumerate(batch):
            left_index, right_index = pair
            left_entry = entries[left_index]
            right_entry = entries[right_index]
            parsed = decisions_by_id.get(batch_index)

            if parsed is None:
                decision = GeminiMatchDecision(
                    match=False,
                    canonical_title=None,
                    reason=failure_reason,
                )
            else:
                decision = GeminiMatchDecision(
                    match=bool(parsed.get("match")),
                    canonical_title=parsed.get("canonical_title"),
                    reason=str(parsed.get("reason", "")),
                )

            self._cache[self._cache_key(left_entry, right_entry)] = {
                "match": decision.match,
                "canonical_title": decision.canonical_title,
                "reason": decision.reason,
            }
            decisions[pair] = decision

        return decisions

    def _parse_json_array_response(self, text: str) -> list[dict[str, object]]:
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"\[.*\]", text, flags=re.DOTALL)
            if not match:
                raise
            parsed = json.loads(match.group(0))

        if isinstance(parsed, dict):
            parsed = [parsed]
        if not isinstance(parsed, list):
            return []
        return [item for item in parsed if isinstance(item, dict)]

    def _cache_key(self, left_entry: MarketEntry, right_entry: MarketEntry) -> str:
        left = f"{left_entry.exchange_name}|{left_entry.event_title}"
        right = f"{right_entry.exchange_name}|{right_entry.event_title}"
        pair = "||".join(sorted([left, right]))
        return hashlib.sha256(pair.encode()).hexdigest()

    def _get_cached_decision(
        self,
        left_entry: MarketEntry,
        right_entry: MarketEntry,
    ) -> GeminiMatchDecision | None:
        cached = self._cache.get(self._cache_key(left_entry, right_entry))
        if not cached:
            return None
        return GeminiMatchDecision(
            match=bool(cached.get("match")),
            canonical_title=cached.get("canonical_title"),
            reason=str(cached.get("reason", "")),
        )

    def _load_cache(self) -> dict[str, dict[str, object]]:
        if not CACHE_PATH.exists():
            return {}
        return json.loads(CACHE_PATH.read_text())

    def _save_cache(self) -> None:
        CACHE_PATH.write_text(json.dumps(self._cache, indent=2, sort_keys=True))

    def _tokens(self, title: str) -> set[str]:
        return {
            token
            for token in re.findall(r"[a-z0-9]+", title.lower())
            if len(token) > 2
        }

    def _years(self, tokens: set[str]) -> set[str]:
        return {token for token in tokens if len(token) == 4 and token.isdigit()}
