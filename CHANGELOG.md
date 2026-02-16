# Changelog

## 0.2.0 — 2026-02-15

### Hardening + Solana + Testing + Dashboard Polish

- **Solana chain support** via @x402/svm + @solana/kit v5
  - Facilitator: `setupSolanaFacilitator()` with `registerExactSvmScheme`
  - Agent SDK: `PincerPayAgent.create()` async factory for Solana wallets
  - Config: `SOLANA_PRIVATE_KEY` + `SOLANA_NETWORKS` env vars
- **Testing infrastructure**: Vitest workspace with 47 tests across 5 suites
  - Core: chain resolution, CAIP-2 parsing, Zod schema validation
  - Agent: spending policy enforcement (per-tx + daily limits)
  - Merchant: route config transformation, base unit conversion
  - Facilitator: rate limiter middleware
- **GitHub Actions CI**: typecheck → test → build pipeline
- **Dashboard improvements**:
  - Logout button + nav active state (extracted client-side sidebar)
  - Error boundary for dashboard routes
  - Analytics: recharts bar chart (volume by chain) + line chart (daily volume)
  - Paywall CRUD: create, toggle, delete paywalls from UI
  - Transaction detail page with explorer link
  - EVM wallet address validation in merchant settings
- **Facilitator hardening**:
  - CORS origin restriction via `CORS_ORIGINS` env var
  - Zod request body validation on verify/settle routes
  - Auth error logging with IP + key prefix
  - Graceful DB shutdown on SIGTERM/SIGINT
  - `.dockerignore` to reduce Docker context size
- **DB schema**: unique constraint on paywalls, composite analytics index on transactions
- **Docker Compose**: local dev with PostgreSQL + facilitator

## 0.1.0 — 2026-02-15

### Phase 1 MVP Implementation

- **Monorepo scaffold**: pnpm workspaces + Turborepo + shared tsconfig
- **@pincerpay/core**: Chain configs (Base, Polygon, Solana mainnet + testnets), TypeScript types, Zod schemas, USDC addresses, CAIP-2 chain registry
- **@pincerpay/db**: Drizzle ORM schema — merchants, api_keys, paywalls, transactions tables with indexes
- **@pincerpay/facilitator**: Hono-based x402 facilitator
  - Registers @x402/evm exact payment scheme for Base + Polygon
  - POST /v1/verify, POST /v1/settle, GET /v1/supported, GET /health, GET /v1/status/:txHash
  - API key authentication, rate limiting, structured pino logging
  - Facilitator hooks for tx recording + settlement logging
  - Optimistic finality for sub-$1 transactions
- **@pincerpay/merchant**: Server-side SDK
  - Express middleware (`pincerpay()`) wrapping @x402/express
  - Hono middleware (`pincerpayHono()`) wrapping @x402/hono
  - Dead-simple route config: `{ "GET /api/data": { price: "0.01", chain: "base" } }`
  - PincerPayClient for direct facilitator API access
- **@pincerpay/agent**: Client-side SDK
  - PincerPayAgent class with payment-enabled `fetch()` wrapping @x402/fetch
  - EVM wallet support via viem + @x402/evm client scheme
  - Spending policy enforcement (per-transaction and daily limits)
- **@pincerpay/dashboard**: Next.js 15 merchant dashboard
  - Supabase Auth (email/password login + signup)
  - Dashboard overview with 30d volume, transaction count, confirmation rate
  - Transaction history table
  - Paywall configuration display
  - Settings: merchant profile editor + API key management (create/revoke)
  - Analytics: volume by chain, daily volume chart
- **Examples**: express-merchant and agent-weather demo apps
- **Deploy config**: Dockerfile for facilitator, .env.example templates
