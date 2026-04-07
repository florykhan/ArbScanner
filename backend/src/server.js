import app from "./app.js";
import env from "./config/env.js";

const server = app.listen(env.port, () => {
  // Keep startup logging lightweight and readable during development.
  // This can be replaced with a structured logger in later phases.
  console.log(`ArbScanner backend running on port ${env.port} (${env.nodeEnv})`);
});

const gracefulShutdown = (signal) => {
  console.log(`${signal} received. Shutting down server...`);
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
