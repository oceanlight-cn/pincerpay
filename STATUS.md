# Project Status

Last updated: 2026-02-15

## In Progress
- [ ] Finalize PincerPay product strategy and positioning

## Blockers
_None_

## Up Next
- [ ] Design Phase 1 (MVP) architecture — x402 facilitator + multi-chain USDC
- [ ] Scaffold Next.js app with TypeScript and Tailwind
- [ ] Build x402 facilitator service
- [ ] Build merchant SDK (`pincerpay` npm package)

## Recently Completed
- Research document: `_planning/research/PincerPay On-Chain Payment Research.md`
  - Full architecture whitepaper (42 sources)
  - x402 settlement layer with 11-step transaction flow
  - AP2 mandate taxonomy (Intent, Cart, Payment) + A2A x402 Double-Lock
  - UCP manifest schema with PincerPay-native handler
  - ERC-8004 KYA framework (Identity, Reputation, Validation registries)
  - ERC-7715 (EVM) and Squads SPN (Solana) session keys
  - Gas passthrough model — PincerPay never subsidizes gas
  - Competitive analysis (Skyfire: custodial vs PincerPay: non-custodial)
