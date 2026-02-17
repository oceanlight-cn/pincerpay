import { describe, it, expect } from "vitest";
import { PincerPayProgram, deriveConfigPda, deriveMerchantPda, deriveSettlementPda, uuidToBytes, stringTo32Bytes, txHashToBytes, PINCERPAY_PROGRAM_ID } from "@pincerpay/program";

describe("Anchor program client", () => {
  it("derives consistent PDA addresses", async () => {
    const [configPda] = await deriveConfigPda();
    const [merchantPda] = await deriveMerchantPda("550e8400-e29b-41d4-a716-446655440000");
    const [settlementPda] = await deriveSettlementPda(0n);

    expect(typeof configPda).toBe("string");
    expect(typeof merchantPda).toBe("string");
    expect(typeof settlementPda).toBe("string");

    // All PDAs are distinct
    expect(configPda).not.toBe(merchantPda);
    expect(configPda).not.toBe(settlementPda);
    expect(merchantPda).not.toBe(settlementPda);
  });

  it("converts UUID to 16-byte array", () => {
    const bytes = uuidToBytes("550e8400-e29b-41d4-a716-446655440000");
    expect(bytes.length).toBe(16);
    expect(bytes[0]).toBe(0x55);
  });

  it("converts name to 32-byte padded array", () => {
    const bytes = stringTo32Bytes("Test Merchant");
    expect(bytes.length).toBe(32);
    expect(bytes[0]).toBe(84); // 'T'
  });

  it("converts tx hash to 64-byte array", () => {
    const hash = "5jF9z2rR7wN9YqE3Kp8M1tX6cV4bA2sD";
    const bytes = txHashToBytes(hash);
    expect(bytes.length).toBe(64);
    // First char encoded
    expect(bytes[0]).toBe(hash.charCodeAt(0));
  });

  it("getRegisterMerchantAccounts returns correct structure", async () => {
    const rpc = {} as any; // Not used for PDA derivation
    const program = new PincerPayProgram(rpc);

    const result = await program.getRegisterMerchantAccounts({
      merchantId: "550e8400-e29b-41d4-a716-446655440000",
      merchantOwner: "11111111111111111111111111111112" as any,
      merchantUsdcAta: "11111111111111111111111111111113" as any,
      name: "Test Merchant",
    });

    expect(result.accounts.config).toBeDefined();
    expect(result.accounts.merchantAccount).toBeDefined();
    expect(result.args.merchantId.length).toBe(16);
    expect(result.args.name.length).toBe(32);
  });

  it("getRecordX402SettlementAccounts returns correct structure", async () => {
    const rpc = {} as any;
    const program = new PincerPayProgram(rpc);

    const result = await program.getRecordX402SettlementAccounts(
      {
        merchantId: "550e8400-e29b-41d4-a716-446655440000",
        agentAddress: "11111111111111111111111111111112" as any,
        amount: 1000000n,
        x402TxHash: "abc123def456",
      },
      0n,
    );

    expect(result.accounts.config).toBeDefined();
    expect(result.accounts.merchantAccount).toBeDefined();
    expect(result.accounts.settlementRecord).toBeDefined();
    expect(result.args.amount).toBe(1000000n);
    expect(result.args.x402TxHash.length).toBe(64);
  });
});
