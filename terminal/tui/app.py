"""
ArbScanner Terminal Dashboard
Bloomberg-style operator console for prediction market arbitrage.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

import mysql.connector
from rich.text import Text
from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical
from textual.widgets import DataTable, Footer, RichLog, Sparkline, Static

from backend.models.alert_view import AlertRow
from terminal.tui.backend_gateway import DashboardSnapshot, TerminalBackendGateway

REFRESH_SECONDS = 10
MARGIN_HISTORY_SIZE = 60


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
       ALERT PANEL — main focus area, teal accent
       ═══════════════════════════════════════════════════════════ */
    #alert-panel {
        height: 1fr;
        margin: 1 1 0 1;
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
       BOTTOM ROW — scanner status, sparkline, activity feed
       ═══════════════════════════════════════════════════════════ */
    #bottom-row {
        height: 10;
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

    /* ── Sparkline Panel (blue accent) ── */
    #spark-panel {
        width: 1fr;
        min-width: 14;
        max-width: 28;
        margin: 0 1 0 0;
        border: round #1c2a3a;
        border-title-color: #58a6ff;
        border-title-style: bold;
        border-title-align: left;
        background: #0d1117;
        padding: 0;
    }

    #margin-sparkline {
        width: 100%;
        height: 100%;
    }

    Sparkline > .sparkline--max-color {
        color: #00d4aa;
    }

    Sparkline > .sparkline--min-color {
        color: #0d2818;
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
        ("r", "refresh_dashboard", "Refresh"),
        ("d", "dismiss_selected_alert", "Dismiss"),
        ("q", "quit", "Quit"),
    ]

    def __init__(self) -> None:
        super().__init__()
        self.gateway = TerminalBackendGateway()
        self.alerts: list[AlertRow] = []
        self.margin_history: list[float] = []
        self._first_load = True

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

        with Vertical(id="alert-panel"):
            yield DataTable(id="alerts-table")

        with Horizontal(id="bottom-row"):
            with Vertical(id="status-panel"):
                yield Static("", id="status-content")
            with Vertical(id="spark-panel"):
                yield Sparkline([], id="margin-sparkline")
            with Vertical(id="activity-panel"):
                yield RichLog(
                    id="activity-log",
                    markup=True,
                    max_lines=100,
                    min_width=30,
                )

        yield Footer()

    # ── Lifecycle ───────────────────────────────────────────────

    def on_mount(self) -> None:
        # Panel titles
        self.query_one("#mc-alerts").border_title = "ALERTS"
        self.query_one("#mc-margin").border_title = "TOP MARGIN"
        self.query_one("#mc-snapshots").border_title = "SNAPSHOTS"
        self.query_one("#mc-scan").border_title = "LAST SCAN"
        self.query_one("#alert-panel").border_title = "Active Alerts"
        self.query_one("#alert-panel").border_subtitle = "↑↓ navigate · d dismiss"
        self.query_one("#status-panel").border_title = "Scanner"
        self.query_one("#spark-panel").border_title = "Margin Trend"
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
        table.focus()

        # Startup brand bar
        self.query_one("#brand-bar", Static).update(
            "[bold #00d4aa]█ ARBSCANNER[/]  "
            "[#484f58]·[/]  "
            "[#484f58]Prediction Market Arbitrage Terminal[/]  "
            "[#484f58]·[/]  "
            "[#d29922]connecting…[/]"
        )

        # Welcome message
        log = self.query_one("#activity-log", RichLog)
        log.write("[bold #00d4aa]█ ArbScanner Terminal[/]")
        log.write("[#484f58]─────────────────────────────────[/]")
        log.write("[#484f58]Initializing dashboard…[/]")

        # Auto-refresh loop
        self.set_interval(REFRESH_SECONDS, self.action_refresh_dashboard)
        self.action_refresh_dashboard()

    # ── Actions ─────────────────────────────────────────────────

    def action_refresh_dashboard(self) -> None:
        snapshot = self.gateway.load_dashboard_snapshot()
        self.alerts = list(snapshot.active_alerts)

        self._update_brand_bar(snapshot)
        self._update_metrics(snapshot)
        self._update_status(snapshot)
        self._update_alerts_table()
        self._update_sparkline(snapshot)

        # Seed activity with DB history on first successful load
        if self._first_load and snapshot.connection_ok:
            for item in snapshot.recent_activity:
                ts = item.occurred_at.strftime("%H:%M:%S")
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

    def _update_alerts_table(self) -> None:
        table = self.query_one("#alerts-table", DataTable)
        prev_row = table.cursor_row
        table.clear()

        for alert in self.alerts:
            pct = alert.profit_margin_percent
            mc = _margin_color(pct)

            table.add_row(
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
                key=str(alert.alert_id),
            )

        if self.alerts:
            target = min(prev_row, len(self.alerts) - 1)
            table.move_cursor(row=max(0, target), column=0)

    def _update_sparkline(self, snap: DashboardSnapshot) -> None:
        if snap.top_profit_margin is not None:
            self.margin_history.append(
                float(snap.top_profit_margin * Decimal("100"))
            )
        elif self.margin_history:
            self.margin_history.append(self.margin_history[-1])
        else:
            self.margin_history.append(0.0)

        self.margin_history = self.margin_history[-MARGIN_HISTORY_SIZE:]
        self.query_one("#margin-sparkline", Sparkline).data = self.margin_history

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
