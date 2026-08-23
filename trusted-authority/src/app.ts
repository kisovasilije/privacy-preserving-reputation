import express from "express";

import type { PrismaClient } from "./generated/prisma/client.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { createHealthRouter } from "./routes/health.js";
import { createSharesRouter } from "./routes/shares.js";

export function createApp(prisma: PrismaClient): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("query parser", "simple");
  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }

    next();
  });
  app.use(express.json({ limit: "16kb", strict: true }));

  app.use("/health", createHealthRouter(prisma));
  app.use("/shares", createSharesRouter(prisma));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
