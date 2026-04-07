import { getPool } from "../../db/mysql.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * TODO (Phase 5b): Implement listEvents with parameterized SQL + filters (search/category/status).
 * TODO (Phase 5b): Implement getEventById with joins to markets/contracts as needed.
 * TODO (Phase 5b): Implement createEvent INSERT + transaction boundaries.
 */
const listEvents = async (_filters = {}) => {
  const pool = getPool();
  if (!pool) {
    throw new ApiError(500, "MySQL pool is unavailable; check USE_MOCK_DATA and DB_* settings");
  }
  await pool.query("SELECT 1");
  throw new ApiError(501, "MySQL listEvents is not implemented yet");
};

const getEventById = async (_eventId) => {
  const pool = getPool();
  if (!pool) {
    throw new ApiError(500, "MySQL pool is unavailable; check USE_MOCK_DATA and DB_* settings");
  }
  await pool.query("SELECT 1");
  throw new ApiError(501, "MySQL getEventById is not implemented yet");
};

const createEvent = async (_payload) => {
  const pool = getPool();
  if (!pool) {
    throw new ApiError(500, "MySQL pool is unavailable; check USE_MOCK_DATA and DB_* settings");
  }
  await pool.query("SELECT 1");
  throw new ApiError(501, "MySQL createEvent is not implemented yet");
};

export { createEvent, getEventById, listEvents };
