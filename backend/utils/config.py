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


@dataclass(frozen=True)
class PolymarketConfig:
    gamma_base_url: str = "https://gamma-api.polymarket.com"
    clob_base_url: str = "https://clob.polymarket.com"
    api_key: str | None = None
    api_secret: str | None = None
    api_passphrase: str | None = None
    user_agent: str = "Mozilla/5.0 ArbScanner/0.1"

    @classmethod
    def from_env(cls) -> "PolymarketConfig":
        return cls(
            gamma_base_url=os.getenv("POLYMARKET_GAMMA_BASE_URL", cls.gamma_base_url),
            clob_base_url=os.getenv("POLYMARKET_CLOB_BASE_URL", cls.clob_base_url),
            api_key=os.getenv("POLYMARKET_API_KEY") or os.getenv("apiKey"),
            api_secret=os.getenv("POLYMARKET_API_SECRET") or os.getenv("secret"),
            api_passphrase=os.getenv("POLYMARKET_API_PASSPHRASE") or os.getenv("passphrase"),
            user_agent=os.getenv("POLYMARKET_USER_AGENT", cls.user_agent),
        )


@dataclass(frozen=True)
class ManifoldConfig:
    api_base_url: str = "https://api.manifold.markets/v0"
    user_agent: str = "Mozilla/5.0 ArbScanner/0.1"

    @classmethod
    def from_env(cls) -> "ManifoldConfig":
        return cls(
            api_base_url=os.getenv("MANIFOLD_API_BASE_URL", cls.api_base_url),
            user_agent=os.getenv("MANIFOLD_USER_AGENT", cls.user_agent),
        )


@dataclass(frozen=True)
class KalshiConfig:
    api_base_url: str = "https://api.elections.kalshi.com/trade-api/v2"
    user_agent: str = "Mozilla/5.0 ArbScanner/0.1"

    @classmethod
    def from_env(cls) -> "KalshiConfig":
        return cls(
            api_base_url=os.getenv("KALSHI_API_BASE_URL", cls.api_base_url),
            user_agent=os.getenv("KALSHI_USER_AGENT", cls.user_agent),
        )
