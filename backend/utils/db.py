from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator

import mysql.connector

from backend.utils.config import DatabaseConfig


def connect_db(config: DatabaseConfig | None = None) -> Any:
    db_config = config or DatabaseConfig.from_env()
    connection_kwargs = {
        "user": db_config.user,
        "password": db_config.password,
        "database": db_config.database,
    }

    if db_config.unix_socket:
        connection_kwargs["unix_socket"] = db_config.unix_socket
    else:
        connection_kwargs["host"] = db_config.host
        connection_kwargs["port"] = db_config.port

    if db_config.connect_timeout > 0:
        connection_kwargs["connection_timeout"] = db_config.connect_timeout
    if db_config.ssl_disabled is not None:
        connection_kwargs["ssl_disabled"] = db_config.ssl_disabled

    return mysql.connector.connect(**connection_kwargs)


@contextmanager
def db_session(config: DatabaseConfig | None = None) -> Iterator[Any]:
    connection = connect_db(config)
    try:
        yield connection
    finally:
        connection.close()
