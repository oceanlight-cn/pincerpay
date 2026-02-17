import type { Address } from "@solana/kit";

/** On-chain ProgramConfig account data */
export interface ProgramConfig {
  authority: Address;
  feeBps: number;
  nonce: bigint;
  bump: number;
}

/** On-chain MerchantAccount data */
export interface MerchantAccount {
  merchantId: Uint8Array;
  owner: Address;
  usdcAta: Address;
  name: Uint8Array;
  active: boolean;
  totalSettled: bigint;
  settlementCount: number;
  bump: number;
}

/** On-chain SettlementRecord data */
export interface SettlementRecord {
  nonce: bigint;
  agent: Address;
  merchant: Address;
  merchantAccount: Address;
  amount: bigint;
  slot: bigint;
  txType: number;
  x402TxHash: Uint8Array;
  timestamp: bigint;
  bump: number;
}

/** Settlement type discriminator */
export const TX_TYPE_DIRECT = 0;
export const TX_TYPE_X402_RECORDED = 1;

/** Parameters for building a register_merchant instruction */
export interface RegisterMerchantParams {
  merchantId: string;
  merchantOwner: Address;
  merchantUsdcAta: Address;
  name: string;
}

/** Parameters for building a settle_payment instruction */
export interface SettlePaymentParams {
  merchantId: string;
  agentAddress: Address;
  agentUsdcAccount: Address;
  amount: bigint;
  decimals?: number;
}

/** Parameters for building a record_x402_settlement instruction */
export interface RecordX402SettlementParams {
  merchantId: string;
  agentAddress: Address;
  amount: bigint;
  x402TxHash: string;
}
