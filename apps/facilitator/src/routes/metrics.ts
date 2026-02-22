import { Hono } from "hono";
import type { Metrics } from "../metrics.js";

export function createMetricsRoute(metrics: Metrics) {
  const app = new Hono();

  app.get("/metrics", (c) => {
    return c.json(metrics.snapshot());
  });

  return app;
}
