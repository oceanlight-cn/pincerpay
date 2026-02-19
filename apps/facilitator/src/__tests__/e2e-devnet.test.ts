/**
 * End-to-end tests against a live facilitator deployment.
 *
 * Gated by E2E_FACILITATOR_URL — skipped in CI unless set.
 *
 *   E2E_FACILITATOR_URL=https://facilitator.pincerpay.com pnpm --filter @pincerpay/facilitator test
 */
import { describe, it, expect } from "vitest";

const FACILITATOR_URL = process.env.E2E_FACILITATOR_URL;
const describeE2E = FACILITATOR_URL ? describe : describe.skip;

describeE2E("E2E devnet — live facilitator", () => {
  it("health check returns service info", async () => {
    const res = await fetch(`${FACILITATOR_URL}/health`);
    expect(res.status).toBeLessThanOrEqual(503); // 200 or 503 (degraded)
    const body = await res.json();

    // Core fields (always present)
    expect(body.status).toMatch(/^(ok|degraded)$/);
    expect(body.service).toBe("pincerpay-facilitator");
    expect(body.timestamp).toBeDefined();

    // Enhanced fields (after monitoring deploy)
    if (body.uptime !== undefined) {
      expect(typeof body.uptime).toBe("number");
      expect(body.database).toBeDefined();
      expect(body.workers).toBeDefined();
      expect(body.workers.confirmation).toBeDefined();
      expect(body.workers.webhookRetry).toBeDefined();
    }
  });

  it("supported endpoint returns chain info", async () => {
    const res = await fetch(`${FACILITATOR_URL}/supported`);

    // May require auth on older deployments
    if (!res.ok) {
      expect(res.status).toBe(401);
      return;
    }

    const body = await res.json();
    expect(body.kinds).toBeDefined();
    expect(Array.isArray(body.kinds)).toBe(true);

    const solanaDevnet = body.kinds.find(
      (k: { network: string }) => k.network === "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    );
    expect(solanaDevnet).toBeDefined();
    expect(solanaDevnet.scheme).toBe("exact");
  });

  it("verify rejects without API key", async () => {
    const res = await fetch(`${FACILITATOR_URL}/v1/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it("verify rejects invalid API key", async () => {
    const res = await fetch(`${FACILITATOR_URL}/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "pk_test_invalid_key_12345",
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it("settle rejects without auth", async () => {
    const res = await fetch(`${FACILITATOR_URL}/v1/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it("status rejects without auth", async () => {
    const res = await fetch(`${FACILITATOR_URL}/v1/status/fake-hash`);
    expect(res.status).toBe(401);
  });
});
