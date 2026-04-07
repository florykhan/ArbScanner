import express from "express";
import cors from "cors";

import env from "./config/env.js";
import healthRoutes from "./routes/healthRoutes.js";
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

// Future API route modules go here in Phase 2+.
// Example:
// app.use("/api/events", eventRoutes);
// app.use("/api/markets", marketRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
