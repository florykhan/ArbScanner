"""
ArbScanner Terminal Dashboard
Bloomberg-style operator console for prediction market arbitrage.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pathlib import Path

import mysql.connector
from rich.text import Text
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.widgets import DataTable, Footer, RichLog, Static

from backend.models.alert_view import AlertRow
from terminal.tui.backend_gateway import DashboardSnapshot, TerminalBackendGateway
from terminal.tui.query_loader import load_labeled_queries
from terminal.tui.screens import CommandPaletteScreen, SqlInspectorScreen
from terminal.tui.widgets import (
    BootScreen,
    HeatmapGrid,
    HelpScreen,
    MarginChart,
    TickerTape,
)
from terminal.tui.widgets.ticker_tape import TickerItem

REFRESH_SECONDS = 10
MARGIN_HISTORY_SIZE = 240  # chart is much higher-res now

QUERIES_SQL_PATH = (
    Path(__file__).resolve().parents[2]
    / "database"
    / "queries"
    / "queries.sql"
)

# ── Flash-on-new-arb animation ──────────────────────────────────
#
# When a freshly-detected alert lands in the table, we pulse its row
# from red → green across FLASH_DURATION seconds, interpolating the
# foreground colour at each frame. This draws the eye immediately.
FLASH_DURATION = 2.0
FLASH_FRAMES = 10
FLASH_INTERVAL = FLASH_DURATION / FLASH_FRAMES
_FLASH_START_RGB = (0xF8, 0x51, 0x49)  # #f85149 — red
_FLASH_END_RGB = (0x3F, 0xB9, 0x50)    # #3fb950 — green

_ALERT_COLUMNS: tuple[str, ...] = (
    "id",
    "event",
    "exchanges",
    "margin",
    "detected",
    "status",
)


# ── Formatting helpers ──────────────────────────────────────────


def _ts(value: datetime | None) -> str:
    return value.strftime("%H:%M:%S") if value else "--:--:--"


def _ts_full(value: datetime | None) -> str:
    return value.strftime("%Y-%m-%d %H:%M:%S") if value else "N/A"


def _fmt_margin(value: Decimal | None) -> str:
    if value is None:
        return "-.--"
    return f"{value * Decimal('100'):.2f}"


def _margin_color(pct: Decimal) -> str:
    """Color-code margins like a trading terminal."""
    if pct >= Decimal("5"):
        return "#3fb950"  # green  — excellent
    if pct >= Decimal("3"):
        return "#00d4aa"  # teal   — good
    if pct >= Decimal("1"):
        return "#d29922"  # amber  — moderate
    return "#f85149"      # red    — thin


def _dot(ok: bool) -> str:
    return "[#3fb950]●[/]" if ok else "[#f85149]●[/]"


def _flash_color(frame: int) -> str:
    """Interpolate red→green for the given flash frame index."""
    denom = max(1, FLASH_FRAMES - 1)
    t = min(1.0, max(0.0, frame / denom))
    r = int(_FLASH_START_RGB[0] + (_FLASH_END_RGB[0] - _FLASH_START_RGB[0]) * t)
    g = int(_FLASH_START_RGB[1] + (_FLASH_END_RGB[1] - _FLASH_START_RGB[1]) * t)
    b = int(_FLASH_START_RGB[2] + (_FLASH_END_RGB[2] - _FLASH_START_RGB[2]) * t)
    return f"#{r:02x}{g:02x}{b:02x}"


# ── Application ─────────────────────────────────────────────────


class ArbScannerTerminalApp(App[None]):
    """Bloomberg-style terminal dashboard for ArbScanner."""

    TITLE = "ArbScanner"
    SUB_TITLE = "Arbitrage Terminal"

    CSS = """
    /* ═══════════════════════════════════════════════════════════
       SCREEN — dark blue-black base, thin scrollbars
       ═══════════════════════════════════════════════════════════ */
    Screen {
        background: #0b1018;
        color: #c9d1d9;
        scrollbar-background: #0b1018;
        scrollbar-color: #1c2a3a;
        scrollbar-color-hover: #2d4a6a;
        scrollbar-color-active: #00d4aa;
        scrollbar-size: 1 1;
    }

    /* ═══════════════════════════════════════════════════════════
       BRAND BAR — teal-tinted top strip
       ═══════════════════════════════════════════════════════════ */
    #brand-bar {
        dock: top;
        height: 1;
        width: 100%;
        background: #0d1117;
        background-tint: #00d4aa 8%;
        color: #c9d1d9;
        padding: 0 1;
    }

    /* ═══════════════════════════════════════════════════════════
       METRICS ROW — four compact stat cards
       ═══════════════════════════════════════════════════════════ */
    #metrics-row {
        height: auto;
        max-height: 5;
        padding: 1 1 0 1;
    }

    .metric-card {
        width: 1fr;
        height: 3;
        margin: 0 1 0 0;
        padding: 0 1;
        border: round #1c2a3a;
        border-title-color: #484f58;
        border-title-style: bold;
        border-title-align: left;
        background: #0d1117;
    }

    .metric-card:focus-within {
        border: round #2d4a6a;
        background-tint: #58a6ff 4%;
    }

    .metric-card:last-of-type {
        margin-right: 0;
    }

    .metric-value {
        width: 100%;
        height: 1;
        text-align: center;
    }

    /* ═══════════════════════════════════════════════════════════
       MID ROW — alerts (2fr) + heatmap (1fr) side by side
       ═══════════════════════════════════════════════════════════ */
    #mid-row {
        height: 1fr;
        padding: 1 1 0 1;
    }

    #alert-panel {
        width: 2fr;
        height: 1fr;
        margin: 0 1 0 0;
        border: round #1c2a3a;
        border-title-color: #00d4aa;
        border-title-style: bold;
        border-title-align: left;
        border-subtitle-align: right;
        border-subtitle-color: #484f58;
        border-subtitle-style: italic;
        background: #0d1117;
    }

    #alert-panel:focus-within {
        border: round #1a8a6a;
        background-tint: #00d4aa 2%;
    }

    #alerts-table {
        background: transparent;
    }

    /* ── Heatmap panel (red accent — hot spots) ── */
    #heatmap-panel {
        width: 1fr;
        min-width: 38;
        height: 1fr;
        margin: 0;
        border: round #1c2a3a;
        border-title-color: #f85149;
        border-title-style: bold;
        border-title-align: left;
        border-subtitle-align: right;
        border-subtitle-color: #484f58;
        border-subtitle-style: italic;
        background: #0d1117;
    }

    #heatmap-grid {
        width: 100%;
        height: 100%;
    }

    DataTable > .datatable--header {
        background: #161b22;
        color: #58a6ff;
        text-style: bold;
    }

    DataTable > .datatable--cursor {
        background: #122a3a;
    }

    DataTable > .datatable--even-row {
        background: #0d1117;
    }

    DataTable > .datatable--odd-row {
        background: #111820;
    }

    DataTable > .datatable--hover {
        background: #15202d;
    }

    /* ═══════════════════════════════════════════════════════════
       BOTTOM ROW — scanner status, margin chart, activity feed
       ═══════════════════════════════════════════════════════════ */
    #bottom-row {
        height: 12;
        padding: 1 1 0 1;
    }

    /* ── Status Panel (amber accent) ── */
    #status-panel {
        width: 1fr;
        min-width: 22;
        max-width: 32;
        margin: 0 1 0 0;
        border: round #1c2a3a;
        border-title-color: #d29922;
        border-title-style: bold;
        border-title-align: left;
        background: #0d1117;
        padding: 0 1;
    }

    /* ── Margin Chart Panel (blue accent, now wider) ── */
    #chart-panel {
        width: 3fr;
        min-width: 30;
        margin: 0 1 0 0;
        border: round #1c2a3a;
        border-title-color: #58a6ff;
        border-title-style: bold;
        border-title-align: left;
        border-subtitle-color: #484f58;
        border-subtitle-align: right;
        border-subtitle-style: italic;
        background: #0d1117;
        padding: 0 1;
    }

    #margin-chart {
        width: 100%;
        height: 100%;
    }

    /* ── Activity Feed (green accent) ── */
    #activity-panel {
        width: 2fr;
        min-width: 24;
        border: round #1c2a3a;
        border-title-color: #3fb950;
        border-title-style: bold;
        border-title-align: left;
        background: #0d1117;
    }

    #activity-log {
        background: transparent;
        padding: 0 1;
        scrollbar-size: 1 1;
    }

    /* ═══════════════════════════════════════════════════════════
       TICKER TAPE — scrolling CNBC-style strip above the footer
       ═══════════════════════════════════════════════════════════ */
    #ticker-tape {
        dock: bottom;
        height: 1;
        background: #0d1117;
        background-tint: #00d4aa 6%;
        color: #c9d1d9;
        padding: 0 1;
    }

    /* ═══════════════════════════════════════════════════════════
       FOOTER — dark with teal key hints
       ═══════════════════════════════════════════════════════════ */
    Footer {
        background: #0d1117;
        color: #484f58;
    }

    Footer > .footer--highlight {
        background: #1c2a3a;
    }

    Footer > .footer--highlight-key {
        background: #1c2a3a;
        color: #00d4aa;
    }

    Footer > .footer--key {
        color: #00d4aa;
        background: #1c2a3a;
    }

    Footer > .footer--description {
        color: #c9d1d9;
    }
    """

    BINDINGS = [
        Binding("r",             "refresh_dashboard",       "Refresh"),
        Binding("d",             "dismiss_selected_alert",  "Dismiss"),
        Binding("colon",         "open_palette",            "Cmd", key_display=":"),
        Binding("s",             "open_sql_inspector",      "SQL"),
        Binding("question_mark", "show_help",               "Help", key_display="?"),
        Binding("q",             "quit",                    "Quit"),
    ]

    def __init__(self) -> None:
        super().__init__()
        self.gateway = TerminalBackendGateway()
        self.alerts: list[AlertRow] = []
        self.margin_history: list[float] = []
        self._first_load = True
        self._booted = False

        # Flash tracking
        self._seen_alert_ids: set[int] = set()
        self._flashing: dict[int, int] = {}  # alert_id -> frame index

    # ── Layout ──────────────────────────────────────────────────

    def compose(self) -> ComposeResult:
        yield Static(id="brand-bar")

        with Horizontal(id="metrics-row"):
            with Vertical(id="mc-alerts", classes="metric-card"):
                yield Static("[#484f58]--[/]", id="val-alerts", classes="metric-value")
            with Vertical(id="mc-margin", classes="metric-card"):
                yield Static("[#484f58]--.--[/]", id="val-margin", classes="metric-value")
            with Vertical(id="mc-snapshots", classes="metric-card"):
                yield Static("[#484f58]--[/]", id="val-snapshots", classes="metric-value")
            with Vertical(id="mc-scan", classes="metric-card"):
                yield Static("[#484f58]--:--:--[/]", id="val-scan", classes="metric-value")

        with Horizontal(id="mid-row"):
            with Vertical(id="alert-panel"):
                yield DataTable(id="alerts-table")
            with Vertical(id="heatmap-panel"):
                yield HeatmapGrid(id="heatmap-grid")

        with Horizontal(id="bottom-row"):
            with Vertical(id="status-panel"):
                yield Static("", id="status-content")
            with Vertical(id="chart-panel"):
                yield MarginChart(id="margin-chart")
            with Vertical(id="activity-panel"):
                yield RichLog(
                    id="activity-log",
                    markup=True,
                    max_lines=100,
                    min_width=30,
                )

        yield TickerTape(id="ticker-tape")
        yield Footer()

    # ── Lifecycle ───────────────────────────────────────────────

    def on_mount(self) -> None:
        # Panel titles
        self.query_one("#mc-alerts").border_title = "ALERTS"
        self.query_one("#mc-margin").border_title = "TOP MARGIN"
        self.query_one("#mc-snapshots").border_title = "SNAPSHOTS"
        self.query_one("#mc-scan").border_title = "LAST SCAN"
        self.query_one("#alert-panel").border_title = "Active Alerts"
        self.query_one("#alert-panel").border_subtitle = (
            "↑↓ nav · d dismiss · : cmd · s sql · ? help"
        )
        self.query_one("#heatmap-panel").border_title = "Spread Heatmap"
        self.query_one("#heatmap-panel").border_subtitle = "events × exchanges"
        self.query_one("#status-panel").border_title = "Scanner"
        self.query_one("#chart-panel").border_title = "Margin Trend"
        self.query_one("#chart-panel").border_subtitle = "threshold 3.00%"
        self.query_one("#activity-panel").border_title = "Activity"

        # Alert table columns
        table = self.query_one("#alerts-table", DataTable)
        table.cursor_type = "row"
        table.zebra_stripes = True
        table.add_column("ID", width=6, key="id")
        table.add_column("Event", key="event")
        table.add_column("Exchanges", width=20, key="exchanges")
        table.add_column("Margin", width=10, key="margin")
        table.add_column("Detected", width=20, key="detected")
        table.add_column("Status", width=8, key="status")

        # Startup brand bar
        self.query_one("#brand-bar", Static).update(
            "[bold #00d4aa]█ ARBSCANNER[/]  "
            "[#484f58]·[/]  "
            "[#484f58]Prediction Market Arbitrage Terminal[/]  "
            "[#484f58]·[/]  "
            "[#d29922]booting…[/]"
        )

        # Placeholder ticker tape content until the first refresh lands.
        self.query_one("#ticker-tape", TickerTape).set_items(
            [
                TickerItem("INITIALIZING FEEDS", "#00d4aa", bold=True),
                TickerItem("POLYMARKET", "#58a6ff"),
                TickerItem("KALSHI",     "#58a6ff"),
                TickerItem("MANIFOLD",   "#58a6ff"),
                TickerItem("AWAITING LIVE DATA", "#484f58"),
            ]
        )

        # Welcome message
        log = self.query_one("#activity-log", RichLog)
        log.write("[bold #00d4aa]█ ArbScanner Terminal[/]")
        log.write("[#484f58]─────────────────────────────────[/]")
        log.write("[#484f58]Booting…[/]")

        # Flash animation ticker runs continuously (cheap when idle).
        self.set_interval(FLASH_INTERVAL, self._flash_tick)

        # Push the boot splash. The dashboard is already composed underneath;
        # actual data loading is deferred until the splash dismisses so the
        # operator sees the full cinematic reveal.
        self.push_screen(BootScreen(), self._on_boot_finished)

    def _on_boot_finished(self, _result: None) -> None:
        self._booted = True
        table = self.query_one("#alerts-table", DataTable)
        table.focus()
        self.set_interval(REFRESH_SECONDS, self.action_refresh_dashboard)
        self.action_refresh_dashboard()

    # ── Actions ─────────────────────────────────────────────────

    def action_show_help(self) -> None:
        # Avoid stacking help screens if already open.
        if isinstance(self.screen, HelpScreen):
            return
        self.push_screen(HelpScreen())

    def action_refresh_dashboard(self) -> None:
        snapshot = self.gateway.load_dashboard_snapshot()
        self.alerts = list(snapshot.active_alerts)

        self._update_brand_bar(snapshot)
        self._update_metrics(snapshot)
        self._update_status(snapshot)
        self._update_alerts_table()
        self._update_chart(snapshot)
        self._update_heatmap(snapshot)
        self._update_ticker(snapshot)

        # Seed activity with DB history on first successful load
        if self._first_load and snapshot.connection_ok:
            for item in snapshot.recent_activity:
                self._log(f"{item.message}", "info")
            self._first_load = False

        if snapshot.connection_ok:
            self._log(
                f"Scan: {snapshot.active_alert_count} alert(s) · "
                f"{snapshot.total_snapshots:,} snapshots",
                "info",
            )
        else:
            self._log(snapshot.connection_message, "error")

    # ── Command palette ────────────────────────────────────────

    def action_open_palette(self) -> None:
        if isinstance(self.screen, (CommandPaletteScreen, SqlInspectorScreen)):
            return
        self.push_screen(CommandPaletteScreen(), self._on_palette_result)

    def _on_palette_result(self, command: str | None) -> None:
        if not command:
            return

        command = command.lstrip(":").strip()
        if not command:
            return

        parts = command.split(None, 1)
        name = parts[0].lower()
        rest = parts[1].strip() if len(parts) > 1 else ""

        if name == "scan":
            self._palette_scan()
        elif name == "arb":
            self._palette_arb(rest)
        elif name == "dismiss":
            self._palette_dismiss(rest)
        elif name == "query":
            self._palette_query(rest)
        elif name == "help":
            self.action_show_help()
        elif name == "sql":
            self.action_open_sql_inspector()
        elif name in ("q", "quit", "exit"):
            self.exit()
        else:
            self.notify(
                f"Unknown command: {name}. Try :scan :arb :dismiss :query",
                severity="error",
            )
            self._log(f"Unknown palette command: {name}", "error")

    def _palette_scan(self) -> None:
        self._log(
            "[bold #00d4aa]▣ :scan[/] forced refresh",
            "info",
        )
        self.notify("Dashboard refresh triggered.", severity="information")
        self.action_refresh_dashboard()

    def _palette_arb(self, rest: str) -> None:
        if not rest:
            self.notify("usage: :arb <id>", severity="warning")
            return
        try:
            alert_id = int(rest)
        except ValueError:
            self.notify(f"invalid id: {rest}", severity="error")
            return

        for idx, alert in enumerate(self.alerts):
            if alert.alert_id == alert_id:
                table = self.query_one("#alerts-table", DataTable)
                table.move_cursor(row=idx, column=0)
                table.focus()
                pct = alert.profit_margin_percent
                self._log(
                    f"[bold #00d4aa]▣ :arb[/] #{alert_id} "
                    f"[#c9d1d9]{alert.event_title[:40]}[/] "
                    f"[bold #3fb950]{pct:.2f}%[/]",
                    "success",
                )
                self.notify(
                    f"Focused alert {alert_id}.",
                    severity="information",
                )
                return

        self.notify(f"Alert {alert_id} not in active list.", severity="warning")
        self._log(f":arb {alert_id} not found", "warning")

    def _palette_dismiss(self, rest: str) -> None:
        if not rest:
            self.notify("usage: :dismiss <id>", severity="warning")
            return
        try:
            alert_id = int(rest)
        except ValueError:
            self.notify(f"invalid id: {rest}", severity="error")
            return

        try:
            self.gateway.dismiss_alert(alert_id)
        except mysql.connector.Error as exc:
            self._log(f":dismiss {alert_id} failed: {exc}", "error")
            self.notify(f"Dismiss failed: {exc}", severity="error")
            return

        self._log(
            f"[bold #00d4aa]▣ :dismiss[/] [bold #f0f6fc]#{alert_id}[/]",
            "success",
        )
        self.notify(f"Alert {alert_id} dismissed.", severity="information")
        self.action_refresh_dashboard()

    def _palette_query(self, sql: str) -> None:
        if not sql:
            self.notify("usage: :query <SELECT …>", severity="warning")
            return

        lowered = sql.strip().lower().lstrip("(").strip()
        safe_prefixes = ("select", "show", "describe", "desc", "explain", "with")
        if not lowered.startswith(safe_prefixes):
            self.notify(
                "Only SELECT/SHOW/DESCRIBE allowed via palette.",
                severity="error",
            )
            self._log(
                f"[bold #f85149]▣ :query[/] refused non-read statement",
                "warning",
            )
            return

        try:
            cols, rows = self.gateway.run_query(sql)
        except mysql.connector.Error as exc:
            self._log(f":query error: {exc}", "error")
            self.notify(f"Query error: {exc}", severity="error")
            return
        except Exception as exc:  # noqa: BLE001
            self._log(f":query error: {exc}", "error")
            self.notify(f"Query error: {exc}", severity="error")
            return

        row_count = len(rows)
        self._log(
            f"[bold #00d4aa]▣ :query[/] {row_count} row(s) · "
            f"[#58a6ff]{', '.join(cols) or '(no columns)'}[/]",
            "success",
        )
        for row in rows[:5]:
            values = " · ".join(
                "NULL" if v is None else str(v)[:32] for v in row
            )
            self._log(f"  [#c9d1d9]{values}[/]", "info")
        if row_count > 5:
            self._log(f"  [#484f58]… {row_count - 5} more row(s)[/]", "info")

    # ── SQL inspector ──────────────────────────────────────────

    def action_open_sql_inspector(self) -> None:
        if isinstance(self.screen, SqlInspectorScreen):
            return
        queries = load_labeled_queries(QUERIES_SQL_PATH)
        if not queries:
            self.notify(
                f"No queries found in {QUERIES_SQL_PATH.name}.",
                severity="warning",
            )
        self.push_screen(SqlInspectorScreen(self.gateway, queries))
        self._log(
            f"[bold #58a6ff]▣ SQL inspector[/] opened "
            f"[#484f58]({len(queries)} quer"
            f"{'y' if len(queries) == 1 else 'ies'})[/]",
            "info",
        )

    def action_dismiss_selected_alert(self) -> None:
        if not self.alerts:
            self.notify("No active alerts to dismiss.", severity="warning")
            return

        table = self.query_one("#alerts-table", DataTable)
        if table.cursor_row >= len(self.alerts):
            self.notify("No alert selected.", severity="warning")
            return

        alert = self.alerts[table.cursor_row]

        try:
            self.gateway.dismiss_alert(alert.alert_id)
        except mysql.connector.Error as exc:
            self._log(f"Dismiss failed #{alert.alert_id}: {exc}", "error")
            self.notify(f"Dismiss failed: {exc}", severity="error")
            return

        self._log(
            f"Dismissed [bold #f0f6fc]#{alert.alert_id}[/]: {alert.event_title}",
            "success",
        )
        self.notify(f"Alert {alert.alert_id} dismissed.", severity="information")
        self.action_refresh_dashboard()

    # ── Render helpers ──────────────────────────────────────────

    def _update_brand_bar(self, snap: DashboardSnapshot) -> None:
        dot = _dot(snap.connection_ok)
        label = "Connected" if snap.connection_ok else "DB Error"
        now = datetime.now().strftime("%H:%M:%S")
        self.query_one("#brand-bar", Static).update(
            f"[bold #00d4aa]█ ARBSCANNER[/]  "
            f"[#484f58]·[/]  "
            f"[#484f58]Prediction Market Arbitrage Terminal[/]  "
            f"[#484f58]·[/]  "
            f"{dot} [#c9d1d9]{label}[/]  "
            f"[#484f58]·[/]  "
            f"[#484f58]{now}[/]"
        )

    def _update_metrics(self, snap: DashboardSnapshot) -> None:
        # Active alerts
        count = snap.active_alert_count
        ac = "#3fb950" if count > 0 else "#484f58"
        self.query_one("#val-alerts", Static).update(f"[bold {ac}]{count}[/]")

        # Top margin
        margin_str = _fmt_margin(snap.top_profit_margin)
        if snap.top_profit_margin is not None:
            mc = _margin_color(snap.top_profit_margin * Decimal("100"))
            self.query_one("#val-margin", Static).update(
                f"[bold {mc}]{margin_str}[/][{mc}]%[/]"
            )
        else:
            self.query_one("#val-margin", Static).update(
                f"[#484f58]{margin_str}%[/]"
            )

        # Snapshot count
        s = snap.total_snapshots
        sc = "#58a6ff" if s > 0 else "#484f58"
        self.query_one("#val-snapshots", Static).update(f"[bold {sc}]{s:,}[/]")

        # Last scan time
        scan_time = _ts(snap.latest_snapshot_at)
        tc = "#d29922" if snap.latest_snapshot_at else "#484f58"
        self.query_one("#val-scan", Static).update(f"[bold {tc}]{scan_time}[/]")

    def _update_status(self, snap: DashboardSnapshot) -> None:
        db_dot = _dot(snap.connection_ok)
        db_label = "Connected" if snap.connection_ok else "Error"
        scan_msg = snap.scanner_message if snap.connection_ok else "Offline"
        if len(scan_msg) > 22:
            scan_msg = scan_msg[:19] + "…"
        scan_dot = _dot(snap.connection_ok)

        lines = [
            f"  Database  {db_dot} [#c9d1d9]{db_label}[/]",
            f"  Scanner   {scan_dot} [#c9d1d9]{scan_msg}[/]",
            f"  Alerts    [bold #f0f6fc]{snap.active_alert_count}[/] [#484f58]active[/]",
            f"  Refresh   [#d29922]{_ts(snap.refreshed_at)}[/]",
        ]
        self.query_one("#status-content", Static).update("\n".join(lines))

    def _build_alert_cells(
        self,
        alert: AlertRow,
        flash_color: str | None = None,
    ) -> list[Text]:
        """Build the six Text cells for an alert row.

        When ``flash_color`` is set, every cell is coloured with that hex
        string so the row reads as a single highlighted band during the
        flash-on-new-arb animation.
        """
        pct = alert.profit_margin_percent

        if flash_color is not None:
            fc = flash_color
            return [
                Text(str(alert.alert_id),            style=f"bold {fc}"),
                Text(alert.event_title[:42],         style=f"bold {fc}"),
                Text(alert.mapped_exchanges,         style=fc),
                Text(f"{pct:.2f}%",                  style=f"bold {fc}"),
                Text(_ts_full(alert.detected_at),    style=fc),
                Text(alert.status.upper(),           style=f"bold {fc}"),
            ]

        mc = _margin_color(pct)
        return [
            Text(str(alert.alert_id), style="#484f58 bold"),
            Text(
                alert.event_title[:42],
                style="#f0f6fc bold" if pct >= 3 else "#c9d1d9",
            ),
            Text(alert.mapped_exchanges, style="#58a6ff"),
            Text(f"{pct:.2f}%", style=f"bold {mc}"),
            Text(_ts_full(alert.detected_at), style="#484f58"),
            Text(
                alert.status.upper(),
                style="#3fb950 bold" if alert.status == "Active" else "#f85149",
            ),
        ]

    def _update_alerts_table(self) -> None:
        table = self.query_one("#alerts-table", DataTable)
        prev_row = table.cursor_row
        table.clear()

        current_ids = {alert.alert_id for alert in self.alerts}

        for alert in self.alerts:
            cells = self._build_alert_cells(alert)
            table.add_row(*cells, key=str(alert.alert_id))

        # Start flashes for freshly-detected alerts. Skip the very first
        # load (every row is "new" then) and skip anything the user has
        # already seen across past refreshes.
        if not self._first_load:
            new_ids = current_ids - self._seen_alert_ids
            for alert_id in new_ids:
                self._flashing[alert_id] = 0
                # Log the fresh detection so it appears in the activity pane.
                alert = next(
                    (a for a in self.alerts if a.alert_id == alert_id), None
                )
                if alert is not None:
                    pct = alert.profit_margin_percent
                    self._log(
                        f"[bold #f85149]⚡ NEW ARB[/] "
                        f"[bold #f0f6fc]#{alert.alert_id}[/] "
                        f"{alert.event_title[:40]} "
                        f"[bold #3fb950]{pct:.2f}%[/]",
                        "success",
                    )

        # Drop flashes for alerts that are no longer in the table
        # (dismissed, expired, etc.) so we don't leak frame state.
        self._flashing = {
            aid: frame
            for aid, frame in self._flashing.items()
            if aid in current_ids
        }

        self._seen_alert_ids = current_ids

        if self.alerts:
            target = min(prev_row, len(self.alerts) - 1)
            table.move_cursor(row=max(0, target), column=0)

    def _flash_tick(self) -> None:
        """Advance every in-progress flash by one frame."""
        if not self._flashing:
            return

        table = self.query_one("#alerts-table", DataTable)
        finished: list[int] = []

        for alert_id, frame in list(self._flashing.items()):
            alert = next(
                (a for a in self.alerts if a.alert_id == alert_id), None
            )
            if alert is None:
                finished.append(alert_id)
                continue

            next_frame = frame + 1
            at_end = next_frame >= FLASH_FRAMES

            if at_end:
                cells = self._build_alert_cells(alert)
            else:
                cells = self._build_alert_cells(
                    alert, flash_color=_flash_color(next_frame)
                )

            row_key = str(alert_id)
            try:
                for column_key, value in zip(_ALERT_COLUMNS, cells):
                    table.update_cell(row_key, column_key, value)
            except Exception:
                # Row may have been cleared mid-flash (e.g. refresh happened
                # at the same instant). Drop the flash and move on — the
                # next refresh will repaint the row cleanly.
                finished.append(alert_id)
                continue

            if at_end:
                finished.append(alert_id)
            else:
                self._flashing[alert_id] = next_frame

        for alert_id in finished:
            self._flashing.pop(alert_id, None)

    def _update_chart(self, snap: DashboardSnapshot) -> None:
        if snap.top_profit_margin is not None:
            self.margin_history.append(
                float(snap.top_profit_margin * Decimal("100"))
            )
        elif self.margin_history:
            self.margin_history.append(self.margin_history[-1])
        else:
            self.margin_history.append(0.0)

        self.margin_history = self.margin_history[-MARGIN_HISTORY_SIZE:]
        self.query_one("#margin-chart", MarginChart).set_data(self.margin_history)

    def _update_heatmap(self, snap: DashboardSnapshot) -> None:
        # Loads a separate grouped query — gated on DB reachability so we
        # don't spam errors when the main snapshot already failed.
        if not snap.connection_ok:
            return
        try:
            data = self.gateway.load_heatmap()
        except mysql.connector.Error as exc:
            self._log(f"Heatmap refresh failed: {exc}", "error")
            return
        self.query_one("#heatmap-grid", HeatmapGrid).set_data(data)

    # ── Ticker tape ─────────────────────────────────────────────

    def _update_ticker(self, snap: DashboardSnapshot) -> None:
        items: list[TickerItem] = []

        # Lead the feed with a heartbeat marker + market status.
        conn_color = "#3fb950" if snap.connection_ok else "#f85149"
        items.append(
            TickerItem(
                "● ARBSCANNER LIVE" if snap.connection_ok else "● OFFLINE",
                conn_color,
                bold=True,
            )
        )
        items.append(
            TickerItem(
                f"SNAPSHOTS {snap.total_snapshots:,}",
                "#58a6ff",
            )
        )
        items.append(
            TickerItem(
                f"SCAN {_ts(snap.latest_snapshot_at)}",
                "#d29922",
            )
        )

        # Active alerts: the headline feed.
        for alert in snap.active_alerts[:12]:
            pct = alert.profit_margin_percent
            color = _margin_color(pct)
            arrow = "▲" if pct >= Decimal("1") else "△"
            label = f"{alert.event_title[:40]} {arrow} {pct:.2f}%"
            items.append(TickerItem(label, color, bold=(pct >= 3)))

        # Fallback / supplementary content from recent snapshots.
        if snap.recent_activity:
            for activity in snap.recent_activity[:6]:
                msg = activity.message
                if len(msg) > 70:
                    msg = msg[:67] + "…"
                items.append(TickerItem(msg, "#c9d1d9"))

        if len(items) <= 3:
            items.append(TickerItem("NO ACTIVE ARB — MONITORING…", "#484f58"))

        self.query_one("#ticker-tape", TickerTape).set_items(items)

    # ── Activity log ────────────────────────────────────────────

    def _log(self, message: str, level: str = "info") -> None:
        ts = datetime.now().strftime("%H:%M:%S")
        color = {
            "info": "#58a6ff",
            "success": "#3fb950",
            "warning": "#d29922",
            "error": "#f85149",
        }.get(level, "#484f58")
        self.query_one("#activity-log", RichLog).write(
            f"[#484f58]{ts}[/] [{color}]│[/] {message}"
        )
