import { getPool } from "../../db/mysql.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * TODO (Phase 5b): Implement listMarkets with joins across markets, exchanges, contracts.
 */
const listMarkets = async () => {
  const pool = getPool();
  if (!pool) {
    throw new ApiError(500, "MySQL pool is unavailable; check USE_MOCK_DATA and DB_* settings");
  }
  await pool.query("SELECT 1");
  throw new ApiError(501, "MySQL listMarkets is not implemented yet");
};

export { listMarkets };
