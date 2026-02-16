import type { x402Facilitator } from "@x402/core/facilitator";
import { registerExactSvmScheme } from "@x402/svm/exact/facilitator";
import { toFacilitatorSvmSigner } from "@x402/svm";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { base58 } from "@scure/base";
import type { Logger } from "pino";

interface SolanaSetupOptions {
  /** Base58-encoded Solana private key (64 bytes: 32-byte secret + 32-byte public) */
  privateKey: string;
  /** CAIP-2 Solana network IDs to support */
  networks: string[];
  /** Optional custom RPC URLs keyed by CAIP-2 ID */
  rpcUrls?: Record<string, string>;
  logger: Logger;
}

/**
 * Register Solana exact payment scheme on the x402 facilitator.
 * Uses @solana/kit v5 KeyPairSigner + @x402/svm.
 */
export async function setupSolanaFacilitator(
  facilitator: x402Facilitator,
  options: SolanaSetupOptions,
): Promise<void> {
  const { privateKey, networks, rpcUrls, logger } = options;

  // Decode base58 private key to bytes and create KeyPairSigner
  const keyBytes = base58.decode(privateKey);
  const keypairSigner = await createKeyPairSignerFromBytes(keyBytes);

  // Create the facilitator SVM signer with optional RPC config
  const rpcConfig = rpcUrls && Object.keys(rpcUrls).length > 0
    ? { defaultRpcUrl: Object.values(rpcUrls)[0] }
    : undefined;

  const svmSigner = toFacilitatorSvmSigner(keypairSigner, rpcConfig);

  // Register on the facilitator (cast networks to branded CAIP-2 type)
  registerExactSvmScheme(facilitator, {
    signer: svmSigner,
    networks: networks as `${string}:${string}`[],
  });

  logger.info({
    msg: "solana_facilitator_registered",
    networks,
    address: keypairSigner.address,
  });
}
