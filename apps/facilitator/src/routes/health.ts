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
  /** Returns true when the server is draining (SIGTERM received) */
  isShuttingDown?: () => boolean;
  /** OFAC compliance provider info */
  compliance?: {
    provider: {
      name: string;
      isReady: () => boolean;
      getStats: () => { addressCount: number; lastRefresh: Date | null };
    };
  };
}

export function createHealthRoute(options: HealthOptions) {
  const { db, workers } = options;
  const app = new Hono();

  app.get("/health", async (c) => {
    // If shutting down, immediately return 503 so load balancer stops routing
    if (options.isShuttingDown?.()) {
      return c.json(
        {
          status: "shutting_down",
          service: "pincerpay-facilitator",
          timestamp: new Date().toISOString(),
          uptime: Math.floor((Date.now() - startedAt) / 1000),
        },
        503,
      );
    }

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
      ...(options.compliance && {
        compliance: {
          enabled: true,
          provider: options.compliance.provider.name,
          ready: options.compliance.provider.isReady(),
          addressCount: options.compliance.provider.getStats().addressCount,
          lastRefresh: options.compliance.provider.getStats().lastRefresh?.toISOString() ?? null,
        },
      }),
      ...(degradedWorkers.length > 0 && { degradedWorkers }),
    };

    return c.json(response, healthy ? 200 : 503);
  });

  return app;
}
