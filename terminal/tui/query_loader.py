"""
Parse the rubric `database/queries/queries.sql` file into labelled
statements so the SQL Inspector can display and execute them one at a
time.

The file groups each demo by a leading `-- comment` block. A "query" is
the block of statements that follows a comment header up to the next
comment header (or end-of-file). This means the multi-statement
transaction demos stay together as a single selectable entry.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List


@dataclass(frozen=True)
class LabeledQuery:
    title: str
    sql: str          # Executable SQL body (may contain multiple `;` statements)
    display: str      # What to show in the UI (preserves original formatting)
    param_count: int  # Number of `?` placeholders across all statements


def load_labeled_queries(path: Path) -> List[LabeledQuery]:
    """Parse `queries.sql` into labelled, executable query blocks."""
    if not path.exists():
        return []

    text = path.read_text(encoding="utf-8")

    queries: list[LabeledQuery] = []
    title_parts: list[str] = []
    body_lines: list[str] = []
    index = 0

    def flush() -> None:
        nonlocal title_parts, body_lines, index

        # Trim trailing blanks from the body.
        while body_lines and not body_lines[-1].strip():
            body_lines.pop()

        if not body_lines:
            title_parts = []
            body_lines = []
            return

        index += 1
        title = " ".join(p.strip() for p in title_parts if p.strip()).strip()
        if not title:
            title = f"Query {index}"

        display = "\n".join(body_lines).strip()
        queries.append(
            LabeledQuery(
                title=title,
                sql=display,
                display=display,
                param_count=display.count("?"),
            )
        )
        title_parts = []
        body_lines = []

    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()

        if stripped.startswith("--"):
            # A comment after a body means a new section has begun.
            if body_lines:
                flush()
            title_parts.append(stripped.lstrip("-").strip())
            continue

        # Non-comment line — part of the current query's body.
        # Preserve blank lines inside a body to keep SQL formatting intact,
        # but skip leading blanks before any body has started.
        if body_lines or stripped:
            body_lines.append(line)

    flush()
    return queries


def split_sql_statements(sql: str) -> list[str]:
    """Split a SQL body on top-level `;` — safe for queries.sql (no embedded `;`).

    Used by the inspector's runner so transaction demos execute one
    statement at a time (mysql.connector needs one statement per execute
    call unless multi=True is enabled).
    """
    statements: list[str] = []
    buf: list[str] = []
    in_single = False
    in_double = False
    in_backtick = False

    for ch in sql:
        if ch == "'" and not in_double and not in_backtick:
            in_single = not in_single
        elif ch == '"' and not in_single and not in_backtick:
            in_double = not in_double
        elif ch == "`" and not in_single and not in_double:
            in_backtick = not in_backtick

        if ch == ";" and not (in_single or in_double or in_backtick):
            chunk = "".join(buf).strip()
            if chunk:
                statements.append(chunk)
            buf = []
        else:
            buf.append(ch)

    tail = "".join(buf).strip()
    if tail:
        statements.append(tail)

    return statements
