import { describe, it, expect, beforeEach } from "vitest";
import { PincerPayAgent } from "../client.js";

// Test private key (DO NOT use in production — this is a well-known test key)
const TEST_EVM_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe("PincerPayAgent", () => {
  it("requires at least one wallet key", () => {
    expect(
      () => new PincerPayAgent({ chains: ["base"] }),
    ).toThrow("At least one wallet key");
  });

  it("creates agent with EVM key", () => {
    const agent = new PincerPayAgent({
      chains: ["base-sepolia"],
      evmPrivateKey: TEST_EVM_KEY,
    });
    expect(agent.chains).toEqual(["base-sepolia"]);
    expect(agent.evmAddress).toBeTruthy();
    expect(agent.evmAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("derives correct EVM address", () => {
    const agent = new PincerPayAgent({
      chains: ["base"],
      evmPrivateKey: TEST_EVM_KEY,
    });
    // This is the well-known address for the hardhat account #0
    expect(agent.evmAddress?.toLowerCase()).toBe(
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    );
  });
});

describe("PincerPayAgent spending policies", () => {
  let agent: PincerPayAgent;

  beforeEach(() => {
    agent = new PincerPayAgent({
      chains: ["base"],
      evmPrivateKey: TEST_EVM_KEY,
      policies: [
        {
          maxPerTransaction: "1000000", // 1 USDC
          maxPerDay: "5000000", // 5 USDC
        },
      ],
    });
  });

  it("allows transactions within per-tx limit", () => {
    const result = agent.checkPolicy("500000"); // 0.5 USDC
    expect(result.allowed).toBe(true);
  });

  it("blocks transactions exceeding per-tx limit", () => {
    const result = agent.checkPolicy("1500000"); // 1.5 USDC
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("per-transaction limit");
  });

  it("allows exactly the per-tx limit", () => {
    const result = agent.checkPolicy("1000000"); // 1 USDC
    expect(result.allowed).toBe(true);
  });

  it("tracks daily spending", () => {
    agent.recordSpend("2000000"); // 2 USDC
    agent.recordSpend("2000000"); // 2 USDC (total 4 USDC)

    // 1 USDC more should be allowed (total 5 USDC = limit)
    expect(agent.checkPolicy("1000000").allowed).toBe(true);

    // But 1.5 USDC more would exceed daily (total 5.5 > 5)
    expect(agent.checkPolicy("1500000").allowed).toBe(false);
  });

  it("blocks when daily limit would be exceeded", () => {
    agent.recordSpend("4500000"); // 4.5 USDC

    const result = agent.checkPolicy("600000"); // 0.6 USDC (total 5.1 > 5)
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("daily limit");
  });

  it("allows all transactions with no policies", () => {
    const noPolicyAgent = new PincerPayAgent({
      chains: ["base"],
      evmPrivateKey: TEST_EVM_KEY,
    });

    const result = noPolicyAgent.checkPolicy("999999999999");
    expect(result.allowed).toBe(true);
  });
});
