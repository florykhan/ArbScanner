"""
Bloomberg-style command palette.

Press `:` in the main dashboard to pop this modal. Type a command and
hit Enter — the palette dismisses and returns the raw command string
to the caller, which then parses and dispatches it.

Supported commands (parsed by the app):
    :scan               – force a full dashboard refresh
    :arb <id>           – focus an alert row by id
    :dismiss <id>       – mark an active alert expired
    :query <SELECT …>   – run an ad-hoc SELECT against the live DB
"""
from __future__ import annotations

from rich.text import Text
from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Vertical
from textual.screen import ModalScreen
from textual.widgets import Input, Static


_HELP_MARKUP = (
    "[bold #00d4aa]▣  COMMAND PALETTE[/]\n"
    "[#484f58]─────────────────────────────────────────────[/]\n"
    "\n"
    "  [bold #00d4aa]:scan[/]             Force a full dashboard refresh\n"
    "  [bold #00d4aa]:arb[/] [#d29922]<id>[/]         Focus an alert row by id\n"
    "  [bold #00d4aa]:dismiss[/] [#d29922]<id>[/]     Dismiss an active alert\n"
    "  [bold #00d4aa]:query[/] [#d29922]<SQL>[/]      Run an ad-hoc SELECT query\n"
    "\n"
    "  [#484f58]press [#c9d1d9]Enter[/] to run · [#c9d1d9]Esc[/] to cancel[/]"
)


class CommandPaletteScreen(ModalScreen[str | None]):
    """Captures a single command string and dismisses with the result."""

    DEFAULT_CSS = """
    CommandPaletteScreen {
        align: center middle;
        background: #0b1018 75%;
    }

    #palette-frame {
        width: 84;
        max-width: 95%;
        height: auto;
        background: #0d1117;
        border: round #00d4aa;
        border-title-color: #00d4aa;
        border-title-style: bold;
        border-title-align: left;
        padding: 1 2;
    }

    #palette-help {
        height: auto;
        margin-bottom: 1;
    }

    #palette-prompt-row {
        height: 1;
        margin-top: 0;
    }

    #palette-prompt-label {
        width: 3;
        color: #00d4aa;
        text-style: bold;
    }

    #palette-input {
        height: 1;
        background: #0b1018;
        color: #f0f6fc;
        border: none;
        padding: 0;
    }

    #palette-input:focus {
        background: #0b1018;
    }
    """

    BINDINGS = [
        Binding("escape", "cancel", "Cancel"),
    ]

    def __init__(self, initial: str = "") -> None:
        super().__init__()
        self._initial = initial

    def compose(self) -> ComposeResult:
        with Vertical(id="palette-frame"):
            yield Static(Text.from_markup(_HELP_MARKUP), id="palette-help")
            yield Static(
                "[bold #00d4aa]›[/] [#484f58]type a command…[/]",
                id="palette-prompt-row",
            )
            yield Input(
                placeholder="scan · arb 12 · dismiss 12 · query SELECT …",
                id="palette-input",
                value=self._initial,
            )

    def on_mount(self) -> None:
        frame = self.query_one("#palette-frame")
        frame.border_title = " COMMAND "
        self.query_one("#palette-input", Input).focus()

    # ── Actions ────────────────────────────────────────────────

    def on_input_submitted(self, event: Input.Submitted) -> None:
        self.dismiss(event.value.strip() or None)

    def action_cancel(self) -> None:
        self.dismiss(None)
