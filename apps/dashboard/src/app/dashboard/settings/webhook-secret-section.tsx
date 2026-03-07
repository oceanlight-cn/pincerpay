"use client";

import { useState } from "react";
import { regenerateWebhookSecret } from "./actions";

export function WebhookSecretSection({ hasSecret }: { hasSecret: boolean }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegenerate() {
    if (hasSecret && !confirm("Regenerating will invalidate your current webhook secret. Existing webhook integrations will fail signature verification until updated. Continue?")) {
      return;
    }
    setLoading(true);
    setMessage("");
    const result = await regenerateWebhookSecret();
    if (result.success && result.webhookSecret) {
      setSecret(result.webhookSecret);
      setMessage(hasSecret ? "Secret regenerated. Update your webhook handler." : "Secret generated.");
    } else {
      setMessage(result.error ?? "Failed to generate secret");
    }
    setLoading(false);
  }

  return (
    <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Webhook deliveries include an <code className="text-xs bg-[var(--background)] px-1 py-0.5 rounded">X-PincerPay-Signature</code> header
        signed with this secret. Use it to verify that webhook requests are from PincerPay.
      </p>

      {secret && (
        <div className="mb-3">
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Your webhook secret (copy now):</label>
          <code className="block p-2 text-xs font-mono bg-[var(--background)] rounded border border-[var(--border)] break-all select-all">
            {secret}
          </code>
        </div>
      )}

      {!secret && hasSecret && (
        <p className="text-sm mb-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Webhook signing is active.
          </span>
        </p>
      )}

      {message && (
        <p className={`text-sm mb-3 ${message.includes("Failed") ? "text-[var(--destructive)]" : "text-[var(--success)]"}`}>
          {message}
        </p>
      )}

      <button
        onClick={handleRegenerate}
        disabled={loading}
        className="px-3 py-1.5 text-sm bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--background)] transition-colors disabled:opacity-50"
      >
        {loading ? "Generating..." : hasSecret ? "Regenerate Secret" : "Generate Secret"}
      </button>
    </div>
  );
}
