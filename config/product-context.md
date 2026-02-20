# PincerPay Product Context

Use this as ground truth when generating content. Every claim must be backed by these facts.

## What PincerPay Is

PincerPay is an on-chain payment gateway for the agentic economy. It implements the x402 protocol to enable AI agents to pay for HTTP resources (APIs, data, compute) using USDC stablecoins. Solana is the primary chain; Base and Polygon are maintained as secondary.

## How It Works

1. Agent sends HTTP GET to a paywalled API endpoint
2. Server returns HTTP 402 with payment details (token, amount, chain, facilitator URL)
3. Agent SDK signs a USDC transfer and sends it to the facilitator for verification
4. Facilitator broadcasts the transaction, returns a receipt
5. Agent retries the original request with proof of payment
6. Server verifies receipt and returns the data

## Key Components

- **`@pincerpay/merchant`** — Express/Hono middleware. Add 3 lines to paywall any API endpoint.
- **`@pincerpay/agent`** — Wraps fetch(). Handles 402 challenges automatically. 3 lines of code.
- **`@pincerpay/core`** — Shared types, protocol definitions, chain utilities.
- **Facilitator** — Server that verifies payments, broadcasts transactions, settles on-chain.
- **Dashboard** — Merchant dashboard at pincerpay.com for configuration and analytics.

## Key Technical Features

- **Non-custodial**: Agents hold their own keys. PincerPay never controls funds.
- **Kora gasless**: Agents pay gas in USDC instead of SOL (via Kora integration on Solana).
- **Squads Smart Accounts**: Session keys (SPN) for scoped, time-limited agent signing permissions.
- **On-chain Anchor program**: Direct on-chain settlement with audit trails via Solana Anchor.
- **Spending policies**: Per-request caps and daily budgets enforced before signing.

## Real Numbers (Use These)

- Transaction cost on Solana: ~$0.0001 (vs. Stripe's $0.30 + 2.9%)
- Settlement finality: 400ms on Solana
- Cost comparison: 99.9% cheaper than card rails for micropayments
- Example: A $0.01 API call costs $0.31 on Stripe. On PincerPay: $0.01 + ~$0.0001.

## Competitive Positioning

| | PincerPay | Skyfire | Stripe |
|---|---|---|---|
| Architecture | Non-custodial, protocol-based | Custodial, platform-based | Custodial, card-rail-based |
| Agent support | Native (x402 + AP2) | SDK-wrapped | None (human flows) |
| Cost per $0.01 txn | ~$0.0001 | ~$0.001 | ~$0.31 |
| Settlement | On-chain USDC (instant) | Internal ledger | T+2 bank transfer |
| Open standard | x402, AP2, UCP | Proprietary | Proprietary |

## Protocol Context

- **x402**: HTTP payment protocol using status code 402. Co-created by Coinbase. 35M+ transactions processed across the ecosystem.
- **AP2 (Agent Payment Protocol v2)**: Google's agent payment standard. PincerPay is architecturally compatible.
- **UCP (Universal Commerce Protocol)**: Discovery layer for agent-payable services.
- **ACP (Agentic Commerce Protocol)**: OpenAI's protocol, currently Stripe-only.

## What PincerPay Is NOT

- Not a wallet provider (non-custodial — agents manage their own keys)
- Not a DeFi protocol (focused on commerce/payments, not trading)
- Not a blockchain (uses existing chains — Solana primary)
- Not just for crypto users (USDC is a regulated stablecoin, pegged 1:1 to USD)

## Current Status

- Facilitator deployed on Railway
- Dashboard live at pincerpay.com
- Agent demo at demo.pincerpay.com
- Anchor program deployed to Solana devnet
- npm packages: @pincerpay/merchant, @pincerpay/agent, @pincerpay/core

## URLs

- Website: https://pincerpay.com
- Demo: https://demo.pincerpay.com
- GitHub: https://github.com/ds1/pincerpay
- Agent Demo Repo: https://github.com/ds1/pincerpay-agent-demo
