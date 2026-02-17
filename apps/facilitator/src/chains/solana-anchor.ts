import type { Address, Rpc, SolanaRpcApi } from "@solana/kit";
import { createSolanaRpc } from "@solana/kit";
import { PincerPayProgram } from "@pincerpay/program";
import type { Logger } from "../middleware/logging.js";

interface AnchorIntegrationOptions {
  programId: string;
  /** Solana RPC URL for reading program state */
  rpcUrl?: string;
  logger: Logger;
}

interface AnchorIntegration {
  program: PincerPayProgram;
  rpc: Rpc<SolanaRpcApi>;
}

/**
 * Initialize the Anchor program client for on-chain settlement recording.
 */
export function setupAnchorIntegration(options: AnchorIntegrationOptions): AnchorIntegration {
  const { programId, rpcUrl = "https://api.devnet.solana.com", logger } = options;

  const rpc = createSolanaRpc(rpcUrl);
  const program = new PincerPayProgram(rpc, programId as Address);

  logger.info({
    msg: "anchor_integration_initialized",
    programId,
    rpcUrl,
  });

  return { program, rpc };
}

/**
 * Record an off-chain x402 settlement on-chain for audit trail.
 * This is fire-and-forget — failures are logged but don't block the response.
 *
 * The actual recording is deferred to the on-chain-recorder worker for reliability.
 * This function just validates that the merchant is registered on-chain.
 */
export async function checkMerchantOnChain(
  program: PincerPayProgram,
  merchantId: string,
  logger: Logger,
): Promise<string | null> {
  try {
    const merchantPda = await program.getMerchantPda(merchantId);
    return merchantPda;
  } catch (err) {
    logger.debug({
      msg: "merchant_pda_derivation_failed",
      merchantId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
