import { Hono } from "hono";
import { sql } from "drizzle-orm";
import type { Database } from "@pincerpay/db";
import type { WorkerStatus } from "../workers/confirmation.js";

const startedAt = Date.now();

interface HealthOptions {
  db: Database;
  /** Kora fee payer address (set when Kora is configured) */
  koraFeePayer?: string;
  workers: {
    confirmation: { getStatus: () => WorkerStatus };
    webhookRetry: { getStatus: () => WorkerStatus };
    onChainRecorder?: { getStatus: () => WorkerStatus };
  };
}

export function createHealthRoute(options: HealthOptions) {
  const { db, workers } = options;
  const app = new Hono();

  app.get("/health", async (c) => {
    // DB connectivity check
    let dbOk = false;
    try {
      await db.execute(sql`SELECT 1`);
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const workerStatuses: Record<string, WorkerStatus> = {
      confirmation: workers.confirmation.getStatus(),
      webhookRetry: workers.webhookRetry.getStatus(),
    };
    if (workers.onChainRecorder) {
      workerStatuses.onChainRecorder = workers.onChainRecorder.getStatus();
    }

    // Any worker with 3+ consecutive errors is degraded
    const degradedWorkers = Object.entries(workerStatuses)
      .filter(([, s]) => s.consecutiveErrors >= 3)
      .map(([name]) => name);

    const healthy = dbOk && degradedWorkers.length === 0;

    const response = {
      status: healthy ? "ok" : "degraded",
      service: "pincerpay-facilitator",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      database: dbOk ? "connected" : "disconnected",
      workers: workerStatuses,
      ...(options.koraFeePayer && {
        kora: { status: "configured", feePayer: options.koraFeePayer },
      }),
      ...(degradedWorkers.length > 0 && { degradedWorkers }),
    };

    return c.json(response, healthy ? 200 : 503);
  });

  return app;
}
