# Phase S3: On-Chain Anchor Facilitator

**Date:** 2026-02-17
**Status:** Implemented

## Context

Phase S2 added Kora gasless transactions and Squads Smart Account spending policies. The facilitator is still fully off-chain — a Hono HTTP server that receives x402 payment payloads, signs/broadcasts Solana transactions via `@x402/svm`, and records results in PostgreSQL. This works but is:
- **Opaque**: settlement happens server-side with no on-chain audit trail
- **Centralized**: facilitator operator has full control over broadcasting
- **Unverifiable**: merchants trust the facilitator recorded the correct amount

Phase S3 adds an **Anchor program on Solana** that provides:
1. On-chain merchant registration (verifiable accounts)
2. On-chain settlement recording (audit trail for every x402 payment)
3. A new direct settlement path where the program does USDC transfer via CPI (bypasses x402 for Solana)

### Key Design Tension: x402 vs Anchor

x402 has the **agent pre-sign raw SPL TransferChecked instructions**. The facilitator co-signs and broadcasts. An Anchor program needs **different instructions** (program CPI calls). These two paths are **incompatible in a single transaction**.

**Solution: Hybrid parallel paths**
- **Path A (x402)**: Unchanged. Agent → 402 challenge → sign → facilitator verifies/broadcasts. Works today. After settlement, facilitator calls `record_x402_settlement` on the Anchor program to create an on-chain audit record.
- **Path B (Direct)**: New. Agent builds Anchor `settle_payment` instruction → program does USDC CPI transfer. No x402 involvement. Exposed via new `/v1/settle-direct` route.

### Windows Constraint

Anchor CLI requires Linux. The Rust program source lives in the monorepo but **must be compiled in WSL2 or CI** (GitHub Actions Linux runner). The TypeScript client and facilitator integration work natively on Windows.

---

## Implementation Checklist

- [x] S3-1: Anchor program (`packages/solana-program/`)
- [x] S3-2: TypeScript program client (`packages/program/`)
- [x] S3-3: Facilitator hybrid integration
- [x] S3-4: Database schema updates
- [x] S3-5: Core types
- [x] S3-6: Confirmation worker update (verified no changes needed)
- [x] S3-7: On-chain recorder worker
- [x] S3-8: Dashboard updates
- [x] S3-9: Agent SDK direct settlement
- [x] S3-10: Docker updates
- [x] S3-11: CI Anchor build workflow
- [x] S3-12: Tests

## Verification

- Build: 8/8 tasks pass
- Typecheck: 14/14 tasks pass
- Tests: 142 total (15 new), 0 failures
