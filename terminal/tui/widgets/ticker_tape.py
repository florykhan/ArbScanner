"""
Scrolling ticker tape — CNBC-style live spreads strip.

Docks above the footer. Holds a rolling rich.Text "feed" and shifts a
sliding window across it on a short interval to produce smooth motion.
"""
from __future__ import annotations

from dataclasses import dataclass

from rich.text import Text
from textual.widgets import Static


@dataclass(frozen=True)
class TickerItem:
    label: str
    color: str
    bold: bool = False


class TickerTape(Static):
    """A single-line scrolling marquee of styled ticker items."""

    DEFAULT_CSS = """
    TickerTape {
        dock: bottom;
        height: 1;
        background: #0d1117;
        background-tint: #00d4aa 6%;
        color: #c9d1d9;
        padding: 0 1;
    }
    """

    SCROLL_INTERVAL = 0.08  # ~12fps — smooth without thrashing the UI
    STEP = 1                # characters shifted per tick
    GAP = "          "      # blank tail so the loop is visible, not jarring

    def __init__(self, **kwargs) -> None:
        super().__init__("", **kwargs)
        self._feed: Text = Text("")
        self._offset: int = 0

    # ── Lifecycle ───────────────────────────────────────────────

    def on_mount(self) -> None:
        self.set_interval(self.SCROLL_INTERVAL, self._tick)

    # ── Public API ──────────────────────────────────────────────

    def set_items(self, items: list[TickerItem]) -> None:
        """Replace the feed with a new set of items."""
        feed = Text()
        sep = Text("  ●  ", style="#1c2a3a")
        for i, item in enumerate(items):
            if i > 0:
                feed.append(sep)
            style = f"bold {item.color}" if item.bold else item.color
            feed.append(item.label, style=style)
        feed.append(self.GAP)

        # Guarantee the feed is always longer than the viewport so the
        # wrap-around math stays sane.
        min_len = max(self.size.width * 2, 80)
        if len(feed) < min_len:
            pad = Text()
            sep_long = Text("  ●  ", style="#1c2a3a")
            while len(pad) + len(feed) < min_len:
                pad.append(sep)
                for item in items:
                    style = f"bold {item.color}" if item.bold else item.color
                    pad.append(item.label, style=style)
                    pad.append(sep_long)
            feed.append(pad)

        self._feed = feed
        if len(self._feed) > 0:
            self._offset = self._offset % len(self._feed)

    # ── Scroll loop ─────────────────────────────────────────────

    def _tick(self) -> None:
        if len(self._feed) == 0:
            return
        width = max(1, self.size.width)
        self._offset = (self._offset + self.STEP) % len(self._feed)
        window = self._slice(self._offset, width)
        self.update(window)

    def _slice(self, start: int, length: int) -> Text:
        n = len(self._feed)
        if length <= n - start:
            return self._feed[start : start + length]
        # Wrap around the end seamlessly.
        head = self._feed[start:]
        tail = self._feed[: length - (n - start)]
        out = Text()
        out.append(head)
        out.append(tail)
        return out
