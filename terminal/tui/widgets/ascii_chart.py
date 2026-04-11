"""
Braille-powered margin chart.

A tiny plotter that paints connected-line charts into Unicode braille
cells (each cell is 2 columns × 4 rows of dots → 8× the density of a
standard character grid). Replaces Textual's Sparkline widget with a
proper labelled chart that scales with the container.
"""
from __future__ import annotations

from typing import Iterable

from rich.console import RenderableType
from rich.text import Text
from textual.widget import Widget


# Braille dot indices per sub-cell position.
# col 0 rows 0..3 → bit positions 0, 1, 2, 6
# col 1 rows 0..3 → bit positions 3, 4, 5, 7
_BRAILLE_BITS: tuple[tuple[int, int, int, int], tuple[int, int, int, int]] = (
    (0, 1, 2, 6),
    (3, 4, 5, 7),
)


class BrailleCanvas:
    """Monochrome braille bitmap plotter. Coordinates are in *dots*, not cells."""

    def __init__(self, cells_w: int, cells_h: int) -> None:
        self.cells_w = max(1, cells_w)
        self.cells_h = max(1, cells_h)
        self.width = self.cells_w * 2
        self.height = self.cells_h * 4
        self.cells: list[list[int]] = [
            [0] * self.cells_w for _ in range(self.cells_h)
        ]

    def set(self, x: int, y: int) -> None:
        if not (0 <= x < self.width and 0 <= y < self.height):
            return
        cx = x // 2
        cy = y // 4
        bit = _BRAILLE_BITS[x % 2][y % 4]
        self.cells[cy][cx] |= 1 << bit

    def line(self, x0: int, y0: int, x1: int, y1: int) -> None:
        """Bresenham — dot-resolution line draw."""
        dx = abs(x1 - x0)
        sx = 1 if x0 < x1 else -1
        dy = -abs(y1 - y0)
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        while True:
            self.set(x0, y0)
            if x0 == x1 and y0 == y1:
                return
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy


class MarginChart(Widget):
    """
    A richer, bigger replacement for Textual's Sparkline.

    • Braille line rendering (high-density in pure text).
    • Dynamic y-axis labels (min / mid / max) in percent.
    • Dashed amber threshold line at a caller-supplied value.
    • Repaints on resize so it always fills the parent container.
    """

    DEFAULT_CSS = """
    MarginChart {
        background: transparent;
        color: #00d4aa;
    }
    """

    def __init__(
        self,
        initial: Iterable[float] = (),
        *,
        threshold: float = 3.0,
        id: str | None = None,
        classes: str | None = None,
    ) -> None:
        super().__init__(id=id, classes=classes)
        self._data: list[float] = [float(v) for v in initial]
        self._threshold = float(threshold)

    # ── Public API ──────────────────────────────────────────────

    def set_data(self, data: Iterable[float]) -> None:
        self._data = [float(v) for v in data]
        self.refresh()

    def set_threshold(self, value: float) -> None:
        self._threshold = float(value)
        self.refresh()

    # ── Lifecycle ───────────────────────────────────────────────

    def on_resize(self, _event) -> None:
        self.refresh()

    # ── Rendering ───────────────────────────────────────────────

    def render(self) -> RenderableType:
        width = max(self.size.width, 0)
        height = max(self.size.height, 0)

        if width < 14 or height < 3:
            return Text("…", style="#484f58")

        if not self._data:
            return Text("awaiting margin stream…", style="#484f58 italic")

        label_w = 6  # "99.99%"
        label_gap = 1
        canvas_cells_w = max(6, width - label_w - label_gap)
        canvas_cells_h = max(2, height)

        values = list(self._data)
        threshold = self._threshold

        lo = min(values + [0.0])
        hi = max(values + [threshold * 1.1, 1.0])
        if hi - lo < 0.25:
            hi = lo + 0.25

        data_canvas = BrailleCanvas(canvas_cells_w, canvas_cells_h)
        thr_canvas = BrailleCanvas(canvas_cells_w, canvas_cells_h)

        def to_y(value: float) -> int:
            return round((hi - value) / (hi - lo) * (data_canvas.height - 1))

        def to_x(idx: int) -> int:
            n = len(values)
            if n == 1:
                return data_canvas.width - 1
            return round(idx * (data_canvas.width - 1) / (n - 1))

        # Plot the data line
        prev = (to_x(0), to_y(values[0]))
        for i in range(1, len(values)):
            nxt = (to_x(i), to_y(values[i]))
            data_canvas.line(prev[0], prev[1], nxt[0], nxt[1])
            prev = nxt

        # Plot the threshold line (dashed)
        if lo <= threshold <= hi:
            ty = to_y(threshold)
            for dot_x in range(0, thr_canvas.width, 4):
                thr_canvas.set(dot_x, ty)
                if dot_x + 1 < thr_canvas.width:
                    thr_canvas.set(dot_x + 1, ty)

        label_rows = {0, canvas_cells_h // 2, canvas_cells_h - 1}
        result = Text()
        for row in range(canvas_cells_h):
            if row in label_rows and canvas_cells_h > 1:
                label_value = hi - (hi - lo) * row / max(canvas_cells_h - 1, 1)
                label = f"{label_value:5.2f}%"
            else:
                label = " " * label_w
            result.append(label, style="#2f4056")
            result.append(" " * label_gap)

            data_row = data_canvas.cells[row]
            thr_row = thr_canvas.cells[row]
            for col in range(canvas_cells_w):
                data_cell = data_row[col]
                thr_cell = thr_row[col]
                if data_cell:
                    result.append(chr(0x2800 + data_cell), style="#00d4aa bold")
                elif thr_cell:
                    result.append(chr(0x2800 + thr_cell), style="#d29922")
                else:
                    result.append(" ")
            if row != canvas_cells_h - 1:
                result.append("\n")

        return result
