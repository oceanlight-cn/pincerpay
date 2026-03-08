---
description: Monitor payment activity — view transactions, check settlement metrics, investigate failures
argument-hint: [overview | failures | pending]
---

# Monitor Payments

Help the user monitor their payment activity. If an argument is provided, go directly to that focus area. Otherwise, default to an overview.

## Focus Areas

### overview
Give an overview of payment activity:
1. Use `get-settlement-metrics` to show overall performance (settlement count, latency, error rate)
2. Use `list-transactions` to show recent transactions
3. Summarize: total volume, success rate, most active chains, and any concerning patterns
4. If there are failed transactions, briefly note them

### failures
Investigate failed payments:
1. Use `list-transactions` with status=failed to find failures
2. For each failure, analyze the likely cause:
   - Insufficient USDC balance
   - Wrong chain/network mismatch
   - Transaction timeout
   - RPC connectivity issues
3. Use `check-facilitator-health` to verify the facilitator is healthy
4. Check `list-webhooks` with status=failed to see if webhook notifications also failed
5. Suggest remediation steps

### pending
Show pending or stuck payments:
1. Use `list-transactions` with status=pending to find stuck transactions
2. Also check status=mempool for transactions waiting for confirmation
3. Use `get-settlement-metrics` to see if latency is elevated
4. Use `check-facilitator-health` to check worker status (confirmation worker)
5. For each pending transaction, explain how long it's been waiting and whether it's concerning
