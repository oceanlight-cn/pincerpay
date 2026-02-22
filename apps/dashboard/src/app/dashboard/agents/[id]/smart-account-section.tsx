"use client";

import { useState, useTransition } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useSolanaWallet } from "@/lib/solana/wallet-provider";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { buildCreateSmartAccountTx } from "@/lib/solana/squads-tx";
import { buildCreateSmartAccount, confirmSmartAccountCreation } from "./squads-actions";
import { OnChainLimits } from "./on-chain-limits";

interface SmartAccountSectionProps {
  agentId: string;
  agentAddress: string;
  smartAccountPda: string | null;
  spendingLimitPda: string | null;
  spendingLimitIndex: number;
}

export function SmartAccountSection({
  agentId,
  agentAddress,
  smartAccountPda,
  spendingLimitPda,
  spendingLimitIndex,
}: SmartAccountSectionProps) {
  const { publicKey, sendTransaction } = useSolanaWallet();
  const { connection } = useConnection();
  const [isPending, startTransition] = useTransition();
  const [accountIndex, setAccountIndex] = useState("0");
  const [threshold, setThreshold] = useState("1");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleCreate() {
    if (!publicKey || !sendTransaction) {
      setMessage({ type: "error", text: "Connect your wallet first" });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        // 1. Derive PDAs server-side
        const formData = new FormData();
        formData.set("creator", publicKey.toBase58());
        formData.set("accountIndex", accountIndex);
        formData.set("threshold", threshold);

        const result = await buildCreateSmartAccount(agentId, formData);
        if (!result.success || !result.smartAccountPda || !result.settingsPda) {
          setMessage({ type: "error", text: result.error ?? "Failed to derive PDAs" });
          return;
        }

        // 2. Build transaction client-side
        const idx = parseInt(accountIndex, 10);
        const thresh = parseInt(threshold, 10);
        const members = [publicKey.toBase58(), agentAddress];

        const tx = await buildCreateSmartAccountTx({
          creator: publicKey.toBase58(),
          accountIndex: idx,
          members,
          threshold: thresh,
          connection,
        });

        // 3. Sign and send via wallet adapter
        const signature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(signature, "confirmed");

        // 4. Persist PDAs to DB
        const confirm = await confirmSmartAccountCreation(agentId, {
          smartAccountPda: result.smartAccountPda,
          settingsPda: result.settingsPda,
          txSignature: signature,
        });

        if (confirm.success) {
          setMessage({ type: "success", text: `Smart Account created. Tx: ${signature.slice(0, 8)}...` });
        } else {
          setMessage({ type: "error", text: confirm.error ?? "Failed to persist" });
        }
      } catch (err) {
        setMessage({ type: "error", text: err instanceof Error ? err.message : "Transaction failed" });
      }
    });
  }

  if (smartAccountPda) {
    return (
      <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <h3 className="text-sm font-bold mb-3">Squads Smart Account</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">Smart Account PDA</p>
            <p className="font-mono text-xs break-all">{smartAccountPda}</p>
          </div>
          {spendingLimitPda && (
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Spending Limit PDA</p>
              <p className="font-mono text-xs break-all">{spendingLimitPda}</p>
            </div>
          )}
        </div>

        <OnChainLimits
          agentId={agentId}
          agentAddress={agentAddress}
          smartAccountPda={smartAccountPda}
          spendingLimitPda={spendingLimitPda}
          spendingLimitIndex={spendingLimitIndex}
        />
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
      <h3 className="text-sm font-bold mb-2">Squads Smart Account</h3>
      <p className="text-xs text-[var(--muted-foreground)] mb-4">
        Create an on-chain Smart Account for this agent with enforced spending limits via the Squads protocol.
      </p>

      {!publicKey ? (
        <div>
          <p className="text-xs text-[var(--muted-foreground)] mb-2">Connect your wallet to create a Smart Account.</p>
          <WalletConnectButton />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Account Index</label>
              <input
                type="number"
                min="0"
                value={accountIndex}
                onChange={(e) => setAccountIndex(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Threshold</label>
              <input
                type="number"
                min="1"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Members: your wallet + agent ({agentAddress.slice(0, 8)}...)
          </p>
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Smart Account"}
          </button>
        </div>
      )}

      {message && (
        <p className={`mt-2 text-xs ${message.type === "success" ? "text-[var(--success)]" : "text-[var(--destructive)]"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
