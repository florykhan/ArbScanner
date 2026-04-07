import app from "./app.js";
import env from "./config/env.js";
import { closePool, verifyConnection } from "./db/mysql.js";

const start = async () => {
  if (!env.useMockData) {
    try {
      await verifyConnection();
      console.log("MySQL: connection check passed");
    } catch (error) {
      console.error("MySQL: connection check failed — set USE_MOCK_DATA=true for mock mode or fix DB_*");
      console.error(error);
      process.exit(1);
    }
  } else {
    console.log("Data source: mock (USE_MOCK_DATA=true)");
  }

  const server = app.listen(env.port, () => {
    console.log(`ArbScanner backend running on port ${env.port} (${env.nodeEnv})`);
  });

  const gracefulShutdown = async (signal) => {
    console.log(`${signal} received. Shutting down server...`);
    await closePool();
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    gracefulShutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    gracefulShutdown("SIGTERM");
  });
};

start();
