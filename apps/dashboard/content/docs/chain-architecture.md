---
title: Chain Architecture
description: Solana-first design with optional EVM compatibility for Base and Polygon.
order: 4.4
section: Learn
---

PincerPay is Solana-first. Solana's speed and cost make it the best chain for agent micropayments. EVM chains (Base, Polygon) are supported for agents and merchants that prefer them.

## Solana (Primary)

- **Sub-second finality** -- transactions confirm in ~400ms
- **Sub-cent fees** -- a USDC transfer costs ~$0.00025
- **Kora gasless** -- agents pay gas in USDC instead of SOL (live on devnet)
- **Squads SPN** -- on-chain Smart Accounts with spending limits, manageable from the PincerPay dashboard (live on devnet)

### Optimistic Finality

For payments under $1 USDC, PincerPay releases the resource after the transaction is broadcast to the mempool (~200ms) rather than waiting for block confirmation. This keeps latency low for micropayments while maintaining security for larger amounts.

### Gas Passthrough

PincerPay never subsidizes gas. On Solana, agents pay a small SOL fee (~$0.00025) per transaction. With Kora integration, agents can pay gas in USDC instead, removing the need to hold SOL entirely.

## EVM (Optional Compatibility)

Base and Polygon are supported for agents and merchants that prefer EVM:

- **Base** -- Coinbase's L2, co-creators of x402
- **Polygon** -- low fees, established ecosystem
- **ERC-7715** -- session keys for scoped agent permissions

## Chain Identifiers

PincerPay uses short chain identifiers in SDK configuration and API responses. These map to [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md) identifiers for cross-chain interoperability.

| Shorthand | CAIP-2 ID | Network |
|-----------|-----------|---------|
| `solana` | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | Solana Mainnet |
| `solana-devnet` | `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` | Solana Devnet |
| `base` | `eip155:8453` | Base Mainnet |
| `base-sepolia` | `eip155:84532` | Base Sepolia |
| `polygon` | `eip155:137` | Polygon Mainnet |
| `polygon-amoy` | `eip155:80002` | Polygon Amoy |

Start with `solana-devnet` for development, then switch to `solana` for production.
