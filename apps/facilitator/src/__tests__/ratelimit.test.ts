import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { rateLimitMiddleware } from "../middleware/ratelimit.js";
import type { AppEnv } from "../env.js";

// Suppress setInterval by mocking timers
beforeEach(() => {
  vi.useFakeTimers();
});

function createTestApp(maxRequests: number, windowMs = 60_000) {
  const app = new Hono<AppEnv>();

  // Set fake apiKeyId for rate limiter key
  app.use("*", async (c, next) => {
    c.set("apiKeyId", "test-key-id");
    await next();
  });

  app.use("*", rateLimitMiddleware(maxRequests, windowMs));
  app.get("/test", (c) => c.json({ ok: true }));

  return app;
}

describe("rateLimitMiddleware", () => {
  it("allows requests within limit", async () => {
    const app = createTestApp(3);

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("3");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("2");
  });

  it("blocks requests exceeding limit", async () => {
    const app = createTestApp(2);

    await app.request("/test"); // 1
    await app.request("/test"); // 2
    const res = await app.request("/test"); // 3 — over limit

    expect(res.status).toBe(429);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("sets rate limit headers", async () => {
    const app = createTestApp(10);

    const res = await app.request("/test");
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("9");
    expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  it("resets after window expires", async () => {
    const app = createTestApp(1, 1000); // 1 req per 1s

    await app.request("/test"); // 1 — OK
    const blocked = await app.request("/test"); // 2 — blocked
    expect(blocked.status).toBe(429);

    // Advance time past the window
    vi.advanceTimersByTime(1500);

    const res = await app.request("/test"); // should be OK again
    expect(res.status).toBe(200);
  });
});
