# Project Status

Last updated: 2026-02-16

## Phase 1 MVP — Deployed to Production

All 6 workspace packages build clean. 47 tests pass. Facilitator on Railway, dashboard on Vercel.

### Infrastructure
- **Facilitator**: `https://pincerpayfacilitator-production.up.railway.app` — healthy, Base Sepolia EVM registered
- **Dashboard**: `https://pincerpay.com` (Vercel)
- **Database**: Supabase PostgreSQL with RLS enabled on all tables
- **Facilitator wallet**: `0x960E470581d17BcCd272F5Bd76A094077Cd907FE` (Base Sepolia: ~19 USDC + 0.049 ETH)
- **CI**: GitHub Actions (typecheck → test → build)

### Completed
- [x] Monorepo scaffold (pnpm + Turborepo + tsconfig bases)
- [x] `packages/core` — chain configs (Base, Polygon, Solana), types, constants, Zod schemas
- [x] `packages/db` — Drizzle schema (merchants, api_keys, paywalls, transactions), NodeNext module resolution
- [x] `apps/facilitator` — Hono x402 facilitator with EVM + Solana support
  - Routes: /verify, /settle, /supported, /health, /status/:txHash
  - Middleware: API key auth, rate limiting, pino logging
  - Hooks: transaction recording, settlement logging
  - Solana via @x402/svm + @solana/kit v5
  - CORS restriction, Zod body validation, graceful shutdown
- [x] `packages/merchant` — Express + Hono middleware wrapping @x402/express and @x402/hono
- [x] `packages/agent` — PincerPayAgent with x402 fetch wrapper + spending policies + Solana support
- [x] `apps/dashboard` — Next.js 15 merchant dashboard (Vercel)
  - Supabase Auth (login/signup/logout) via runtime SupabaseProvider
  - Dashboard overview with 30d stats
  - Transaction history table with clickable detail view
  - Paywall CRUD (create/toggle/delete)
  - Settings: merchant profile + API key management (create/revoke)
  - Analytics: recharts bar + line charts (volume by chain, daily volume)
  - Error boundaries, nav active state, wallet address validation
- [x] Dockerfile for facilitator with build assertions
- [x] Root `.dockerignore` for clean Docker builds
- [x] Docker Compose for local dev (PostgreSQL + facilitator)
- [x] Example apps (express-merchant, agent-weather)
- [x] Environment templates (.env.example)
- [x] Vitest test suite (core, agent, merchant, facilitator)
- [x] GitHub Actions CI pipeline (typecheck → test → build)
- [x] Supabase project setup + schema pushed via `pnpm db:push`
- [x] Deploy facilitator to Railway (Docker)
- [x] Deploy dashboard to Vercel (migrated from Railway)
- [x] Custom domain: pincerpay.com → Vercel
- [x] Fund facilitator wallet with testnet ETH + USDC on Base Sepolia
- [x] RLS enabled on all database tables
- [x] Agent test wallet funded: `0xDA335159D283F54005fE2b4cd0eB21F256f8B726` (1 USDC)

### Recent Fixes
- [x] Fix Vercel serverless crash: `serverExternalPackages`, SSL for pooler, `DATABASE_URL` validation

## In Progress
- [ ] E2E test: merchant creates paywall → agent hits endpoint → 402 → sign → settle → dashboard shows tx
- [ ] Set `CORS_ORIGINS` on facilitator to allow dashboard + merchant domains

## Phase 2 — Trust & Discovery (Not Started)
- [ ] AP2 mandate validation in facilitator
- [ ] A2A x402 Extension: Double-Lock enforcement
- [ ] UCP manifest generation in merchant SDK
- [ ] ERC-7715 session key validation (EVM)
- [ ] Squads SPN integration (Solana)
- [ ] Micropayment batching

## Blockers
_None_
