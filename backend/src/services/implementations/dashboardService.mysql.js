import { getPool } from "../../db/mysql.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * MySQL-backed dashboard summary (not implemented yet).
 * TODO (Phase 5b): Aggregate counts from normalized tables (events, markets, snapshots, alerts).
 * TODO (Phase 6): Materialized views or cached rollups for heavy dashboard queries.
 */
const getDashboardSummary = async () => {
  const pool = getPool();
  if (!pool) {
    throw new ApiError(500, "MySQL pool is unavailable; check USE_MOCK_DATA and DB_* settings");
  }

  // Placeholder: prove the pool works without assuming table names.
  await pool.query("SELECT 1");

  throw new ApiError(
    501,
    "MySQL dashboard summary is not implemented yet — replace this stub once schema is ready"
  );
};

export { getDashboardSummary };
