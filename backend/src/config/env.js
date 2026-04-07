import dotenv from "dotenv";

dotenv.config();

/**
 * Data source toggle (Phase 5a):
 * - USE_MOCK_DATA=true (default): all services use in-memory mock data; MySQL pool is not opened.
 * - USE_MOCK_DATA=false: services delegate to MySQL implementations (placeholders until schema/queries land).
 */
const parseBool = (value, defaultValue) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  return String(value).toLowerCase() === "true" || value === "1";
};

const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  useMockData: parseBool(process.env.USE_MOCK_DATA, true),
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    name: process.env.DB_NAME || "arbscanner"
  }
};

export default env;
