from __future__ import annotations

from datetime import datetime
from decimal import Decimal

import mysql.connector
from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical
from textual.widgets import DataTable, Footer, Header, Static

from backend.models.alert_view import AlertRow
from terminal.tui.backend_gateway import DashboardSnapshot, TerminalBackendGateway

REFRESH_SECONDS = 10
ACTIVITY_LIMIT = 8


def _format_timestamp(value: datetime | None) -> str:
    if value is None:
        return "N/A"
    return value.strftime("%Y-%m-%d %H:%M:%S")


def _format_profit_margin(value: Decimal | None) -> str:
    if value is None:
        return "N/A"
    return f"{value * Decimal('100'):.2f}%"


class ArbScannerTerminalApp(App[None]):
    """First Textual shell for the ArbScanner operator console."""

    TITLE = "ArbScanner"
    SUB_TITLE = "Backend alert console"
    CSS = """
    Screen {
        layout: vertical;
        background: #09111a;
        color: #e8efe9;
    }

    #status-bar {
        height: 3;
        padding: 0 2;
        background: #112030;
        color: #d9e6f2;
        border-bottom: solid #3d5a73;
    }

    #main-layout {
        height: 1fr;
    }

    #sidebar {
        width: 34;
        min-width: 28;
        padding: 1 1 1 2;
    }

    #content {
        width: 1fr;
        padding: 1 2 1 1;
    }

    .panel-title {
        height: 1;
        margin: 0 0 1 0;
        color: #9ec1d9;
        text-style: bold;
    }

    .panel {
        border: round #3d5a73;
        padding: 1;
        margin: 0 0 1 0;
        background: #0f1b27;
    }

    #summary-panel {
        height: 11;
    }

    #activity-panel {
        height: 1fr;
    }

    #alerts-table {
        height: 1fr;
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
        self.activity_lines: list[str] = [
            "Waiting for scanner activity contract.",
            "This panel currently records terminal refreshes and dismissals.",
        ]

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        yield Static(id="status-bar")
        with Horizontal(id="main-layout"):
            with Vertical(id="sidebar"):
                yield Static("Summary Stats", classes="panel-title")
                yield Static(id="summary-panel", classes="panel")
                yield Static("Recent Activity", classes="panel-title")
                yield Static(id="activity-panel", classes="panel")
            with Vertical(id="content"):
                yield Static("Active Alerts", classes="panel-title")
                yield DataTable(id="alerts-table")
        yield Footer()

    def on_mount(self) -> None:
        self._configure_alert_table()
        self.set_interval(REFRESH_SECONDS, self.action_refresh_dashboard)
        self.action_refresh_dashboard()

    def _configure_alert_table(self) -> None:
        table = self.query_one("#alerts-table", DataTable)
        table.cursor_type = "row"
        table.zebra_stripes = True
        table.add_columns(
            "Alert ID",
            "Event",
            "Exchanges",
            "Profit %",
            "Detected At",
            "Status",
        )
        table.focus()

    def action_refresh_dashboard(self) -> None:
        snapshot = self.gateway.load_dashboard_snapshot()
        self.alerts = list(snapshot.active_alerts)
        self._render_status_bar(snapshot)
        self._render_summary(snapshot)
        self._render_alerts_table()

        if snapshot.connection_ok:
            self._append_activity(
                f"Refresh complete: {snapshot.active_alert_count} active alert(s) loaded."
            )
        else:
            self._append_activity(snapshot.connection_message)

    def action_dismiss_selected_alert(self) -> None:
        if not self.alerts:
            self.notify("No active alerts to dismiss.", severity="warning")
            return

        table = self.query_one("#alerts-table", DataTable)
        selected_row = table.cursor_row

        if selected_row >= len(self.alerts):
            self.notify("No alert is currently selected.", severity="warning")
            return

        selected_alert = self.alerts[selected_row]

        try:
            self.gateway.dismiss_alert(selected_alert.alert_id)
        except mysql.connector.Error as exc:
            message = f"Dismiss failed for alert {selected_alert.alert_id}: {exc}"
            self._append_activity(message)
            self.notify(message, severity="error")
            return

        self._append_activity(
            f"Dismissed alert {selected_alert.alert_id} for {selected_alert.event_title}."
        )
        self.notify(
            f"Alert {selected_alert.alert_id} dismissed.",
            severity="information",
        )
        self.action_refresh_dashboard()

    def _render_status_bar(self, snapshot: DashboardSnapshot) -> None:
        database_status = "connected" if snapshot.connection_ok else "error"
        status_bar = self.query_one("#status-bar", Static)
        status_bar.update(
            "\n".join(
                [
                    f"Database: {database_status} | Last refresh: {_format_timestamp(snapshot.refreshed_at)}",
                    f"{snapshot.connection_message} | {snapshot.scanner_message}",
                ]
            )
        )

    def _render_summary(self, snapshot: DashboardSnapshot) -> None:
        summary_panel = self.query_one("#summary-panel", Static)
        summary_panel.update(
            "\n".join(
                [
                    f"Active alerts : {snapshot.active_alert_count}",
                    f"Top margin    : {_format_profit_margin(snapshot.top_profit_margin)}",
                    f"Latest detect : {_format_timestamp(snapshot.latest_detected_at)}",
                    f"Last refresh  : {_format_timestamp(snapshot.refreshed_at)}",
                    "",
                    "Operator actions",
                    "r  refresh dashboard",
                    "d  dismiss selected alert",
                    "q  quit",
                ]
            )
        )

    def _render_alerts_table(self) -> None:
        table = self.query_one("#alerts-table", DataTable)
        table.clear()

        for alert in self.alerts:
            table.add_row(
                str(alert.alert_id),
                alert.event_title,
                alert.mapped_exchanges,
                f"{alert.profit_margin_percent:.2f}%",
                _format_timestamp(alert.detected_at),
                alert.status,
                key=str(alert.alert_id),
            )

        if self.alerts:
            table.move_cursor(row=0, column=0)

    def _append_activity(self, message: str) -> None:
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.activity_lines.append(f"[{timestamp}] {message}")
        self.activity_lines = self.activity_lines[-ACTIVITY_LIMIT:]
        activity_panel = self.query_one("#activity-panel", Static)
        activity_panel.update("\n".join(self.activity_lines))
