---
title: "Example: Express Merchant"
description: Express server with free and paywalled endpoints using PincerPay middleware.
order: 8.2
section: Examples
---

A minimal Express server with PincerPay middleware protecting API endpoints. Demonstrates both free and paywalled routes with different price tiers.

## Endpoints

| Route | Price | Description |
|-------|-------|-------------|
| `GET /api/health` | Free | Health check |
| `GET /api/weather` | 0.001 USDC | Current weather data |
| `GET /api/premium` | 0.10 USDC | Premium analytics data |

## Server code

```typescript
// src/index.ts
import express from "express";
import { pincerpay } from "@pincerpay/merchant";

const app = express();

app.use(
  pincerpay({
    apiKey: process.env.PINCERPAY_API_KEY!,
    merchantAddress: process.env.MERCHANT_ADDRESS!,
    routes: {
      "GET /api/weather": {
        price: "0.001",
        chain: "solana-devnet",
        description: "Current weather data",
      },
      "GET /api/premium": {
        price: "0.10",
        chains: ["solana-devnet"],
        description: "Premium analytics data",
      },
    },
  })
);

// Free endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Paywalled endpoints
app.get("/api/weather", (_req, res) => {
  res.json({
    temperature: 72,
    conditions: "sunny",
    location: "San Francisco",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/premium", (_req, res) => {
  res.json({
    insights: [
      { metric: "daily_active_agents", value: 1420 },
      { metric: "avg_transaction_value", value: "$0.05" },
      { metric: "settlement_time_p99", value: "1.2s" },
    ],
  });
});

const port = process.env.PORT ?? 3001;
app.listen(port, () => {
  console.log(`Merchant running at http://localhost:${port}`);
});
```

## Setup

1. Create a `.env` file:

```bash
PINCERPAY_API_KEY=pp_live_your_api_key_here
MERCHANT_ADDRESS=YourSolanaWalletAddress
```

2. Install dependencies from the monorepo root:

```bash
pnpm install
```

3. Start the server:

```bash
pnpm --filter example-express-merchant start
```

## Test with curl

```bash
# Free endpoint
curl http://localhost:3001/api/health
# {"status":"ok"}

# Paywalled endpoint (returns 402)
curl -i http://localhost:3001/api/weather
# HTTP/1.1 402 Payment Required
```

## Test with the Agent SDK

```typescript
import { PincerPayAgent } from "@pincerpay/agent";

const agent = await PincerPayAgent.create({
  chains: ["solana-devnet"],
  solanaPrivateKey: process.env.AGENT_SOLANA_KEY!,
});

const res = await agent.fetch("http://localhost:3001/api/weather");
console.log(await res.json());
// { temperature: 72, conditions: "sunny", ... }
```

## Related

- [GitHub source](https://github.com/ds1/pincerpay/tree/master/examples/express-merchant)
- [Merchant SDK Reference](/docs/merchant-sdk)
- [Quickstart: Merchant](/docs/quickstart-merchant)
