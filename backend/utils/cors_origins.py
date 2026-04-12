"""Build CORS allowed origins from environment (Vercel frontend + local Vite dev)."""

from __future__ import annotations

import os
from urllib.parse import urlparse


def _origin_only(url: str) -> str:
    """CORS `Origin` is scheme + host (+ port); strip paths if present."""
    u = url.strip().rstrip("/")
    if not u:
        return ""
    parsed = urlparse(u if "://" in u else f"//{u}", scheme="http")
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return u


def build_cors_allow_origins() -> list[str]:
    """Merge local dev defaults with `FRONTEND_URL` and comma-separated extra origins."""
    out: list[str] = []
    seen: set[str] = set()

    def add(origin: str) -> None:
        u = _origin_only(origin)
        if not u or u in seen:
            return
        seen.add(u)
        out.append(u)

    for u in ("http://127.0.0.1:5173", "http://localhost:5173"):
        add(u)

    add(os.getenv("FRONTEND_URL", ""))

    raw = os.getenv("ARBSCANNER_CORS_ORIGINS") or os.getenv("CORS_ORIGINS", "")
    for part in raw.split(","):
        add(part)

    return out


def build_cors_origin_regex() -> str | None:
    """
    Optional regex so multiple origins match (e.g. all Vercel preview URLs).

    Explicit ARBSCANNER_CORS_ORIGIN_REGEX wins. Otherwise, if FRONTEND_URL's host
    ends with `.vercel.app`, allow any `https://*.vercel.app` unless disabled via
    ARBSCANNER_CORS_NO_VERCEL_REGEX=1.
    """
    explicit = os.getenv("ARBSCANNER_CORS_ORIGIN_REGEX", "").strip()
    if explicit:
        return explicit
    if os.getenv("ARBSCANNER_CORS_NO_VERCEL_REGEX", "").lower() in {"1", "true", "yes"}:
        return None
    front = os.getenv("FRONTEND_URL", "").strip()
    if not front:
        return None
    parsed = urlparse(front if "://" in front else f"https://{front}")
    host = (parsed.hostname or "").lower()
    if host.endswith(".vercel.app"):
        return r"https://.*\.vercel\.app"
    return None
