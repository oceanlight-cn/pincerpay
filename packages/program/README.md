# @pincerpay/program

TypeScript client for PincerPay's Solana Anchor program. Handles PDA derivation, account resolution, and instruction building for on-chain settlements.

## Install

```bash
npm install @pincerpay/program
```

## Quick Start

```typescript
import { PincerPayProgram, PINCERPAY_PROGRAM_ID } from "@pincerpay/program";
import { createSolanaRpc } from "@solana/kit";

const rpc = createSolanaRpc("https://api.devnet.solana.com");
const program = new PincerPayProgram(rpc, PINCERPAY_PROGRAM_ID);

// Derive PDAs
const configPda = await program.getConfigPda();
const merchantPda = await program.getMerchantPda("merchant-uuid");
```

## API Reference

### `PincerPayProgram`

```typescript
class PincerPayProgram {
  constructor(rpc: Rpc<SolanaRpcApi>, programId?: Address);

  // PDA derivation
  async getConfigPda(): Promise<Address>;
  async getMerchantPda(merchantId: string): Promise<Address>;
  async getSettlementPda(nonce: bigint): Promise<Address>;

  // Account resolution for instructions
  async getRegisterMerchantAccounts(params: RegisterMerchantParams): Promise<{
    accounts: { config; merchantAccount; merchantOwner; merchantUsdcAta };
    args: { merchantId; name };
  }>;

  async getSettlePaymentAccounts(
    params: SettlePaymentParams,
    currentNonce: bigint
  ): Promise<{
    accounts: { config; merchantAccount; settlementRecord; agentUsdcAccount; agent };
    args: { amount; decimals };
  }>;

  async getRecordX402SettlementAccounts(
    params: RecordX402SettlementParams,
    currentNonce: bigint
  ): Promise<{
    accounts: { config; merchantAccount; settlementRecord; agent };
    args: { amount; x402TxHash };
  }>;
}
```

### PDA Functions

```typescript
async function deriveConfigPda(programId: Address): Promise<[Address, number]>;
async function deriveMerchantPda(merchantId: string, programId: Address): Promise<[Address, number]>;
async function deriveSettlementPda(nonce: bigint, programId: Address): Promise<[Address, number]>;
```

### Data Conversion Utilities

```typescript
function uuidToBytes(uuid: string): Uint8Array;       // UUID → 16 bytes
function stringTo32Bytes(str: string): Uint8Array;     // String → 32 bytes (padded)
function txHashToBytes(hash: string): Uint8Array;      // Tx hash → 64 bytes
```

### Types

```typescript
interface RegisterMerchantParams {
  merchantId: string;
  merchantOwner: Address;
  merchantUsdcAta: Address;
  name: string;
}

interface SettlePaymentParams {
  merchantId: string;
  agentAddress: Address;
  agentUsdcAccount: Address;
  amount: bigint;
  decimals?: number;
}

interface RecordX402SettlementParams {
  merchantId: string;
  agentAddress: Address;
  amount: bigint;
  x402TxHash: string;
}

const TX_TYPE_DIRECT = 0;
const TX_TYPE_X402_RECORDED = 1;
const PINCERPAY_PROGRAM_ID = "E53zfNo9DYxAUCu37bA2NakJMMbzPFszjgB5kPaTMvF3";
```

## Common Patterns

### Register a merchant on-chain

```typescript
const { accounts, args } = await program.getRegisterMerchantAccounts({
  merchantId: "uuid",
  merchantOwner: ownerAddress,
  merchantUsdcAta: usdcAtaAddress,
  name: "My Store",
});

// Build and send the transaction using your preferred signing method
```

### Record an x402 settlement on-chain

```typescript
const configPda = await program.getConfigPda();
// Read current nonce from config account
const { accounts, args } = await program.getRecordX402SettlementAccounts(
  {
    merchantId: "uuid",
    agentAddress: agentPubkey,
    amount: 1_000_000n, // 1 USDC
    x402TxHash: "5abc...",
  },
  currentNonce
);
```

## Anti-Patterns

### Don't hardcode PDA addresses

PDAs are deterministic but depend on program ID and seeds. Always derive them.

```typescript
// Bad
const configPda = "Qa4Vp4kMKD5P8syNrc1ywz7WHiCt4poyykCKR21zLxP";

// Good
const configPda = await program.getConfigPda();
```

### Don't forget nonce management

Settlement PDAs require a monotonically increasing nonce. Always read the current nonce from the config account before creating settlement instructions.
