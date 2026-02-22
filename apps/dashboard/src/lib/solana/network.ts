/** USDC mint addresses per network */
export const USDC_MINTS = {
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
} as const;

/** Squads Smart Account program ID (same on all networks) */
export const SQUADS_PROGRAM_ID = "SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG";

export function getSolanaNetwork(): "devnet" | "mainnet-beta" {
  return (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet") as "devnet" | "mainnet-beta";
}

export function getUsdcMint(network: "devnet" | "mainnet-beta" = getSolanaNetwork()): string {
  return USDC_MINTS[network];
}
