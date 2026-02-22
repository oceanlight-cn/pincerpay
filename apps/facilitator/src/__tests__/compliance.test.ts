import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { OfacSdnProvider } from "../compliance/ofac-sdn.js";
import { complianceMiddleware } from "../compliance/middleware.js";
import type { AppEnv } from "../env.js";

// ─── OfacSdnProvider Tests ───

describe("OfacSdnProvider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks a known SDN address", async () => {
    const sdnText = [
      "Some header text",
      'a]  [NPWMD] [IFSR] [SDGT] [IRGC] [Secondary sanctions risk:]. -1234; DOB 01 Jan 1970; Digital Currency Address - XBT bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh;',
      "other entry",
    ].join("\n");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(sdnText),
    });
    vi.stubGlobal("fetch", mockFetch);

    const provider = new OfacSdnProvider({ url: "https://example.com/sdn.txt" });
    await provider.start();

    expect(provider.isReady()).toBe(true);
    expect(provider.getStats().addressCount).toBeGreaterThan(0);

    const result = await provider.check("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh");
    expect(result.allowed).toBe(false);
    expect(result.matchedList).toBe("OFAC SDN");

    provider.stop();
  });

  it("allows a clean address", async () => {
    const sdnText = 'Digital Currency Address - XBT bc1qsanctioned123;';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(sdnText),
    });
    vi.stubGlobal("fetch", mockFetch);

    const provider = new OfacSdnProvider({ url: "https://example.com/sdn.txt" });
    await provider.start();

    const result = await provider.check("cleanaddress456");
    expect(result.allowed).toBe(true);
    expect(result.matchedList).toBeUndefined();

    provider.stop();
  });

  it("returns allowed when provider is not ready (graceful degradation)", async () => {
    // Don't call start() so provider is never ready
    const provider = new OfacSdnProvider({ url: "https://example.com/sdn.txt" });

    const result = await provider.check("anyaddress");
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("not yet loaded");
  });

  it("handles EVM addresses case-insensitively", async () => {
    const sdnText = 'Digital Currency Address - ETH 0xd882cFc20F52f2599D84b8e8D58C7FB62cfE344b;';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(sdnText),
    });
    vi.stubGlobal("fetch", mockFetch);

    const provider = new OfacSdnProvider({ url: "https://example.com/sdn.txt" });
    await provider.start();

    // Check with different casing
    const result = await provider.check("0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b");
    expect(result.allowed).toBe(false);

    provider.stop();
  });

  it("keeps existing data on refresh failure", async () => {
    const sdnText = 'Digital Currency Address - XBT knownaddress123;';

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(sdnText) })
      .mockRejectedValueOnce(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    const provider = new OfacSdnProvider({
      url: "https://example.com/sdn.txt",
      refreshIntervalMs: 100,
    });
    await provider.start();

    // First load succeeded
    expect(provider.getStats().addressCount).toBeGreaterThan(0);
    const firstRefresh = provider.getStats().lastRefresh;

    // Wait for failed refresh
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Data should still be intact
    expect(provider.getStats().addressCount).toBeGreaterThan(0);
    // lastRefresh unchanged because refresh failed
    expect(provider.getStats().lastRefresh).toEqual(firstRefresh);

    const result = await provider.check("knownaddress123");
    expect(result.allowed).toBe(false);

    provider.stop();
  });

  it("fails open when initial fetch fails", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    const provider = new OfacSdnProvider({ url: "https://example.com/sdn.txt" });
    await provider.start();

    // Provider marks itself ready even on initial failure (fail-open)
    expect(provider.isReady()).toBe(true);
    expect(provider.getStats().addressCount).toBe(0);

    const result = await provider.check("anyaddress");
    expect(result.allowed).toBe(true);

    provider.stop();
  });
});

// ─── Compliance Middleware Tests ───

describe("complianceMiddleware", () => {
  function createTestApp(provider: OfacSdnProvider) {
    const app = new Hono<AppEnv>();

    // Set fake context variables
    app.use("*", async (c, next) => {
      c.set("requestId", "test-request-id");
      c.set("logger", {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      } as unknown as AppEnv["Variables"]["logger"]);
      c.set("merchantId", "test-merchant-id");
      c.set("apiKeyId", "test-api-key-id");
      await next();
    });

    app.use("/v1/settle", complianceMiddleware(provider));
    app.post("/v1/settle", (c) => c.json({ settled: true }));

    return app;
  }

  it("returns 451 for a sanctioned payTo address", async () => {
    const sdnText = 'Digital Currency Address - SOL SanctionedAddress123abc;';

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(sdnText),
    }));

    const provider = new OfacSdnProvider({ url: "https://example.com/sdn.txt" });
    await provider.start();

    const app = createTestApp(provider);

    const res = await app.request("/v1/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentPayload: {},
        paymentRequirements: {
          scheme: "exact",
          network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
          amount: "1000000",
          payTo: "SanctionedAddress123abc",
        },
      }),
    });

    expect(res.status).toBe(451);
    const body = await res.json() as { code: string };
    expect(body.code).toBe("SANCTIONED_ADDRESS");

    provider.stop();
  });

  it("allows a clean payTo address", async () => {
    const sdnText = 'Digital Currency Address - SOL DifferentAddress;';

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(sdnText),
    }));

    const provider = new OfacSdnProvider({ url: "https://example.com/sdn.txt" });
    await provider.start();

    const app = createTestApp(provider);

    const res = await app.request("/v1/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentPayload: {},
        paymentRequirements: {
          scheme: "exact",
          network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
          amount: "1000000",
          payTo: "CleanMerchantAddress456",
        },
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { settled: boolean };
    expect(body.settled).toBe(true);

    provider.stop();
  });

  it("passes through when provider is not ready", async () => {
    // Provider never started, not ready
    const provider = new OfacSdnProvider({ url: "https://example.com/sdn.txt" });

    const app = createTestApp(provider);

    const res = await app.request("/v1/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentPayload: {},
        paymentRequirements: {
          scheme: "exact",
          network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
          amount: "1000000",
          payTo: "AnyAddress",
        },
      }),
    });

    expect(res.status).toBe(200);
  });

  it("passes through on malformed request body", async () => {
    const sdnText = 'Digital Currency Address - SOL SomeAddress;';

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(sdnText),
    }));

    const provider = new OfacSdnProvider({ url: "https://example.com/sdn.txt" });
    await provider.start();

    const app = createTestApp(provider);

    const res = await app.request("/v1/settle", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "not json",
    });

    // Should pass through to the route handler (which may then return its own error)
    expect(res.status).toBe(200);

    provider.stop();
  });
});
