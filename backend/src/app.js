import express from "express";
import cors from "cors";

import env from "./config/env.js";
import healthRoutes from "./routes/healthRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import snapshotRoutes from "./routes/snapshotRoutes.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Welcome to ArbScanner API"
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/markets", marketRoutes);
app.use("/api", snapshotRoutes);

// TODO (Phase 3): Add real MySQL-backed route handlers and request validation.
// TODO (Phase 4): Add Manifold adapter routes or ingestion endpoints as needed.

app.use(notFound);
app.use(errorHandler);

export default app;
