import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { AppEnv } from "../env.js";

// Mock @pincerpay/solana/squads before importing the middleware
vi.mock("@pincerpay/solana/squads", () => ({
  checkSpendingLimit: vi.fn(),
}));

// Mock @pincerpay/db to provide a fake agents table and query builder
vi.mock("@pincerpay/db", () => {
  return {
    agents: { id: "id", solanaAddress: "solana_address", merchantId: "merchant_id" },
  };
});

// Mock drizzle-orm operators
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: string, val: string) => ({ col, val, op: "eq" })),
  and: vi.fn((...args: unknown[]) => ({ args, op: "and" })),
}));

import { squadsMiddleware } from "../middleware/squads.js";
import { checkSpendingLimit } from "@pincerpay/solana/squads";

const mockedCheckSpendingLimit = vi.mocked(checkSpendingLimit);

// ─── Helpers ───

/** Build a minimal fake Solana transaction (base64) with a known fee payer. */
function buildFakeSolanaTx(payerBase58: string): string {
  // Decode base58 to 32 bytes for the payer pubkey
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = 0n;
  for (const char of payerBase58) {
    const idx = ALPHABET.indexOf(char);
    if (idx < 0) throw new Error(`Invalid base58 char: ${char}`);
    num = num * 58n + BigInt(idx);
  }
  const payerBytes = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    payerBytes[i] = Number(num & 0xffn);
    num = num >> 8n;
  }

  // Build minimal transaction bytes:
  // [sigCount(1)] [sig(64)] [header(3)] [accountCount(1)] [payerPubkey(32)] [recentBlockhash(32)] [instructionCount(1)]
  const buf = Buffer.alloc(1 + 64 + 3 + 1 + 32 + 32 + 1);
  let offset = 0;

  buf[offset++] = 1; // 1 signature
  // 64 zero bytes for signature placeholder
  offset += 64;

  // Message header
  buf[offset++] = 1; // numRequiredSignatures
  buf[offset++] = 0; // numReadonlySignedAccounts
  buf[offset++] = 0; // numReadonlyUnsignedAccounts

  buf[offset++] = 1; // 1 account
  Buffer.from(payerBytes).copy(buf, offset);
  offset += 32;

  // 32 zero bytes for recent blockhash + 1 byte for 0 instructions
  // (already zero-filled)

  return buf.toString("base64");
}

/** A known test address in base58 */
const TEST_PAYER = "GjsWy1viAxWZkb4VyLVz3oU7sNpvyuKXnRu11uUybNgm";
const TEST_MERCHANT_ID = "merchant-uuid-123";

/** Create a mock database object that returns configured agent rows. */
function createMockDb(agentRows: Record<string, unknown>[]) {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(agentRows),
  };
  return mockDb as unknown;
}

