"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with wallet adapter
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false },
);

export function WalletConnectButton() {
  return (
    <WalletMultiButton
      style={{
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        borderRadius: "0.5rem",
        fontSize: "0.875rem",
        height: "2.5rem",
        fontFamily: "inherit",
      }}
    />
  );
}
