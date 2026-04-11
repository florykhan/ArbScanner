"""
Cinematic boot sequence with typewriter feed initialization.

Mounted as a modal screen on app startup. Types out the boot script one
character at a time, then dismisses itself, revealing the dashboard.
"""
from __future__ import annotations

from dataclasses import dataclass

from textual.app import ComposeResult
from textual.containers import Vertical
from textual.screen import ModalScreen
from textual.widgets import Static


@dataclass(frozen=True)
class BootLine:
    text: str
    style: str = "#c9d1d9"
    status: str | None = None
    pause_after: float = 0.16
    char_delay: float = 0.012


_BOOT_SCRIPT: tuple[BootLine, ...] = (
    BootLine("> arbscanner --boot",                  style="bold #00d4aa", pause_after=0.30),
    BootLine("",                                                            pause_after=0.10),
    BootLine("initializing system...",               style="#484f58",      pause_after=0.18),
    BootLine("  loading configuration",              status="OK"),
    BootLine("  connecting database",                status="OK"),
    BootLine("  loading market registry",            status="OK"),
    BootLine("",                                                            pause_after=0.18),
    BootLine("connecting to feeds...",               style="#484f58",      pause_after=0.18),
    BootLine("  POLYMARKET",                          status="OK",          pause_after=0.18),
    BootLine("  KALSHI",                              status="OK",          pause_after=0.18),
    BootLine("  MANIFOLD",                            status="OK",          pause_after=0.18),
    BootLine("",                                                            pause_after=0.18),
    BootLine("starting scanner...",                  style="#484f58",      pause_after=0.18),
    BootLine("  arbitrage engine",                    status="READY",       pause_after=0.20),
    BootLine("  alert pipeline",                      status="READY",       pause_after=0.20),
    BootLine("",                                                            pause_after=0.30),
    BootLine("all systems nominal — entering terminal", style="bold #00d4aa", pause_after=0.55),
)


class BootScreen(ModalScreen[None]):
    """Cinematic boot splash. Dismisses itself when the script finishes."""

    DEFAULT_CSS = """
    BootScreen {
        align: center middle;
        background: #0b1018;
    }

    #boot-frame {
        width: 78;
        height: 28;
        background: #0d1117;
        border: round #00d4aa;
        padding: 1 2;
    }

    #boot-title {
        text-align: center;
        color: #00d4aa;
        text-style: bold;
        height: 1;
    }

    #boot-subtitle {
        text-align: center;
        color: #484f58;
        height: 1;
    }

    #boot-divider {
        text-align: center;
        color: #1c2a3a;
        height: 1;
        margin-top: 1;
        margin-bottom: 1;
    }

    #boot-log {
        height: 1fr;
        color: #c9d1d9;
    }

    #boot-prompt {
        height: 1;
        text-align: center;
        color: #484f58;
        margin-top: 1;
    }
    """

    BINDINGS = [
        ("escape", "skip", "Skip"),
        ("space", "skip", "Skip"),
        ("enter", "skip", "Skip"),
    ]

    def compose(self) -> ComposeResult:
        with Vertical(id="boot-frame"):
            yield Static("█  A R B S C A N N E R  █", id="boot-title")
            yield Static("Prediction Market Arbitrage Terminal", id="boot-subtitle")
            yield Static("─" * 72, id="boot-divider")
            yield Static("", id="boot-log")
            yield Static(
                "[#484f58]press[/] [#00d4aa]space[/] [#484f58]to skip[/]",
                id="boot-prompt",
            )

    def on_mount(self) -> None:
        self._completed: list[str] = []
        self._line_idx = 0
        self._char_idx = 0
        self._dismissed = False
        # Brief delay so the empty frame paints before typing starts.
        self.set_timer(0.25, self._tick)

    # ── Typewriter loop ─────────────────────────────────────────

    def _tick(self) -> None:
        if self._dismissed:
            return

        if self._line_idx >= len(_BOOT_SCRIPT):
            self.set_timer(0.55, self._finish)
            return

        line = _BOOT_SCRIPT[self._line_idx]

        if self._char_idx >= len(line.text):
            # Line complete — commit the styled, status-decorated version.
            self._completed.append(self._render_full(line))
            self._paint(in_progress=None)
            self._line_idx += 1
            self._char_idx = 0
            self.set_timer(line.pause_after, self._tick)
            return

        self._char_idx += 1
        self._paint(in_progress=line)
        self.set_timer(line.char_delay, self._tick)

    # ── Rendering ───────────────────────────────────────────────

    def _paint(self, in_progress: BootLine | None) -> None:
        body = list(self._completed)
        if in_progress is not None:
            partial = in_progress.text[: self._char_idx]
            cursor = "[#00d4aa]█[/]"
            body.append(f"[{in_progress.style}]{partial}[/]{cursor}")
        try:
            self.query_one("#boot-log", Static).update("\n".join(body))
        except Exception:
            pass

    @staticmethod
    def _render_full(line: BootLine) -> str:
        if not line.text:
            return ""
        base = f"[{line.style}]{line.text}[/]"
        if line.status:
            status_color = "#3fb950" if line.status == "OK" else "#d29922"
            pad_width = max(2, 44 - len(line.text))
            base += " " * pad_width + f"[bold {status_color}][{line.status}][/]"
        return base

    # ── Skip / dismiss ──────────────────────────────────────────

    def action_skip(self) -> None:
        self._finish()

    def _finish(self) -> None:
        if self._dismissed:
            return
        self._dismissed = True
        self.dismiss(None)
