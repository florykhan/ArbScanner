import { getPool } from "../../db/mysql.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * TODO (Phase 5b): Implement listContractSnapshots by contract id (time-series rows).
 * TODO (Phase 5b): Implement createPriceSnapshot INSERT (and optional dedupe rules).
 */
const listContractSnapshots = async (_contractId) => {
  const pool = getPool();
  if (!pool) {
    throw new ApiError(500, "MySQL pool is unavailable; check USE_MOCK_DATA and DB_* settings");
  }
  await pool.query("SELECT 1");
  throw new ApiError(501, "MySQL listContractSnapshots is not implemented yet");
};

const createPriceSnapshot = async (_payload) => {
  const pool = getPool();
  if (!pool) {
    throw new ApiError(500, "MySQL pool is unavailable; check USE_MOCK_DATA and DB_* settings");
  }
  await pool.query("SELECT 1");
  throw new ApiError(501, "MySQL createPriceSnapshot is not implemented yet");
};

export { createPriceSnapshot, listContractSnapshots };
