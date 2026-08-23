import "dotenv/config";

import { createServer, type Server } from "node:http";

import { createApp } from "./app.js";
import { loadEnvironment } from "./config/env.js";
import { createPrismaClient } from "./lib/prisma.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

function listen(server: Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const handleError = (error: Error): void => {
      reject(error);
    };

    server.once("error", handleError);
    server.listen(port, "0.0.0.0", () => {
      server.off("error", handleError);
      resolve();
    });
  });
}

async function main(): Promise<void> {
  const environment = loadEnvironment();
  const prisma = createPrismaClient(environment.DATABASE_URL);
  const app = createApp(prisma);
  const server = createServer(app);
  let isShuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.info(`Received ${signal}; shutting down gracefully.`);

    const forceExitTimer = setTimeout(() => {
      console.error("Graceful shutdown timed out.");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error !== undefined) {
            reject(error);
            return;
          }

          resolve();
        });
      });
      await prisma.$disconnect();
      clearTimeout(forceExitTimer);
      console.info("Shutdown complete.");
    } catch (error) {
      clearTimeout(forceExitTimer);
      console.error("Graceful shutdown failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      process.exitCode = 1;
    }
  };

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  try {
    await listen(server, environment.PORT);
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
  console.info(
    `Trusted-authority API listening on port ${environment.PORT} (${environment.NODE_ENV}).`,
  );
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "The API failed to start.",
  );

  process.exitCode = 1;
});
