import { describe, it, expect } from "vitest";
import {
  RoutePaywallConfigSchema,
  PincerPayConfigSchema,
  SpendingPolicySchema,
} from "../types/index.js";

describe("RoutePaywallConfigSchema", () => {
  it("validates a minimal route config", () => {
    const result = RoutePaywallConfigSchema.safeParse({ price: "0.01" });
    expect(result.success).toBe(true);
  });

  it("validates a full route config", () => {
    const result = RoutePaywallConfigSchema.safeParse({
      price: "1.50",
      chain: "base",
      chains: ["base", "polygon"],
      description: "Weather data",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid price format", () => {
    const result = RoutePaywallConfigSchema.safeParse({ price: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects missing price", () => {
    const result = RoutePaywallConfigSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts integer prices", () => {
    const result = RoutePaywallConfigSchema.safeParse({ price: "100" });
    expect(result.success).toBe(true);
  });
});

describe("PincerPayConfigSchema", () => {
  it("validates a complete config", () => {
    const result = PincerPayConfigSchema.safeParse({
      apiKey: "pp_live_abc123",
      merchantAddress: "0x1234",
      routes: {
        "GET /api/weather": { price: "0.01" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty apiKey", () => {
    const result = PincerPayConfigSchema.safeParse({
      apiKey: "",
      merchantAddress: "0x1234",
      routes: {},
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional facilitatorUrl", () => {
    const result = PincerPayConfigSchema.safeParse({
      apiKey: "key",
      merchantAddress: "0x1234",
      facilitatorUrl: "https://custom.facilitator.com",
      routes: {},
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid facilitatorUrl", () => {
    const result = PincerPayConfigSchema.safeParse({
      apiKey: "key",
      merchantAddress: "0x1234",
      facilitatorUrl: "not-a-url",
      routes: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("SpendingPolicySchema", () => {
  it("validates empty policy", () => {
    const result = SpendingPolicySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("validates full policy", () => {
    const result = SpendingPolicySchema.safeParse({
      maxPerTransaction: "1000000",
      maxPerDay: "10000000",
      allowedMerchants: ["0xabc"],
      allowedChains: ["base"],
    });
    expect(result.success).toBe(true);
  });
});
