import { Router } from "express";

import type { PrismaClient } from "../generated/prisma/client.js";

export function createHealthRouter(prisma: PrismaClient): Router {
  const healthRouter = Router();

  healthRouter.get("/", async (_request, response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      response.status(200).json({
        status: "ok",
        database: "reachable",
      });
    } catch {
      response.status(503).json({
        status: "unavailable",
        database: "unreachable",
      });
    }
  });

  return healthRouter;
}
