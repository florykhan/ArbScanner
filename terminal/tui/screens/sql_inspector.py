"""
Live SQL inspector.

A modal pane that loads `database/queries/queries.sql`, lists every
named query, and runs the selected one against the live database.
Results land in a DataTable. This is the "show the rubric queries
executing inside the TUI" demo panel.

Navigation:
    ↑/↓        — move between queries
    Enter      — run the highlighted query (or rerun with current param)
    Ctrl+R     — rerun
    Tab        — cycle focus between the list and the parameter input
    Esc        — close the inspector
"""
from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, Any, Sequence

import mysql.connector
from rich.text import Text
from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.screen import ModalScreen
from textual.widgets import DataTable, Input, Label, ListItem, ListView, Static

from terminal.tui.query_loader import LabeledQuery

if TYPE_CHECKING:
    from terminal.tui.backend_gateway import TerminalBackendGateway


_MAX_DISPLAY_ROWS = 500


def _format_cell(value: Any) -> Text:
    if value is None:
        return Text("NULL", style="#484f58 italic")
    if isinstance(value, bool):
        return Text(str(value), style="#d29922")
    if isinstance(value, Decimal):
        return Text(f"{value.normalize():f}" if value != 0 else "0", style="#00d4aa")
    if isinstance(value, (int, float)):
        return Text(f"{value}", style="#58a6ff")
    if isinstance(value, (bytes, bytearray)):
        try:
            return Text(bytes(value).decode("utf-8"), style="#c9d1d9")
        except UnicodeDecodeError:
            return Text(bytes(value).hex(), style="#484f58")
    return Text(str(value), style="#c9d1d9")


