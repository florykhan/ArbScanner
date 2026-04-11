"""Run the ArbScanner HTTP API (default port 3001)."""

from __future__ import annotations

import os

import uvicorn


def main() -> None:
    port = int(os.environ.get("ARBSCANNER_API_PORT", "3001"))
    uvicorn.run(
        "backend.api.main:app",
        host=os.environ.get("ARBSCANNER_API_HOST", "127.0.0.1"),
        port=port,
        reload=os.environ.get("ARBSCANNER_API_RELOAD", "1").lower() in {"1", "true", "yes"},
    )


if __name__ == "__main__":
    main()
