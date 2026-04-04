from __future__ import annotations

import argparse
from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.services.manifold_ingest import ingest_binary_markets
from backend.utils.db import DEFAULT_DB_PATH


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch Manifold binary markets into the ArbScanner database.")
    parser.add_argument(
        "--db",
        type=Path,
        default=DEFAULT_DB_PATH,
        help="Path to the SQLite database file.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=25,
        help="Number of recent Manifold markets to inspect.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    summary = ingest_binary_markets(args.db, limit=args.limit)
    print(
        "Fetched {fetched} markets, imported {imported} binary markets, skipped {skipped} non-binary markets.".format(
            fetched=summary.fetched,
            imported=summary.imported,
            skipped=summary.skipped_non_binary,
        )
    )


if __name__ == "__main__":
    main()
