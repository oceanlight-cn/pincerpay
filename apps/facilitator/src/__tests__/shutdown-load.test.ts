import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Hono } from "hono";
import { serve, type ServerType } from "@hono/node-server";
import type { AppEnv } from "../env.js";
import { createLogger, loggingMiddleware } from "../middleware/logging.js";

/**
 * Shutdown load test — validates that graceful shutdown under concurrent
 * requests completes cleanly: all in-flight requests finish (200) or get
 * a clean rejection (503), none hang, and exit happens within timeout.
 *
 * Approach: spin up a minimal Hono app with the same shutdown logic as
 * the real facilitator (drain middleware, health 503, SIGTERM handler),
 * then fire concurrent requests and trigger shutdown mid-flight.
 */

// ─── Test Server Factory ───

function createTestServer() {
  const logger = createLogger("warn");
  let shuttingDown = false;
  let inFlightCount = 0;
  const settledRequests: Array<{ status: number; startedAt: number; endedAt: number }> = [];

  const app = new Hono<AppEnv>();
  app.use("*", loggingMiddleware(logger));

  // Health route — returns 503 during drain
  app.get("/health", (c) => {
    if (shuttingDown) {
      return c.json({ status: "shutting_down" }, 503);
    }
    return c.json({ status: "ok", inFlight: inFlightCount }, 200);
  });

  // Drain-reject middleware for settlement routes
  app.use("/v1/*", async (c, next) => {
    if (shuttingDown) {
      c.header("Retry-After", "1");
      return c.json({ error: "Service is shutting down" }, 503);
    }
    return next();
  });

  // Simulate /v1/settle with a configurable delay (simulates RPC call)
  app.post("/v1/settle", async (c) => {
    inFlightCount++;
    const startedAt = Date.now();
    try {
      // Simulate settlement work (50-200ms)
      const delay = 50 + Math.random() * 150;
      await new Promise((resolve) => setTimeout(resolve, delay));
      const endedAt = Date.now();
      settledRequests.push({ status: 200, startedAt, endedAt });
      return c.json({ success: true, transaction: `tx_${Date.now()}` });
    } finally {
      inFlightCount--;
    }
  });

  return {
    app,
    setShuttingDown: () => { shuttingDown = true; },
    isShuttingDown: () => shuttingDown,
    getInFlightCount: () => inFlightCount,
    getSettledRequests: () => settledRequests,
  };
}

// ─── Tests ───

describe("Graceful shutdown under load", () => {
  let server: ServerType;
  let port: number;
  let testServer: ReturnType<typeof createTestServer>;

  beforeAll(async () => {
    testServer = createTestServer();
    // Use port 0 for random available port
    port = 0;
    server = serve({ fetch: testServer.app.fetch, port: 0 }, (info) => {
      port = info.port;
    });
    // Wait for server to bind
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    server.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("health returns 200 before shutdown", async () => {
    const res = await fetch(`http://localhost:${port}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("health returns 503 after shutdown signal", async () => {
    testServer.setShuttingDown();
    const res = await fetch(`http://localhost:${port}/health`);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("shutting_down");
  });
});

describe("Concurrent requests + shutdown", () => {
  let server: ServerType;
  let port: number;
  let testServer: ReturnType<typeof createTestServer>;

  beforeAll(async () => {
    testServer = createTestServer();
    server = serve({ fetch: testServer.app.fetch, port: 0 }, (info) => {
      port = info.port;
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    server.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("all 10 concurrent requests complete or get clean 503", async () => {
    const CONCURRENT = 10;
    const results: Array<{ status: number; body: unknown }> = [];

    // Fire 10 concurrent settlement requests
    const requests = Array.from({ length: CONCURRENT }, () =>
      fetch(`http://localhost:${port}/v1/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: "100000" }),
      })
    );

    // Send shutdown signal after 50ms (some requests will be in-flight)
    const shutdownDelay = new Promise<void>((resolve) => {
      setTimeout(() => {
        testServer.setShuttingDown();
        resolve();
      }, 50);
    });

    // Wait for all requests + shutdown
    const [responses] = await Promise.all([
      Promise.all(requests),
      shutdownDelay,
    ]);

    for (const res of responses) {
      const body = await res.json();
      results.push({ status: res.status, body });
    }

    // Assert: every request got either 200 (completed) or 503 (rejected)
    for (const result of results) {
      expect([200, 503]).toContain(result.status);
    }

    // Assert: at least some completed successfully (they started before shutdown)
    const successful = results.filter((r) => r.status === 200);
    expect(successful.length).toBeGreaterThan(0);

    // Assert: no requests are still in-flight
    expect(testServer.getInFlightCount()).toBe(0);
  });

  it("new requests after shutdown get 503 with Retry-After", async () => {
    // Server is already in shutdown state from previous test
    const res = await fetch(`http://localhost:${port}/v1/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: "100000" }),
    });

    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("1");
    const body = await res.json();
    expect(body.error).toContain("shutting down");
  });
});

describe("Shutdown completes within timeout", () => {
  it("server closes within 5 seconds after shutdown", async () => {
    const testServer = createTestServer();
    const server = serve({ fetch: testServer.app.fetch, port: 0 });

    await new Promise((resolve) => setTimeout(resolve, 100));

    testServer.setShuttingDown();

    const start = Date.now();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });
});
