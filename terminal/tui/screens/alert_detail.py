"""
Focused alert detail drilldown.

Opened from the main alert table with Enter. This keeps the dashboard
table dense and high-signal while moving all venue-level detail into a
full-screen modal with room for event context and market book data.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical, VerticalScroll
from textual.screen import ModalScreen
from textual.widgets import Static

from backend.models.alert_view import AlertDetail


def _ts(value: datetime | None) -> str:
    return value.strftime("%H:%M:%S") if value else "--:--:--"


def _ts_full(value: datetime | None) -> str:
    return value.strftime("%Y-%m-%d %H:%M:%S") if value else "N/A"


def _date_short(value: datetime | None) -> str:
    return value.strftime("%Y-%m-%d") if value else "N/A"


def _fmt_pct(value: Decimal | None) -> str:
    if value is None:
        return "--.--%"
    return f"{value:.2f}%"


def _fmt_price(value: Decimal | None) -> str:
    if value is None:
        return "--.--"
    return f"{value * Decimal('100'):.2f}"


def _margin_color(pct: Decimal | None) -> str:
    if pct is None:
        return "#7d8590"
    if pct >= Decimal("5"):
        return "#3fb950"
    if pct >= Decimal("3"):
        return "#00d4aa"
    if pct >= Decimal("1"):
        return "#d29922"
    return "#f85149"


def _age_label(value: datetime | None, *, now: datetime | None = None) -> str:
    if value is None:
        return "N/A"
    current = now or datetime.now()
    delta = current - value
    total_seconds = int(abs(delta.total_seconds()))
    days, remainder = divmod(total_seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, _seconds = divmod(remainder, 60)
    parts: list[str] = []
    if days:
        parts.append(f"{days}d")
    if hours or days:
        parts.append(f"{hours}h")
    parts.append(f"{minutes}m")
    return " ".join(parts)


def _countdown_label(value: datetime | None, *, now: datetime | None = None) -> str:
    if value is None:
        return "OPEN"
    current = now or datetime.now()
    if value <= current:
        return "CLOSED"
    delta = value - current
    total_seconds = int(delta.total_seconds())
    days, remainder = divmod(total_seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, _seconds = divmod(remainder, 60)
    if days:
        return f"{days}d {hours}h"
    if hours:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def _venue_code(name: str) -> str:
    cleaned = "".join(ch for ch in name.upper() if ch.isalnum())
    return cleaned[:6].ljust(6)


class AlertDetailScreen(ModalScreen[None]):
    """Dense modal detail screen for one selected alert."""

    DEFAULT_CSS = """
    AlertDetailScreen {
        align: center middle;
        background: #0b1018 86%;
    }

    #alert-detail-box {
        width: 96%;
        height: 92%;
        background: #0d1117;
        border: round #ffb000;
        border-title-color: #ffb000;
        border-title-style: bold;
        border-title-align: left;
        border-subtitle-color: #7d8590;
        border-subtitle-align: right;
        padding: 1 2;
    }

    #alert-detail-header {
        height: 5;
        margin-bottom: 1;
        padding: 0 1;
        background: #111318;
        color: #c9d1d9;
    }

    #alert-detail-body {
        height: 1fr;
    }

    #alert-detail-scroll {
        height: 1fr;
        overflow-y: auto;
        padding-right: 1;
    }

    .detail-row {
        height: auto;
        margin-bottom: 1;
    }

    .detail-panel {
        height: auto;
        border: round #2a2f37;
        background: #111318;
        padding: 0 1;
        color: #c9d1d9;
    }

    .detail-panel > Static {
        height: auto;
    }

    #overview-panel {
        width: 1fr;
        margin-right: 1;
    }

    #timing-panel {
        width: 1fr;
    }

    #synth-panel {
        width: 1fr;
        margin-right: 1;
    }

    #notes-panel {
        width: 1fr;
    }

    #book-panel {
        height: auto;
        min-height: 12;
    }

    #book-content {
        color: #c9d1d9;
    }

    #alert-detail-footer {
        height: 1;
        margin-top: 1;
        text-align: center;
        color: #7d8590;
    }
    """

    BINDINGS = [
        Binding("escape", "close", "Close"),
        Binding("enter", "close", "Close", key_display="↵"),
        Binding("q", "close", "Close"),
    ]

    def __init__(self, detail: AlertDetail) -> None:
        super().__init__()
        self._detail = detail

    def compose(self) -> ComposeResult:
        with Vertical(id="alert-detail-box"):
            yield Static("", id="alert-detail-header")
            with Vertical(id="alert-detail-body"):
                with VerticalScroll(id="alert-detail-scroll"):
                    with Horizontal(classes="detail-row"):
                        with Vertical(id="overview-panel", classes="detail-panel"):
                            yield Static("", id="overview-content")
                        with Vertical(id="timing-panel", classes="detail-panel"):
                            yield Static("", id="timing-content")
                    with Horizontal(classes="detail-row"):
                        with Vertical(id="synth-panel", classes="detail-panel"):
                            yield Static("", id="synth-content")
                        with Vertical(id="notes-panel", classes="detail-panel"):
                            yield Static("", id="notes-content")
                    with Vertical(id="book-panel", classes="detail-panel"):
                        yield Static("", id="book-content")
            yield Static(
                "[#7d8590]Esc/Enter close · return to alert board[/]",
                id="alert-detail-footer",
            )

    def on_mount(self) -> None:
        box = self.query_one("#alert-detail-box")
        box.border_title = f" ALERT DETAIL · #{self._detail.alert_id} "
        box.border_subtitle = (
            f" {self._detail.exchange_count} venue(s) · {self._detail.market_count} market(s) "
        )
        self.query_one("#alert-detail-header", Static).update(
            self._build_header_markup()
        )
        self.query_one("#overview-panel").border_title = " Overview "
        self.query_one("#timing-panel").border_title = " Timing "
        self.query_one("#synth-panel").border_title = " Synthetic Position "
        self.query_one("#notes-panel").border_title = " Notes "
        self.query_one("#book-panel").border_title = " Venue Book "
        self.query_one("#overview-content", Static).update(self._build_overview_markup())
        self.query_one("#timing-content", Static).update(self._build_timing_markup())
        self.query_one("#synth-content", Static).update(self._build_synth_markup())
        self.query_one("#notes-content", Static).update(self._build_notes_markup())
        self.query_one("#book-content", Static).update(self._build_book_markup())

    def action_close(self) -> None:
        self.dismiss(None)

    def _build_header_markup(self) -> str:
        pct = self._detail.profit_margin_percent
        return (
            f"[bold #ffb000]ALERT[/] [bold #f0f6fc]#{self._detail.alert_id}[/]  "
            f"[#7d8590]STATUS[/] [bold #3fb950]{self._detail.status.upper()}[/]  "
            f"[#7d8590]EDGE[/] [bold {_margin_color(pct)}]{pct:.2f}%[/]\n"
            f"[bold #f0f6fc]{self._detail.event_title}[/]\n"
            f"[#7d8590]CATEGORY[/] [#c9d1d9]{(self._detail.category or 'uncategorized').upper()}[/]  "
            f"[#7d8590]CLOSE[/] [#c9d1d9]{_date_short(self._detail.close_time)}[/]  "
            f"[#7d8590]COUNTDOWN[/] [bold #ffb000]{_countdown_label(self._detail.close_time)}[/]"
        )

    def _build_overview_markup(self) -> str:
        detail = self._detail
        return "\n".join(
            [
                (
                    f"[#7d8590]EVENT[/] [#f0f6fc]{detail.event_id}[/]   "
                    f"[#7d8590]MAP[/] [#f0f6fc]{detail.mapping_id}[/]"
                ),
                (
                    f"[#7d8590]CATEGORY[/] "
                    f"[#f0f6fc]{(detail.category or 'uncategorized').upper()}[/]"
                ),
                (
                    f"[#7d8590]VENUES[/] [#f0f6fc]{detail.exchange_count}[/]   "
                    f"[#7d8590]MARKETS[/] [#f0f6fc]{detail.market_count}[/]"
                ),
                (
                    f"[#7d8590]EDGE[/] "
                    f"[bold {_margin_color(detail.profit_margin_percent)}]"
                    f"{_fmt_pct(detail.profit_margin_percent)}[/]"
                ),
            ]
        )

    def _build_timing_markup(self) -> str:
        detail = self._detail
        now = datetime.now()
        return "\n".join(
            [
                f"[#7d8590]DETECTED[/] [#f0f6fc]{_ts_full(detail.detected_at)}[/]",
                f"[#7d8590]ALERT AGE[/] [#f0f6fc]{_age_label(detail.detected_at, now=now)}[/]",
                f"[#7d8590]LATEST PX[/] [#f0f6fc]{_ts_full(detail.latest_snapshot_at)}[/]",
                f"[#7d8590]MAP CREATED[/] [#f0f6fc]{_ts_full(detail.mapping_created_at)}[/]",
                f"[#7d8590]CLOSE DATE[/] [#f0f6fc]{_date_short(detail.close_time)}[/]",
                f"[#7d8590]COUNTDOWN[/] [bold #ffb000]{_countdown_label(detail.close_time)}[/]",
            ]
        )

    def _build_synth_markup(self) -> str:
        detail = self._detail
        best_yes = detail.best_yes_market
        best_no = detail.best_no_market
        edge = detail.synthetic_edge_percent
        if best_yes is None or best_no is None or edge is None:
            return (
                "[#7d8590]SYNTH[/]\n"
                "[#c9d1d9]Incomplete YES/NO pricing across venues.[/]"
            )
        edge_color = _margin_color(edge)
        return "\n".join(
            [
                f"[#7d8590]BEST YES[/] [#f0f6fc]{best_yes.exchange_name}[/]  [bold #58a6ff]{_fmt_price(best_yes.yes_ask)}[/]",
                f"[#7d8590]BEST NO[/] [#f0f6fc]{best_no.exchange_name}[/]  [bold #58a6ff]{_fmt_price(best_no.no_ask)}[/]",
                f"[#7d8590]PAIR COST[/] [bold #f0f6fc]{_fmt_price(detail.synthetic_pair_cost)}[/]",
                f"[#7d8590]SYNTH EDGE[/] [bold {edge_color}]{_fmt_pct(edge)}[/]",
            ]
        )

    def _build_notes_markup(self) -> str:
        notes = self._detail.mapping_notes or "No mapping notes."
        return f"[#c9d1d9]{notes}[/]"

    def _build_book_markup(self) -> str:
        if not self._detail.markets:
            return "[#7d8590]No venue markets mapped to this alert.[/]"

        lines = [
            "[#7d8590]VENUE  YES B/A/L      NO B/A/L       SYNTH   EDGE   TIME      MARKET[/]",
            "[#2a2f37]────────────────────────────────────────────────────────────────────────────────────────────[/]",
        ]
        for market in self._detail.markets:
            edge = (
                market.pair_edge * Decimal("100")
                if market.pair_edge is not None
                else None
            )
            edge_color = _margin_color(edge)
            lines.append(
                f"[bold #ffb000]{_venue_code(market.exchange_name)}[/] "
                f"[#f0f6fc]{_fmt_price(market.yes_bid):>5}/{_fmt_price(market.yes_ask):>5}/{_fmt_price(market.yes_last):>5}[/]  "
                f"[#f0f6fc]{_fmt_price(market.no_bid):>5}/{_fmt_price(market.no_ask):>5}/{_fmt_price(market.no_last):>5}[/]  "
                f"[bold #58a6ff]{_fmt_price(market.pair_cost):>5}[/]  "
                f"[bold {edge_color}]{_fmt_pct(edge):>7}[/]  "
                f"[#7d8590]{_ts(market.freshest_snapshot_time):>8}[/]  "
                f"[#c9d1d9]{market.market_code}[/]"
            )
        return "\n".join(lines)