class SqlInspectorScreen(ModalScreen[None]):
    """Execute rubric SQL queries against the live DB and show the rows."""

    DEFAULT_CSS = """
    SqlInspectorScreen {
        align: center middle;
        background: #0b1018 85%;
    }

    #sql-box {
        width: 96%;
        height: 92%;
        background: #0d1117;
        border: round #00d4aa;
        border-title-color: #00d4aa;
        border-title-style: bold;
        border-title-align: left;
        border-subtitle-color: #484f58;
        border-subtitle-align: right;
        padding: 1 2;
    }

    #sql-top {
        height: 13;
        margin-bottom: 1;
    }

    #sql-list-panel {
        width: 34;
        height: 100%;
        margin-right: 1;
        border: round #1c2a3a;
        border-title-color: #58a6ff;
        border-title-style: bold;
        border-title-align: left;
        background: #0b1018;
    }

    #sql-list {
        background: transparent;
        height: 1fr;
    }

    #sql-list > ListItem {
        padding: 0 1;
        background: transparent;
    }

    #sql-list > ListItem.-highlight {
        background: #122a3a;
        color: #00d4aa;
    }

    #sql-list > ListItem:hover {
        background: #15202d;
    }

    #sql-preview-panel {
        width: 1fr;
        height: 100%;
        border: round #1c2a3a;
        border-title-color: #58a6ff;
        border-title-style: bold;
        border-title-align: left;
        background: #0b1018;
        padding: 0 1;
    }

    #sql-preview {
        height: 1fr;
        color: #c9d1d9;
    }

    #sql-param-row {
        height: 3;
        margin-bottom: 1;
    }

    #sql-param-label {
        width: 10;
        height: 3;
        content-align: left middle;
        color: #d29922;
        padding: 0 1;
    }

    #sql-param {
        width: 1fr;
        height: 3;
        background: #0b1018;
        border: round #1c2a3a;
    }

    #sql-param:focus {
        border: round #00d4aa;
    }

    #sql-status {
        width: auto;
        height: 3;
        content-align: right middle;
        padding: 0 2;
        color: #484f58;
    }

    #sql-results-panel {
        height: 1fr;
        border: round #1c2a3a;
        border-title-color: #58a6ff;
        border-title-style: bold;
        border-title-align: left;
        background: #0b1018;
    }

    #sql-results {
        background: transparent;
        height: 1fr;
    }

    #sql-footer {
        height: 1;
        margin-top: 1;
        text-align: center;
        color: #484f58;
    }
    """

    BINDINGS = [
        Binding("escape",   "close",     "Close"),
        Binding("ctrl+r",   "run_query", "Run"),
        Binding("f5",       "run_query", "Run"),
    ]

    def __init__(
        self,
        gateway: "TerminalBackendGateway",
        queries: Sequence[LabeledQuery],
    ) -> None:
        super().__init__()
        self._gateway = gateway
        self._queries = list(queries)
        self._current_index = 0

    # ── Layout ─────────────────────────────────────────────────

    def compose(self) -> ComposeResult:
        with Vertical(id="sql-box"):
            with Horizontal(id="sql-top"):
                with Vertical(id="sql-list-panel"):
                    yield ListView(
                        *[
                            ListItem(
                                Label(
                                    self._list_label(i, q),
                                    markup=True,
                                ),
                                id=f"sql-item-{i}",
                            )
                            for i, q in enumerate(self._queries)
                        ],
                        id="sql-list",
                        initial_index=0 if self._queries else None,
                    )
                with Vertical(id="sql-preview-panel"):
                    yield Static("", id="sql-preview")

            with Horizontal(id="sql-param-row"):
                yield Static(
                    "[bold #d29922]param[/]", id="sql-param-label"
                )
                yield Input(
                    placeholder="value for ? placeholders (default: 1)",
                    id="sql-param",
                    value="1",
                )
                yield Static("", id="sql-status")

            with Vertical(id="sql-results-panel"):
                yield DataTable(id="sql-results")

            yield Static(
                "[#484f58] ↑↓ select · Enter run · Ctrl+R rerun · "
                "Tab focus param · Esc close [/]",
                id="sql-footer",
            )

    # ── Lifecycle ──────────────────────────────────────────────

    def on_mount(self) -> None:
        self.query_one("#sql-box").border_title = (
            " ▣  LIVE SQL INSPECTOR  ·  database/queries/queries.sql "
        )
        self.query_one("#sql-box").border_subtitle = (
            f" {len(self._queries)} quer{'y' if len(self._queries) == 1 else 'ies'} loaded "
        )
        self.query_one("#sql-list-panel").border_title = "Queries"
        self.query_one("#sql-preview-panel").border_title = "Current Query"
        self.query_one("#sql-results-panel").border_title = "Results"

        table = self.query_one("#sql-results", DataTable)
        table.cursor_type = "row"
        table.zebra_stripes = True

        if not self._queries:
            preview = self.query_one("#sql-preview", Static)
            preview.update(
                Text.from_markup(
                    "[#f85149]No queries found in[/] "
                    "[#c9d1d9]database/queries/queries.sql[/]\n\n"
                    "[#484f58]Add some SELECT statements and press Esc "
                    "to close this panel.[/]"
                )
            )
            self._update_status("empty", "#f85149")
            return

        list_view = self.query_one("#sql-list", ListView)
        list_view.focus()
        self._show_query(0)
        # Auto-run the first query so the demo lands on a populated grid.
        self.call_after_refresh(self._run_current)

    # ── Rendering ──────────────────────────────────────────────

    @staticmethod
    def _list_label(index: int, query: LabeledQuery) -> str:
        title = query.title.replace("[", r"\[")
        param_badge = (
            f" [#d29922]?×{query.param_count}[/]"
            if query.param_count
            else ""
        )
        return f"[#484f58]{index + 1:>2}.[/] [#c9d1d9]{title}[/]{param_badge}"

    def _show_query(self, index: int) -> None:
        if not self._queries:
            return
        self._current_index = index
        query = self._queries[index]
        preview = self.query_one("#sql-preview", Static)
        preview.update(Text(query.display, style="#c9d1d9"))
        self._update_status(
            f"{query.param_count} param(s)" if query.param_count else "ready",
            "#484f58",
        )

    def _update_status(self, message: str, color: str) -> None:
        self.query_one("#sql-status", Static).update(
            f"[{color}]{message}[/]"
        )

    # ── Events ─────────────────────────────────────────────────

    def on_list_view_highlighted(self, event: ListView.Highlighted) -> None:
        list_view = self.query_one("#sql-list", ListView)
        if list_view.index is None:
            return
        self._show_query(list_view.index)

    def on_list_view_selected(self, event: ListView.Selected) -> None:
        self._run_current()

    def on_input_submitted(self, event: Input.Submitted) -> None:
        self._run_current()

    # ── Actions ────────────────────────────────────────────────

    def action_run_query(self) -> None:
        self._run_current()

    def action_close(self) -> None:
        self.dismiss(None)

    # ── Execution ──────────────────────────────────────────────

    def _run_current(self) -> None:
        if not self._queries:
            return

        query = self._queries[self._current_index]
        param_input = self.query_one("#sql-param", Input).value.strip()
        raw = param_input or "1"

        try:
            coerced: Any = int(raw)
        except ValueError:
            try:
                coerced = float(raw)
            except ValueError:
                coerced = raw

        params: tuple = ()
        if query.param_count:
            params = tuple([coerced] * query.param_count)

        # mysql.connector uses %s as its placeholder by default, but the
        # rubric queries.sql uses the ANSI `?`. Translate before executing.
        sql = query.sql.replace("?", "%s")

        self._update_status("running…", "#d29922")
        self.app.refresh()

        try:
            cols, rows = self._gateway.run_query(sql, params)
        except mysql.connector.Error as exc:
            self._render_error(f"DB error: {exc}")
            return
        except Exception as exc:  # noqa: BLE001
            self._render_error(f"error: {exc}")
            return

        self._render_results(cols, rows)

    def _render_error(self, message: str) -> None:
        table = self.query_one("#sql-results", DataTable)
        table.clear(columns=True)
        table.add_column(Text("⚠  Error", style="#f85149 bold"))
        table.add_row(Text(message, style="#f85149"))
        self._update_status("error", "#f85149")

    def _render_results(
        self,
        cols: list[str],
        rows: list[tuple],
    ) -> None:
        table = self.query_one("#sql-results", DataTable)
        table.clear(columns=True)

        if not cols:
            table.add_column("Result")
            table.add_row(Text("(statement returned no columns)", style="#484f58 italic"))
            self._update_status("0 rows", "#484f58")
            return

        for col in cols:
            table.add_column(
                Text(str(col), style="#58a6ff bold"),
                key=str(col),
            )

        if not rows:
            placeholder = [Text("—", style="#484f58")] * len(cols)
            table.add_row(*placeholder)
            self._update_status("0 rows", "#484f58")
            return

        for row in rows[:_MAX_DISPLAY_ROWS]:
            table.add_row(*[_format_cell(v) for v in row])

        truncated = len(rows) > _MAX_DISPLAY_ROWS
        suffix = " (truncated)" if truncated else ""
        self._update_status(f"{len(rows)} row(s){suffix}", "#3fb950")
