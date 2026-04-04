from __future__ import annotations

import argparse
from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.utils.db import DEFAULT_DB_PATH, initialize_database


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Initialize the ArbScanner SQLite database.")
    parser.add_argument(
        "--db",
        type=Path,
        default=DEFAULT_DB_PATH,
        help="Path to the SQLite database file.",
    )
    parser.add_argument(
        "--with-seed",
        action="store_true",
        help="Load database/seeds/seed.sql after creating the schema.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    db_path = initialize_database(args.db, with_seed=args.with_seed)
    print(f"Initialized database at {db_path}")


if __name__ == "__main__":
    main()
