"use client";

import { useState, useTransition } from "react";
import { updateAgent } from "../actions";

interface SpendingLimitsFormProps {
  agentId: string;
  maxPerTransaction: string | null;
  maxPerDay: string | null;
}

/** Convert base units (e.g. "5000000") to USDC display (e.g. "5.00") */
function toUsdc(baseUnits: string | null): string {
  if (!baseUnits) return "";
  return (Number(baseUnits) / 1_000_000).toFixed(2);
}

/** Convert USDC display (e.g. "5.00") to base units (e.g. "5000000") */
function toBaseUnits(usdc: string): string | null {
  const num = parseFloat(usdc);
  if (isNaN(num) || num < 0) return null;
  return Math.round(num * 1_000_000).toString();
}

export function SpendingLimitsForm({ agentId, maxPerTransaction, maxPerDay }: SpendingLimitsFormProps) {
  const [perTx, setPerTx] = useState(toUsdc(maxPerTransaction));
  const [daily, setDaily] = useState(toUsdc(maxPerDay));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSave() {
    setMessage(null);

    const perTxBase = perTx.trim() ? toBaseUnits(perTx) : null;
    const dailyBase = daily.trim() ? toBaseUnits(daily) : null;

    if (perTx.trim() && perTxBase === null) {
      setMessage({ type: "error", text: "Invalid per-transaction amount" });
      return;
    }
    if (daily.trim() && dailyBase === null) {
      setMessage({ type: "error", text: "Invalid daily amount" });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("maxPerTransaction", perTxBase ?? "clear");
      formData.set("maxPerDay", dailyBase ?? "clear");
      const result = await updateAgent(agentId, formData);
      if (result.success) {
        setMessage({ type: "success", text: "Limits saved" });
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to save" });
      }
    });
  }

  function handleClear() {
    setMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("maxPerTransaction", "clear");
      formData.set("maxPerDay", "clear");
      const result = await updateAgent(agentId, formData);
      if (result.success) {
        setPerTx("");
        setDaily("");
        setMessage({ type: "success", text: "Limits cleared" });
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to clear" });
      }
    });
  }

  return (
    <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
      <h3 className="text-sm font-bold mb-3">Spending Limits</h3>
      <p className="text-xs text-[var(--muted-foreground)] mb-4">
        These limits are enforced by the PincerPay facilitator for every payment.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">
            Max per Transaction (USDC)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={perTx}
            onChange={(e) => setPerTx(e.target.value)}
            placeholder="e.g. 5.00"
            disabled={isPending}
            className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">
            Max per Day (USDC)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={daily}
            onChange={(e) => setDaily(e.target.value)}
            placeholder="e.g. 50.00"
            disabled={isPending}
            className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleClear}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-[var(--muted)] text-sm hover:bg-[var(--accent)] disabled:opacity-50"
        >
          Clear
        </button>
        {message && (
          <span className={`text-xs ${message.type === "success" ? "text-[var(--success)]" : "text-[var(--destructive)]"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