/** Build a Hono test app with Squads middleware + a dummy settle endpoint. */
function createTestApp(
  db: unknown,
  opts?: { rpcUrl?: string },
) {
  const app = new Hono<AppEnv>();

  // Set required context variables (simulates auth middleware)
  app.use("*", async (c, next) => {
    c.set("merchantId", TEST_MERCHANT_ID);
    c.set("apiKeyId", "test-key");
    c.set("requestId", "test-req");
    c.set("logger", {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      child: vi.fn(),
      level: "info",
      silent: vi.fn(),
    });
    await next();
  });

  app.use(
    "/v1/settle",
    squadsMiddleware({
      db: db as any,
      rpcUrl: opts?.rpcUrl ?? "https://api.devnet.solana.com",
    }),
  );

  app.post("/v1/settle", (c) =>
    c.json({ success: true, transaction: "txhash123", network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" }),
  );

  return app;
}

/** Build a JSON request body for a Solana settle call. */
function settleBody(overrides?: {
  amount?: string;
  network?: string;
  txBase64?: string;
}) {
  return JSON.stringify({
    paymentPayload: {
      x402Version: 2,
      scheme: "exact",
      network: overrides?.network ?? "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
      payload: {
        transaction: overrides?.txBase64 ?? buildFakeSolanaTx(TEST_PAYER),
      },
      accepted: {},
    },
    paymentRequirements: {
      scheme: "exact",
      network: overrides?.network ?? "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
      amount: overrides?.amount ?? "1000000",
      payTo: "9aE476sH92Vz7DMPyq5WLPkrKWivxeuTKEFKd2sZZcde",
    },
  });
}

function postSettle(app: Hono<AppEnv>, body: string) {
  return app.request("/v1/settle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

// ─── Tests ───

describe("squadsMiddleware", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("passes through when agent is not found in database (unknown agent)", async () => {
    const db = createMockDb([]); // No matching agent
    const app = createTestApp(db);

    const res = await postSettle(app, settleBody());
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it("passes through for EVM (non-Solana) payments", async () => {
    const db = createMockDb([]); // Doesn't matter, should skip before DB query
    const app = createTestApp(db);

    const res = await postSettle(
      app,
      settleBody({ network: "eip155:84532" }),
    );
    expect(res.status).toBe(200);
  });

  it("passes through for active agent without Smart Account", async () => {
    const db = createMockDb([
      {
        id: "agent-1",
        solanaAddress: TEST_PAYER,
        merchantId: TEST_MERCHANT_ID,
        status: "active",
        smartAccountPda: null,
        maxPerTransaction: null,
      },
    ]);
    const app = createTestApp(db);

    const res = await postSettle(app, settleBody());
    expect(res.status).toBe(200);
  });

  it("returns 403 for revoked agent", async () => {
    const db = createMockDb([
      {
        id: "agent-1",
        solanaAddress: TEST_PAYER,
        merchantId: TEST_MERCHANT_ID,
        status: "revoked",
        smartAccountPda: null,
      },
    ]);
    const app = createTestApp(db);

    const res = await postSettle(app, settleBody());
    expect(res.status).toBe(403);

    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("AGENT_REVOKED");
  });

  it("returns 403 for paused agent", async () => {
    const db = createMockDb([
      {
        id: "agent-1",
        solanaAddress: TEST_PAYER,
        merchantId: TEST_MERCHANT_ID,
        status: "paused",
        smartAccountPda: null,
      },
    ]);
    const app = createTestApp(db);

    const res = await postSettle(app, settleBody());
    expect(res.status).toBe(403);

    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("AGENT_PAUSED");
  });

  it("returns 403 when per-transaction limit is exceeded", async () => {
    const db = createMockDb([
      {
        id: "agent-1",
        solanaAddress: TEST_PAYER,
        merchantId: TEST_MERCHANT_ID,
        status: "active",
        smartAccountPda: "SomeSmartAccountPda",
        maxPerTransaction: "500000", // 0.5 USDC max
      },
    ]);
    const app = createTestApp(db);

    const res = await postSettle(
      app,
      settleBody({ amount: "1000000" }), // 1 USDC requested
    );
    expect(res.status).toBe(403);

    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("PER_TX_LIMIT_EXCEEDED");
  });

  it("returns 403 when on-chain spending limit is exhausted", async () => {
    mockedCheckSpendingLimit.mockResolvedValue({
      exists: true,
      remainingAmount: 100000n, // 0.1 USDC remaining
      period: 1, // Day
      lastReset: 0n,
    });

    const db = createMockDb([
      {
        id: "agent-1",
        solanaAddress: TEST_PAYER,
        merchantId: TEST_MERCHANT_ID,
        status: "active",
        smartAccountPda: "SomeSmartAccountPda",
        maxPerTransaction: null,
      },
    ]);
    const app = createTestApp(db);

    const res = await postSettle(
      app,
      settleBody({ amount: "1000000" }), // 1 USDC requested, only 0.1 remaining
    );
    expect(res.status).toBe(403);

    const body = (await res.json()) as { code: string; remaining: string };
    expect(body.code).toBe("SPENDING_LIMIT_EXHAUSTED");
    expect(body.remaining).toBe("100000");
  });

  it("passes through when on-chain spending limit has sufficient remaining", async () => {
    mockedCheckSpendingLimit.mockResolvedValue({
      exists: true,
      remainingAmount: 5000000n, // 5 USDC remaining
      period: 1,
      lastReset: 0n,
    });

    const db = createMockDb([
      {
        id: "agent-1",
        solanaAddress: TEST_PAYER,
        merchantId: TEST_MERCHANT_ID,
        status: "active",
        smartAccountPda: "SomeSmartAccountPda",
        maxPerTransaction: null,
      },
    ]);
    const app = createTestApp(db);

    const res = await postSettle(
      app,
      settleBody({ amount: "1000000" }), // 1 USDC requested, 5 remaining
    );
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it("passes through when on-chain spending limit account does not exist", async () => {
    mockedCheckSpendingLimit.mockResolvedValue(null);

    const db = createMockDb([
      {
        id: "agent-1",
        solanaAddress: TEST_PAYER,
        merchantId: TEST_MERCHANT_ID,
        status: "active",
        smartAccountPda: "SomeSmartAccountPda",
        maxPerTransaction: null,
      },
    ]);
    const app = createTestApp(db);

    const res = await postSettle(app, settleBody());
    expect(res.status).toBe(200);
  });

  it("fails open when on-chain check throws an error", async () => {
    mockedCheckSpendingLimit.mockRejectedValue(new Error("RPC timeout"));

    const db = createMockDb([
      {
        id: "agent-1",
        solanaAddress: TEST_PAYER,
        merchantId: TEST_MERCHANT_ID,
        status: "active",
        smartAccountPda: "SomeSmartAccountPda",
        maxPerTransaction: null,
      },
    ]);
    const app = createTestApp(db);

    const res = await postSettle(app, settleBody());
    // Should still pass through (fail open)
    expect(res.status).toBe(200);
  });

  it("passes through when request body is not valid JSON", async () => {
    const db = createMockDb([]);
    const app = createTestApp(db);

    const res = await app.request("/v1/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-valid-json{",
    });
    // Middleware should pass through; route handler will deal with it
    expect(res.status).toBe(200);
  });

  it("passes through when paymentPayload has no transaction", async () => {
    const db = createMockDb([]);
    const app = createTestApp(db);

    const res = await app.request("/v1/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentPayload: { payload: {} },
        paymentRequirements: {
          network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
          amount: "1000000",
        },
      }),
    });
    expect(res.status).toBe(200);
  });
});
