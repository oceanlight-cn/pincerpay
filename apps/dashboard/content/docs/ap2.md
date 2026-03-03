---
title: "AP2: Authorization Protocol"
description: How AP2 mandates control what agents can spend and when humans need to approve.
order: 4.2
section: Learn
---

AP2 adds authorization scoping to agent payments. While [x402](/docs/x402) handles the settlement mechanics, AP2 answers the question: "Is this agent allowed to make this payment?"

Three mandate types control spending at different levels of autonomy.

## Intent Mandates

Autonomous spending within limits. The agent operates freely within the mandate's constraints.

```
"I authorize this agent to spend up to 5 USDC/day on weather APIs."
```

- Set by the agent's owner (human or organization) via the PincerPay dashboard
- Enforced at three layers: client-side by the SDK, server-side by the facilitator (per-transaction and daily limits), and on-chain via Squads SPN spending limits
- Suitable for routine, low-value transactions

This is the most common mandate type. When you configure spending policies in the [Agent SDK](/docs/agent-sdk), you're creating Intent Mandates.

## Cart Mandates

Human-in-the-loop approval for specific purchases. The agent proposes a transaction, a human approves or rejects.

```
Agent: "I want to buy a $50 dataset from DataCorp."
Human: [Approve] [Reject]
```

- Used for high-value or unusual transactions
- Maps naturally to n8n's human-in-the-loop and AI SDK's `needsApproval`
- The human sees what, how much, and who before funds move

## Payment Mandates

Execution-level authorization. A signed instruction that the facilitator validates before broadcasting.

- Created after Intent or Cart approval
- Contains the exact transaction parameters
- Single-use, time-bounded, amount-specific

## Double-Lock Enforcement

PincerPay's "Double-Lock" combines x402 and AP2: the facilitator only broadcasts a transaction if both the x402 payment is valid and the AP2 mandate authorizes it. This prevents agents from spending outside their approved scope, even if they hold sufficient funds.
