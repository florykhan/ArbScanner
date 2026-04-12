"""Run the ArbScanner HTTP API (local dev; production often uses Gunicorn — see `Procfile`)."""

from __future__ import annotations

import os

import uvicorn


def _listen_port() -> int:
    # Render, Fly, Railway, etc. set PORT; keep ARBSCANNER_API_PORT for local overrides.
    raw = os.environ.get("PORT") or os.environ.get("ARBSCANNER_API_PORT", "3001")
    return int(raw)


def _listen_host() -> str:
    explicit = os.environ.get("ARBSCANNER_API_HOST", "").strip()
    if explicit:
        return explicit
    # When PORT is injected by the platform, bind on all interfaces.
    if os.environ.get("PORT"):
        return "0.0.0.0"
    return "127.0.0.1"


def _use_reload() -> bool:
    raw = os.environ.get("ARBSCANNER_API_RELOAD", "")
    if raw:
        return raw.lower() in {"1", "true", "yes"}
    # Avoid reload under platform PORT (e.g. accidental local mimic) unless forced.
    return not bool(os.environ.get("PORT"))


def main() -> None:
    uvicorn.run(
        "backend.api.main:app",
        host=_listen_host(),
        port=_listen_port(),
        reload=_use_reload(),
    )


if __name__ == "__main__":
    main()
