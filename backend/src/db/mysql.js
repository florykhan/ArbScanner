import mysql from "mysql2/promise";
import env from "../config/env.js";

/**
 * MySQL connection pool (mysql2/promise).
 *
 * When USE_MOCK_DATA=true, the pool is not created — keeps local dev working without a DB.
 * When USE_MOCK_DATA=false, call getPool() before running queries.
 *
 * TODO (Phase 5b+): Point queries at real tables once the MySQL schema migration is finalized.
 * TODO (Phase 6): Optional read replicas / transaction boundaries per use-case.
 */

let pool = null;

const createPoolIfNeeded = () => {
  if (env.useMockData) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  return pool;
};

/** @returns {import("mysql2/promise").Pool | null} */
const getPool = () => createPoolIfNeeded();

/**
 * Verifies connectivity. Safe to call on startup when not in mock mode.
 * TODO (Phase 5b): Expand health checks (privileges, schema version table, etc.).
 */
const verifyConnection = async () => {
  const p = createPoolIfNeeded();
  if (!p) {
    return { ok: true, mode: "mock" };
  }
  await p.query("SELECT 1");
  return { ok: true, mode: "mysql" };
};

const closePool = async () => {
  if (!pool) {
    return;
  }
  await pool.end();
  pool = null;
};

export { closePool, getPool, verifyConnection };
