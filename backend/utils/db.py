from __future__ import annotations

import sqlite3
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = REPO_ROOT / "database" / "arbscanner.sqlite"
SCHEMA_PATH = REPO_ROOT / "database" / "schema" / "schema.sql"
SEED_PATH = REPO_ROOT / "database" / "seeds" / "seed.sql"


def connect(db_path: Path | str = DEFAULT_DB_PATH) -> sqlite3.Connection:
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON;")
    return connection


def load_sql(path: Path | str) -> str:
    return Path(path).read_text(encoding="utf-8")


def initialize_database(
    db_path: Path | str = DEFAULT_DB_PATH,
    *,
    with_seed: bool = False,
) -> Path:
    db_path = Path(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    with connect(db_path) as connection:
        connection.executescript(load_sql(SCHEMA_PATH))
        if with_seed:
            connection.executescript(load_sql(SEED_PATH))

    return db_path
