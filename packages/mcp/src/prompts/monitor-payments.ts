import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerMonitorPaymentsPrompt(server: McpServer) {
  server.prompt(
    "monitor-payments",
    "Monitor payment activity: view transaction history, check settlement metrics, " +
      "and investigate failures or pending payments.",
    {
      timeframe: z
        .enum(["today", "week", "month"])
        .default("today")
        .describe("Time period to focus on."),
      focus: z
        .enum(["overview", "failures", "pending"])
        .default("overview")
        .describe("What aspect to focus on."),
    },
    ({ timeframe, focus }) => {
      const focusInstructions: Record<string, string> = {
        overview: `Give me an overview of my payment activity for ${timeframe}:
1. Use get-settlement-metrics to show overall performance (settlement count, latency, error rate)
2. Use list-transactions to show recent transactions
3. Summarize: total volume, success rate, most active chains, and any concerning patterns
4. If there are failed transactions, briefly note them`,
        failures: `Help me investigate failed payments for ${timeframe}:
1. Use list-transactions with status=failed to find failures
2. For each failure, analyze the likely cause:
   - Insufficient USDC balance
   - Wrong chain/network mismatch
   - Transaction timeout
   - RPC connectivity issues
3. Use check-facilitator-health to verify the facilitator is healthy
4. Check list-webhooks with status=failed to see if webhook notifications also failed
5. Suggest remediation steps`,
        pending: `Show me pending/stuck payments for ${timeframe}:
1. Use list-transactions with status=pending to find stuck transactions
2. Also check status=mempool for transactions waiting for confirmation
3. Use get-settlement-metrics to see if latency is elevated
4. Use check-facilitator-health to check worker status (confirmation worker)
5. For each pending transaction, explain how long it's been waiting and whether it's concerning`,
      };

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: focusInstructions[focus],
            },
          },
        ],
      };
    },
  );
}
