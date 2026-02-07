import express from "express";
import cors from "cors";
import { AUTH_TOKEN_KEY } from "./config.js";
import { createAuthRouter } from "./routes/auth.js";
import { createCatalogRouter } from "./routes/catalog.js";
import { createComputeRouter } from "./routes/compute.js";
import { createHealthRouter } from "./routes/health.js";
import { createSessionsRouter } from "./routes/sessions.js";

export function createApp({ secret = AUTH_TOKEN_KEY } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/api", createHealthRouter());
  app.use("/api", createCatalogRouter());
  app.use("/api", createComputeRouter());
  app.use("/api", createAuthRouter({ secret }));
  app.use("/api", createSessionsRouter({ secret }));

  return app;
}

