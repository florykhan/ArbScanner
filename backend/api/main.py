from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector import errors as mysql_errors

from backend.services.alert_service import AlertService
from backend.services.dashboard_service import DashboardService
from backend.services.event_catalog_service import EventCatalogService
from backend.utils.cors_origins import build_cors_allow_origins
from backend.utils.db import connect_db

app = FastAPI(title="ArbScanner API", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=build_cors_allow_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    """Lightweight root for load balancers; use `/api/health` for deep checks."""
    return {"service": "ArbScanner API", "health": "/api/health"}


def _jsonable_decimal(value: Decimal | None) -> float | None:
    if value is None:
        return None
    return float(value)


def _iso_datetime(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat(sep=" ", timespec="seconds")
    if isinstance(value, date):
        return value.isoformat()
    return str(value)


def _serialize_alert_row(row: Any) -> dict[str, Any]:
    from backend.models.alert_view import AlertRow

    assert isinstance(row, AlertRow)
    return {
        "alert_id": row.alert_id,
        "event_id": row.event_id,
        "event_title": row.event_title,
        "mapped_exchanges": row.mapped_exchanges,
        "profit_margin": float(row.profit_margin),
        "profit_percent": float(row.profit_margin_percent),
        "status": row.status,
        "detected_at": row.detected_at.isoformat() if row.detected_at else None,
    }


def get_connection():
    """Yield a single MySQL connection; map connection failures to HTTP 503 with a clear message."""
    try:
        connection = connect_db()
    except mysql_errors.Error as exc:
        errno = getattr(exc, "errno", None)
        hint = ""
        if errno == 1045:
            hint = (
                " For error 1045, verify `ARBSCANNER_DB_USER` and `ARBSCANNER_DB_PASSWORD` "
                "in the **repository root** `.env` (same folder as `requirements.txt`). "
                "If the message says `using password: NO`, the API did not receive a password—"
                "set `ARBSCANNER_DB_PASSWORD` to your MySQL user's password (or the correct "
                "non-root user) and restart `python3 -m backend.run_api`."
            )
        elif errno in (2003, 2002):
            hint = (
                " Cannot reach MySQL (network). For a remote host (e.g. Render MySQL), "
                "confirm `ARBSCANNER_DB_HOST` / `ARBSCANNER_DB_PORT`, security groups / "
                "allowed hosts, and use the internal database hostname when both services "
                "are on the same Render account. Use `ARBSCANNER_DB_SSL_DISABLED=true` only "
                "for servers without TLS (typical local); omit it for managed SSL."
            )
        else:
            hint = ""
        raise HTTPException(
            status_code=503,
            detail=(
                "Cannot connect to MySQL. Check `ARBSCANNER_DB_HOST`, `ARBSCANNER_DB_PORT`, "
                "`ARBSCANNER_DB_USER`, `ARBSCANNER_DB_PASSWORD`, and `ARBSCANNER_DB_NAME` "
                "(and optional `ARBSCANNER_DB_SOCKET` for local socket installs). "
                "Locally: ensure the server is running (`brew services start mysql`, Docker, etc.). "
                f"On a host like Render: use the internal database hostname when both services "
                f"run on the same account.{hint} Underlying error: {exc}"
            ),
        ) from exc
    try:
        yield connection
    finally:
        try:
            connection.close()
        except Exception:
            pass


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/meta")
def meta(connection: Any = Depends(get_connection)) -> dict[str, Any]:
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) AS n FROM Exchange")
        exchange_count = int((cursor.fetchone() or {}).get("n") or 0)
        cursor.execute("SELECT COUNT(*) AS n FROM Event")
        event_count = int((cursor.fetchone() or {}).get("n") or 0)
        cursor.execute("SELECT COUNT(*) AS n FROM Market")
        market_count = int((cursor.fetchone() or {}).get("n") or 0)
        cursor.execute("SELECT COUNT(*) AS n FROM Contract")
        contract_count = int((cursor.fetchone() or {}).get("n") or 0)
        cursor.execute("SELECT COUNT(*) AS n FROM PriceSnapshot")
        snapshot_count = int((cursor.fetchone() or {}).get("n") or 0)
        cursor.execute("SELECT COUNT(*) AS n FROM ArbitrageAlert WHERE Status = 'Active'")
        active_alerts = int((cursor.fetchone() or {}).get("n") or 0)
    finally:
        cursor.close()
    return {
        "exchange_count": exchange_count,
        "event_count": event_count,
        "market_count": market_count,
        "contract_count": contract_count,
        "snapshot_count": snapshot_count,
        "active_alert_count": active_alerts,
    }


@app.get("/api/exchanges")
def list_exchanges(connection: Any = Depends(get_connection)) -> list[dict[str, Any]]:
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT Exchange_id AS exchange_id, Name AS name, API_base_url AS api_base_url "
            "FROM Exchange ORDER BY Name"
        )
        rows = cursor.fetchall() or []
        return [
            {
                "exchange_id": int(r["exchange_id"]),
                "name": str(r["name"]),
                "api_base_url": str(r["api_base_url"]),
            }
            for r in rows
        ]
    finally:
        cursor.close()


