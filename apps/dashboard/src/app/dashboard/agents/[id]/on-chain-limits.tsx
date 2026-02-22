"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useSolanaWallet } from "@/lib/solana/wallet-provider";
import { buildAddSpendingLimitTx, buildRemoveSpendingLimitTx, SpendingLimitPeriod } from "@/lib/solana/squads-tx";
import { getUsdcMint } from "@/lib/solana/network";
import {
  buildAddSpendingLimit,
  confirmSpendingLimitCreation,
  fetchSpendingLimitState,
} from "./squads-actions";

const PERIOD_LABELS: Record<number, string> = {
  [SpendingLimitPeriod.OneTime]: "One-time",
  [SpendingLimitPeriod.Day]: "Daily",
  [SpendingLimitPeriod.Week]: "Weekly",
  [SpendingLimitPeriod.Month]: "Monthly",
};

interface OnChainLimitsProps {
  agentId: string;
  agentAddress: string;
  smartAccountPda: string;
  spendingLimitPda: string | null;
  spendingLimitIndex: number;
}

export function OnChainLimits({
  agentId,
  agentAddress,
  smartAccountPda,
  spendingLimitPda,
  spendingLimitIndex,
}: OnChainLimitsProps) {
  const { publicKey, sendTransaction } = useSolanaWallet();
  const { connection } = useConnection();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<SpendingLimitPeriod>(SpendingLimitPeriod.Day);
  const [destinations, setDestinations] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // On-chain state
  const [limitState, setLimitState] = useState<{
    exists: boolean;
    remainingAmount?: string;
    period?: number;
    lastReset?: string;
  } | null>(null);

  const pollState = useCallback(() => {
    if (!spendingLimitPda) return;
    fetchSpendingLimitState(smartAccountPda, spendingLimitIndex).then(setLimitState);
  }, [smartAccountPda, spendingLimitIndex, spendingLimitPda]);

  useEffect(() => {
    pollState();
    const interval = setInterval(pollState, 30_000);
    return () => clearInterval(interval);
  }, [pollState]);

  async function handleAddLimit() {
    if (!publicKey || !sendTransaction) {
      setMessage({ type: "error", text: "Connect your wallet first" });
      return;
    }
    const amountUsdc = parseFloat(amount);
    if (isNaN(amountUsdc) || amountUsdc <= 0) {
      setMessage({ type: "error", text: "Enter a valid amount" });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        // 1. Get the PDA from server
        const formData = new FormData();
        formData.set("spendingLimitIndex", String(spendingLimitIndex));
        const derivation = await buildAddSpendingLimit(agentId, formData);
        if (!derivation.success || !derivation.spendingLimitPda) {
          setMessage({ type: "error", text: derivation.error ?? "Failed to derive PDA" });
          return;
        }

        // 2. Build transaction client-side
        const destAddresses = destinations
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean);

        const usdcMint = getUsdcMint();
        const amountBaseUnits = BigInt(Math.round(amountUsdc * 1_000_000));

        const tx = await buildAddSpendingLimitTx({
          smartAccountPda,
          mint: usdcMint,
          amount: amountBaseUnits,
          period,
          members: [agentAddress],
          destinations: destAddresses,
          spendingLimitIndex,
          authority: publicKey.toBase58(),
          connection,
        });

        // 3. Sign and send
        const signature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(signature, "confirmed");

        // 4. Persist to DB
        const confirm = await confirmSpendingLimitCreation(agentId, {
          spendingLimitPda: derivation.spendingLimitPda,
          spendingLimitIndex,
          txSignature: signature,
        });

        if (confirm.success) {
          setMessage({ type: "success", text: `Spending limit created. Tx: ${signature.slice(0, 8)}...` });
          pollState();
        } else {
          setMessage({ type: "error", text: confirm.error ?? "Failed to confirm" });
        }
      } catch (err) {
        setMessage({ type: "error", text: err instanceof Error ? err.message : "Transaction failed" });
      }
    });
  }

  async function handleRevoke() {
    if (!publicKey || !sendTransaction) {
      setMessage({ type: "error", text: "Connect your wallet first" });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        const tx = await buildRemoveSpendingLimitTx({
          smartAccountPda,
          spendingLimitIndex,
          authority: publicKey.toBase58(),
          rentCollector: publicKey.toBase58(),
          connection,
        });

        const signature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(signature, "confirmed");

        setMessage({ type: "success", text: `Spending limit revoked. Tx: ${signature.slice(0, 8)}...` });
        setLimitState(null);
      } catch (err) {
        setMessage({ type: "error", text: err instanceof Error ? err.message : "Revoke failed" });
      }
    });
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-bold mb-3">On-Chain Spending Limit</h4>

      {limitState?.exists ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Remaining</p>
              <p className="text-sm font-medium">
                {limitState.remainingAmount
                  ? `${(Number(limitState.remainingAmount) / 1_000_000).toFixed(2)} USDC`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Period</p>
              <p className="text-sm font-medium">
                {limitState.period !== undefined ? PERIOD_LABELS[limitState.period] ?? "Unknown" : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Last Reset</p>
              <p className="text-sm font-medium">
                {limitState.lastReset && limitState.lastReset !== "0"
                  ? new Date(Number(limitState.lastReset) * 1000).toLocaleString()
                  : "Never"}
              </p>
            </div>
          </div>
          <button
            onClick={handleRevoke}
            disabled={isPending || !publicKey}
            className="px-3 py-1.5 rounded-lg text-sm text-[var(--destructive)] border border-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-white disabled:opacity-50"
          >
            {isPending ? "Revoking..." : "Revoke Limit"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Amount (USDC)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 10.00"
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value) as SpendingLimitPeriod)}
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm"
              >
                <option value={SpendingLimitPeriod.OneTime}>One-time</option>
                <option value={SpendingLimitPeriod.Day}>Daily</option>
                <option value={SpendingLimitPeriod.Week}>Weekly</option>
                <option value={SpendingLimitPeriod.Month}>Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                Destinations <span className="text-[var(--muted-foreground)]">(optional, comma-sep)</span>
              </label>
              <input
                type="text"
                value={destinations}
                onChange={(e) => setDestinations(e.target.value)}
                placeholder="address1, address2"
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleAddLimit}
            disabled={isPending || !publicKey}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Add Spending Limit"}
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
