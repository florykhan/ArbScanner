"""
Event × Exchange arbitrage heatmap.

A compact grid that lists active-alert events on the Y axis and the
exchanges they span on the X axis. Cells are colour-coded by margin,
giving an instant "hot spot" read of where the best opportunities live.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Sequence

from rich.console import RenderableType
from rich.text import Text
from textual.widget import Widget


@dataclass(frozen=True)
class HeatmapEventRow:
    event_title: str
    exchange_margins: dict[str, float]  # exchange name → margin percent

    @property
    def max_margin(self) -> float:
        if not self.exchange_margins:
            return 0.0
        return max(self.exchange_margins.values())


@dataclass(frozen=True)
class HeatmapData:
    exchanges: list[str] = field(default_factory=list)
    rows: list[HeatmapEventRow] = field(default_factory=list)


# ── Colour / glyph ramp ──────────────────────────────────────────


def _cell_style(pct: float, active: bool) -> tuple[str, str]:
    """Return (rich style, 4-char glyph) for a single event × exchange cell."""
    if not active:
        return ("#1c2a3a", " ·· ")
    if pct >= 6:
        return ("bold #3fb950", "████")
    if pct >= 4:
        return ("bold #2ea043", "████")
    if pct >= 2.5:
        return ("bold #00d4aa", "▓▓▓▓")
    if pct >= 1:
        return ("bold #d29922", "▒▒▒▒")
    if pct > 0:
        return ("#8b5a00", "░░░░")
    return ("#1c2a3a", "    ")


def _exchange_code(name: str) -> str:
    cleaned = "".join(ch for ch in name.upper() if ch.isalnum())
    return cleaned[:4].ljust(4)


# ── Widget ───────────────────────────────────────────────────────


class HeatmapGrid(Widget):
    """
    Renders a colour-graded grid of events × exchanges.

    set_data() feeds it new HeatmapData. Layout adapts to the widget's
    current size — exchange columns are clipped to what fits, and event
    titles are truncated with an ellipsis.
    """

    DEFAULT_CSS = """
    HeatmapGrid {
        background: transparent;
        color: #c9d1d9;
        padding: 0 1;
    }
    """

    _COL_W = 5  # 4-char cell + 1-char gap

    def __init__(
        self,
        *,
        id: str | None = None,
        classes: str | None = None,
    ) -> None:
        super().__init__(id=id, classes=classes)
        self._data: HeatmapData | None = None

    def set_data(self, data: HeatmapData) -> None:
        self._data = data
        self.refresh()

    def on_resize(self, _event) -> None:
        self.refresh()

    def render(self) -> RenderableType:
        width = max(self.size.width, 0)
        height = max(self.size.height, 0)

        if width < 20 or height < 3:
            return Text("…", style="#484f58")

        if self._data is None:
            return Text("loading heatmap…", style="#484f58 italic")

        data = self._data
        if not data.rows or not data.exchanges:
            return Text(
                "no active arb spreads to map\n\n"
                "populates as the scanner finds opportunities",
                style="#484f58 italic",
            )

        # Fit as many exchange columns as the widget width allows.
        min_title_w = 14
        max_title_w = 48
        max_ex_cols = max(1, (width - min_title_w - 2) // self._COL_W)
        exchanges = data.exchanges[:max_ex_cols]
        title_w = max(
            min_title_w,
            min(max_title_w, width - 2 - self._COL_W * len(exchanges)),
        )

        result = Text()

        # ── Header ──────────────────────────────────────
        result.append(" " * (title_w + 2), style="#484f58")
        for ex in exchanges:
            code = _exchange_code(ex)
            result.append(f"{code} ", style="#58a6ff bold")
        result.append("\n")

        # ── Divider ─────────────────────────────────────
        result.append(
            "─" * (title_w + 2 + self._COL_W * len(exchanges)),
            style="#1c2a3a",
        )
        result.append("\n")

        # ── Rows ────────────────────────────────────────
        # Reserve 2 lines for header+divider and 1 line for footer hint.
        max_rows = max(1, height - 3)
        visible_rows = data.rows[:max_rows]

        for row in visible_rows:
            title = row.event_title
            if len(title) > title_w:
                title = title[: max(1, title_w - 1)] + "…"
            title_padded = title.ljust(title_w)

            max_pct = row.max_margin
            title_style = (
                "bold #f0f6fc" if max_pct >= 3 else "#c9d1d9"
            )
            result.append(f"{title_padded}  ", style=title_style)

            for ex in exchanges:
                pct = row.exchange_margins.get(ex, 0.0)
                active = ex in row.exchange_margins
                style, glyph = _cell_style(pct, active)
                result.append(glyph, style=style)
                result.append(" ")
            result.append("\n")

        # ── Footer ──────────────────────────────────────
        hidden_rows = len(data.rows) - len(visible_rows)
        hidden_cols = len(data.exchanges) - len(exchanges)
        parts: list[str] = []
        if hidden_rows > 0:
            parts.append(f"+{hidden_rows} event(s)")
        if hidden_cols > 0:
            parts.append(f"+{hidden_cols} exchange(s)")
        if parts:
            result.append("  " + " · ".join(parts), style="#484f58 italic")

        return result