@app.get("/api/exchanges/summary")
def exchanges_summary(connection: Any = Depends(get_connection)) -> list[dict[str, Any]]:
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT
                ex.Exchange_id AS exchange_id,
                ex.Name AS name,
                COUNT(m.Market_id) AS market_count
            FROM Exchange ex
            LEFT JOIN Market m ON m.Exchange_id = ex.Exchange_id
            GROUP BY ex.Exchange_id, ex.Name
            ORDER BY market_count DESC, ex.Name ASC
            """
        )
        rows = cursor.fetchall() or []
        return [
            {
                "exchange_id": int(r["exchange_id"]),
                "name": str(r["name"]),
                "market_count": int(r["market_count"] or 0),
            }
            for r in rows
        ]
    finally:
        cursor.close()


@app.get("/api/dashboard/stats")
def dashboard_stats(connection: Any = Depends(get_connection)) -> dict[str, Any]:
    svc = DashboardService()
    stats = svc.load_stats(connection)
    return {
        "active_alert_count": stats.active_alert_count,
        "top_profit_margin": _jsonable_decimal(stats.top_profit_margin),
        "top_profit_percent": (
            float(stats.top_profit_margin * Decimal("100"))
            if stats.top_profit_margin is not None
            else None
        ),
        "latest_detected_at": (
            stats.latest_detected_at.isoformat() if stats.latest_detected_at else None
        ),
        "total_snapshots": stats.total_snapshots,
        "latest_snapshot_at": (
            stats.latest_snapshot_at.isoformat() if stats.latest_snapshot_at else None
        ),
        "scanner_message": stats.scanner_message,
    }


@app.get("/api/dashboard/activity")
def dashboard_activity(
    limit: int = Query(16, ge=1, le=100),
    connection: Any = Depends(get_connection),
) -> list[dict[str, Any]]:
    svc = DashboardService()
    items = svc.list_recent_activity(connection, limit=limit)
    return [
        {
            "occurred_at": item.occurred_at.isoformat(),
            "message": item.message,
            "source": item.source,
        }
        for item in items
    ]


@app.get("/api/alerts")
def list_alerts(
    status: str | None = Query(None, description="Filter: Active, Expired, or omit for all"),
    connection: Any = Depends(get_connection),
) -> list[dict[str, Any]]:
    svc = AlertService()
    rows = svc.list_alerts(connection, status=status)
    return [_serialize_alert_row(r) for r in rows]


@app.post("/api/alerts/{alert_id}/expire")
def expire_alert(alert_id: int, connection: Any = Depends(get_connection)) -> dict[str, str]:
    svc = AlertService()
    svc.dismiss_alert(connection, alert_id)
    return {"status": "ok"}


@app.get("/api/events")
def list_events(connection: Any = Depends(get_connection)) -> list[dict[str, Any]]:
    svc = EventCatalogService()
    rows = svc.list_events(connection)
    now = datetime.now()
    out = []
    for r in rows:
        closed = False
        if r.close_time is not None:
            end = r.close_time
            if type(end) is date:
                end = datetime(end.year, end.month, end.day)
            if isinstance(end, datetime) and end < now:
                closed = True
        out.append(
            {
                "event_id": r.event_id,
                "title": r.title,
                "category": r.category,
                "close_time": _iso_datetime(r.close_time),
                "status": "closed" if closed else "active",
                "market_count": r.market_count,
                "mapping_count": r.mapping_count,
            }
        )
    return out


@app.get("/api/events/{event_id}")
def get_event(event_id: int, connection: Any = Depends(get_connection)) -> dict[str, Any]:
    cat = EventCatalogService()
    header = cat.get_event_header(connection, event_id)
    if not header:
        raise HTTPException(status_code=404, detail="Event not found")
    rows = cat.list_event_market_rows(connection, event_id)
    synthetic = cat.synthetic_yes_no_edge(rows)
    now = datetime.now()
    ct = header.get("close_time")
    closed = False
    if ct is not None:
        if isinstance(ct, datetime):
            closed = ct < now
        elif type(ct) is date:
            closed = datetime(ct.year, ct.month, ct.day) < now.replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        else:
            try:
                closed = datetime.fromisoformat(str(ct).replace("Z", "+00:00")) < now
            except ValueError:
                closed = False
    markets_payload = [
        {
            "exchange_name": m.exchange_name,
            "market_id": m.market_id,
            "exchange_market_code": m.exchange_market_code,
            "outcome_label": m.outcome_label,
            "bid": m.bid,
            "ask": m.ask,
            "last": m.last,
            "spread": m.spread,
            "snapshot_time": m.snapshot_time.isoformat() if m.snapshot_time else None,
        }
        for m in rows
    ]
    return {
        "event_id": int(header["event_id"]),
        "title": str(header["title"]),
        "category": header.get("category"),
        "close_time": _iso_datetime(header.get("close_time")),
        "status": "closed" if closed else "active",
        "markets": markets_payload,
        "synthetic_edge": synthetic,
    }


@app.get("/api/events/{event_id}/yes-price-history")
def event_yes_history(
    event_id: int,
    limit: int = Query(2000, ge=10, le=10000),
    connection: Any = Depends(get_connection),
) -> list[dict[str, Any]]:
    cat = EventCatalogService()
    if not cat.get_event_header(connection, event_id):
        raise HTTPException(status_code=404, detail="Event not found")
    return cat.list_yes_price_points(connection, event_id, limit=limit)


@app.get("/api/home/timeseries")
def home_timeseries(connection: Any = Depends(get_connection)) -> dict[str, Any]:
    return EventCatalogService().home_timeseries(connection)
