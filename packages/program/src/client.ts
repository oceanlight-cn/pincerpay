import type { Address, Rpc, SolanaRpcApi } from "@solana/kit";
import {
  deriveConfigPda,
  deriveMerchantPda,
  deriveSettlementPda,
  PINCERPAY_PROGRAM_ID,
  uuidToBytes,
  stringTo32Bytes,
  txHashToBytes,
} from "./pdas.js";
import type {
  ProgramConfig,
  MerchantAccount,
  SettlementRecord,
  RegisterMerchantParams,
  SettlePaymentParams,
  RecordX402SettlementParams,
} from "./types.js";

/**
 * TypeScript client for the PincerPay Anchor program.
 *
 * Provides PDA derivation, state fetching, and instruction building.
 * Instruction building returns the account metas + data needed for the caller
 * to construct and sign transactions.
 */
export class PincerPayProgram {
  readonly programId: Address;
  private rpc: Rpc<SolanaRpcApi>;

  constructor(
    rpc: Rpc<SolanaRpcApi>,
    programId: Address = PINCERPAY_PROGRAM_ID,
  ) {
    this.programId = programId;
    this.rpc = rpc;
  }

  // ─── PDA Derivation ───

  async getConfigPda(): Promise<Address> {
    const [pda] = await deriveConfigPda(this.programId);
    return pda;
  }

  async getMerchantPda(merchantId: string): Promise<Address> {
    const [pda] = await deriveMerchantPda(merchantId, this.programId);
    return pda;
  }

  async getSettlementPda(nonce: bigint): Promise<Address> {
    const [pda] = await deriveSettlementPda(nonce, this.programId);
    return pda;
  }

  // ─── Instruction Parameters ───

  /**
   * Build parameters for a register_merchant instruction.
   * Returns the derived accounts + serialized args needed by the caller.
   */
  async getRegisterMerchantAccounts(params: RegisterMerchantParams) {
    const configPda = await this.getConfigPda();
    const merchantPda = await this.getMerchantPda(params.merchantId);
    const merchantIdBytes = uuidToBytes(params.merchantId);
    const nameBytes = stringTo32Bytes(params.name);

    return {
      accounts: {
        config: configPda,
        merchantAccount: merchantPda,
        merchantOwner: params.merchantOwner,
        merchantUsdcAta: params.merchantUsdcAta,
      },
      args: {
        merchantId: merchantIdBytes,
        name: nameBytes,
      },
    };
  }

  /**
   * Build parameters for a settle_payment instruction.
   * Returns the derived accounts needed by the caller.
   */
  async getSettlePaymentAccounts(
    params: SettlePaymentParams,
    currentNonce: bigint,
  ) {
    const configPda = await this.getConfigPda();
    const merchantPda = await this.getMerchantPda(params.merchantId);
    const settlementPda = await this.getSettlementPda(currentNonce);

    return {
      accounts: {
        config: configPda,
        merchantAccount: merchantPda,
        settlementRecord: settlementPda,
        agentUsdcAccount: params.agentUsdcAccount,
        agent: params.agentAddress,
      },
      args: {
        amount: params.amount,
        decimals: params.decimals ?? 6,
      },
    };
  }

  /**
   * Build parameters for a record_x402_settlement instruction.
   * Returns the derived accounts needed by the caller.
   */
  async getRecordX402SettlementAccounts(
    params: RecordX402SettlementParams,
    currentNonce: bigint,
  ) {
    const configPda = await this.getConfigPda();
    const merchantPda = await this.getMerchantPda(params.merchantId);
    const settlementPda = await this.getSettlementPda(currentNonce);
    const x402TxHashBytes = txHashToBytes(params.x402TxHash);

    return {
      accounts: {
        config: configPda,
        merchantAccount: merchantPda,
        settlementRecord: settlementPda,
        agent: params.agentAddress,
      },
      args: {
        amount: params.amount,
        x402TxHash: x402TxHashBytes,
      },
    };
  }
}
