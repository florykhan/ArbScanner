from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _load_dotenv() -> None:
    """Load simple KEY=VALUE pairs from the repo root .env file if present."""

    repo_root = Path(__file__).resolve().parents[2]
    env_path = repo_root / ".env"

    if not env_path.exists():
        return

    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')

        if key and key not in os.environ:
            os.environ[key] = value


_load_dotenv()


@dataclass(frozen=True)
class DatabaseConfig:
    host: str = "127.0.0.1"
    port: int = 3306
    user: str = "root"
    password: str = ""
    database: str = "ArbScannerDB"
    unix_socket: str | None = None

    @classmethod
    def from_env(cls) -> "DatabaseConfig":
        return cls(
            host=os.getenv("ARBSCANNER_DB_HOST", cls.host),
            port=int(os.getenv("ARBSCANNER_DB_PORT", str(cls.port))),
            user=os.getenv("ARBSCANNER_DB_USER", cls.user),
            password=os.getenv("ARBSCANNER_DB_PASSWORD", cls.password),
            database=os.getenv("ARBSCANNER_DB_NAME", cls.database),
            unix_socket=os.getenv("ARBSCANNER_DB_SOCKET") or None,
        )
