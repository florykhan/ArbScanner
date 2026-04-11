"""
Keybind cheat sheet overlay.

Pushed as a modal screen when the user hits `?`. Dismisses with `?` or
`esc`, restoring the dashboard exactly where it was.
"""
from __future__ import annotations

from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Vertical
from textual.screen import ModalScreen
from textual.widgets import Static


_KEYBINDS: tuple[tuple[str, tuple[tuple[str, str], ...]], ...] = (
    (
        "Navigation",
        (
            ("↑ / ↓",       "Move selection in the alerts table"),
            ("PgUp / PgDn", "Page through the alerts table"),
            ("Home / End",  "Jump to first / last alert"),
        ),
    ),
    (
        "Actions",
        (
            ("r", "Refresh dashboard now"),
            ("d", "Dismiss the selected alert"),
        ),
    ),
    (
        "Power Tools",
        (
            (":",         "Open command palette (:scan :arb :dismiss :query)"),
            ("s",         "Open live SQL inspector (queries.sql)"),
        ),
    ),
    (
        "Help & App",
        (
            ("?",         "Toggle this help overlay"),
            ("q",         "Quit ArbScanner"),
            ("ctrl+c",    "Force quit"),
        ),
    ),
)


class HelpScreen(ModalScreen[None]):
    """Full-screen keybind cheat sheet, dismissable with esc or ?."""

    DEFAULT_CSS = """
    HelpScreen {
        align: center middle;
        background: #0b1018 85%;
    }

    #help-frame {
        width: 72;
        height: auto;
        max-height: 30;
        background: #0d1117;
        border: round #00d4aa;
        border-title-color: #00d4aa;
        border-title-style: bold;
        border-title-align: left;
        border-subtitle-color: #484f58;
        border-subtitle-align: right;
        padding: 1 2;
    }

    #help-body {
        height: auto;
    }

    #help-footer {
        height: 1;
        text-align: center;
        color: #484f58;
        margin-top: 1;
    }
    """

    BINDINGS = [
        Binding("escape",        "close", "Close"),
        Binding("question_mark", "close", "Close", key_display="?"),
        Binding("q",             "close", "Close"),
    ]

    def compose(self) -> ComposeResult:
        with Vertical(id="help-frame"):
            yield Static("", id="help-body")
            yield Static(
                "[#484f58]press[/] [#00d4aa]?[/] [#484f58]or[/] "
                "[#00d4aa]esc[/] [#484f58]to close[/]",
                id="help-footer",
            )

    def on_mount(self) -> None:
        frame = self.query_one("#help-frame")
        frame.border_title = " ⌨  KEYBINDINGS "
        frame.border_subtitle = " ArbScanner "

        lines: list[str] = []
        for section, items in _KEYBINDS:
            lines.append(f"[bold #58a6ff]{section}[/]")
            for key, desc in items:
                # Right-pad key for aligned two-column layout.
                padded_key = f"{key:<12}"
                lines.append(
                    f"  [bold #00d4aa]{padded_key}[/]  [#c9d1d9]{desc}[/]"
                )
            lines.append("")

        self.query_one("#help-body", Static).update("\n".join(lines).rstrip())

    def action_close(self) -> None:
        self.dismiss(None)
