from __future__ import annotations

import sqlite3
import tempfile
import unittest
from pathlib import Path

from backend.utils.db import initialize_database


class DatabaseSchemaTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tempdir.name) / "test.sqlite"
        initialize_database(self.db_path, with_seed=True)
        self.connection = sqlite3.connect(self.db_path)
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA foreign_keys = ON;")

    def tearDown(self) -> None:
        self.connection.close()
        self.tempdir.cleanup()

    def test_tables_are_created(self) -> None:
        names = {
            row["name"]
            for row in self.connection.execute(
                "SELECT name FROM sqlite_master WHERE type IN ('table', 'view')"
            )
        }
        self.assertTrue({"Exchange", "Event", "Market", "Contract", "PriceSnapshot", "ArbitrageAlert"}.issubset(names))
        self.assertIn("ActiveArbitrageAlerts", names)

    def test_seed_data_loaded(self) -> None:
        exchange_count = self.connection.execute("SELECT COUNT(*) FROM Exchange").fetchone()[0]
        market_count = self.connection.execute("SELECT COUNT(*) FROM Market").fetchone()[0]
        self.assertGreaterEqual(exchange_count, 3)
        self.assertGreaterEqual(market_count, 6)

    def test_foreign_key_integrity(self) -> None:
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                """
                INSERT INTO Market (Exchange_id, Event_id, Mapping_id, Exchange_market_code)
                VALUES (?, ?, ?, ?)
                """,
                (999, 1, 1, "bad-exchange"),
            )

    def test_unique_constraints(self) -> None:
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "INSERT INTO Exchange (Name, API_base_url) VALUES (?, ?)",
                ("Manifold Markets", "https://duplicate.example"),
            )

        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "INSERT INTO Contract (Market_id, Outcome_label) VALUES (?, ?)",
                (1, "YES"),
            )

    def test_binary_market_cascades_on_delete(self) -> None:
        self.connection.execute(
            """
            INSERT INTO Market (Market_id, Exchange_id, Event_id, Mapping_id, Exchange_market_code)
            VALUES (?, ?, ?, ?, ?)
            """,
            (999, 1, 1, 1, "binary-cascade-test"),
        )
        self.connection.execute(
            "INSERT INTO BinaryMarket (Market_id, Yes_label, No_label) VALUES (?, ?, ?)",
            (999, "YES", "NO"),
        )

        self.connection.execute("DELETE FROM Market WHERE Market_id = 999")
        binary = self.connection.execute("SELECT * FROM BinaryMarket WHERE Market_id = 999").fetchone()
        self.assertIsNone(binary)

    def test_price_snapshots_cascade_on_contract_delete(self) -> None:
        self.connection.execute("DELETE FROM Contract WHERE Contract_id = 1")
        snapshot = self.connection.execute(
            "SELECT * FROM PriceSnapshot WHERE Contract_id = 1"
        ).fetchone()
        self.assertIsNone(snapshot)


if __name__ == "__main__":
    unittest.main()
