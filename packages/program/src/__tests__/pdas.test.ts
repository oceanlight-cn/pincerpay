import { describe, it, expect } from "vitest";
import {
  deriveConfigPda,
  deriveMerchantPda,
  deriveSettlementPda,
  uuidToBytes,
  stringTo32Bytes,
  txHashToBytes,
  PINCERPAY_PROGRAM_ID,
} from "../pdas.js";

describe("PDA derivation", () => {
  it("derives config PDA deterministically", async () => {
    const [pda1, bump1] = await deriveConfigPda();
    const [pda2, bump2] = await deriveConfigPda();
    expect(pda1).toBe(pda2);
    expect(bump1).toBe(bump2);
    expect(typeof pda1).toBe("string");
    expect(pda1.length).toBeGreaterThan(30);
  });

  it("derives merchant PDA from UUID", async () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const [pda1] = await deriveMerchantPda(uuid);
    const [pda2] = await deriveMerchantPda(uuid);
    expect(pda1).toBe(pda2);

    // Different UUID → different PDA
    const [pda3] = await deriveMerchantPda("660e8400-e29b-41d4-a716-446655440000");
    expect(pda3).not.toBe(pda1);
  });

  it("derives settlement PDA from nonce", async () => {
    const [pda0] = await deriveSettlementPda(0n);
    const [pda1] = await deriveSettlementPda(1n);
    const [pda0Again] = await deriveSettlementPda(0n);

    expect(pda0).toBe(pda0Again);
    expect(pda0).not.toBe(pda1);
  });

  it("config, merchant, and settlement PDAs are all distinct", async () => {
    const [configPda] = await deriveConfigPda();
    const [merchantPda] = await deriveMerchantPda("550e8400-e29b-41d4-a716-446655440000");
    const [settlementPda] = await deriveSettlementPda(0n);

    expect(configPda).not.toBe(merchantPda);
    expect(configPda).not.toBe(settlementPda);
    expect(merchantPda).not.toBe(settlementPda);
  });
});

describe("uuidToBytes", () => {
  it("converts UUID string to 16-byte array", () => {
    const bytes = uuidToBytes("550e8400-e29b-41d4-a716-446655440000");
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(16);
    expect(bytes[0]).toBe(0x55);
    expect(bytes[1]).toBe(0x0e);
  });

  it("throws on invalid UUID", () => {
    expect(() => uuidToBytes("not-a-uuid")).toThrow("Invalid UUID");
  });
});

describe("stringTo32Bytes", () => {
  it("pads short strings with zeros", () => {
    const bytes = stringTo32Bytes("Test");
    expect(bytes.length).toBe(32);
    expect(bytes[0]).toBe(84); // 'T'
    expect(bytes[4]).toBe(0);  // padding
  });

  it("truncates long strings to 32 bytes", () => {
    const long = "a".repeat(100);
    const bytes = stringTo32Bytes(long);
    expect(bytes.length).toBe(32);
  });
});

describe("txHashToBytes", () => {
  it("converts tx hash to 64-byte array", () => {
    const hash = "abc123def456";
    const bytes = txHashToBytes(hash);
    expect(bytes.length).toBe(64);
    expect(bytes[0]).toBe(97); // 'a'
  });
});
