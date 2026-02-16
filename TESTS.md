# Test Documentation

Last updated: 2026-02-16

**Total: 51 unique tests** across 6 test files in 4 packages. All passing.

Run all tests: `pnpm -r test`

> Note: Vitest discovers both `src/**/*.test.ts` and `dist/**/*.test.js` files, so the runner reports 102 tests (51 unique x 2 mirrors). All counts below refer to unique tests.

---

## packages/core — 23 tests

### `src/__tests__/chains.test.ts` — Chain resolution and registry (12 tests)

| # | Test | Purpose | Expected | Actual |
|---|------|---------|----------|--------|
| 1 | resolves by shorthand | `resolveChain("base")` returns BASE_MAINNET config | ChainConfig with caip2Id `eip155:8453` | PASS |
| 2 | resolves by CAIP-2 ID | `resolveChain("eip155:8453")` returns same config | ChainConfig with shorthand `base` | PASS |
| 3 | returns undefined for unknown | `resolveChain("ethereum")` returns undefined | `undefined` | PASS |
| 4 | converts shorthand to CAIP-2 | `toCAIP2("base")` returns CAIP-2 string | `"eip155:8453"` | PASS |
| 5 | passes through valid CAIP-2 | `toCAIP2("eip155:8453")` returns input unchanged | `"eip155:8453"` | PASS |
| 6 | throws for unknown chains | `toCAIP2("unknown")` throws | Error with chain name | PASS |
| 7 | returns only mainnets | `getMainnetChains()` filters correctly | 3 chains, all `testnet: false` | PASS |
| 8 | returns only testnets | `getTestnetChains()` filters correctly | 3 chains, all `testnet: true` | PASS |
| 9 | has 6 total chains | CHAINS registry has correct size | 6 entries | PASS |
| 10 | CAIP-2 reverse lookup matches | `CHAINS_BY_CAIP2[chain.caip2Id]` round-trips | Same object for all chains | PASS |
| 11 | all chains have required fields | Every chain has caip2Id, namespace, usdcAddress, etc. | All fields present, `usdcDecimals === 6` | PASS |
| 12 | EVM chains have numeric chainId | Chains with `namespace: "eip155"` have numeric chainId | `typeof chainId === "number"` | PASS |

### `src/__tests__/types.test.ts` — Zod schema validation (11 tests)

| # | Test | Purpose | Expected | Actual |
|---|------|---------|----------|--------|
| 1 | validates minimal route config | RoutePaywallConfigSchema accepts `{ price: "0.01" }` | Schema passes | PASS |
| 2 | validates full route config | Schema accepts price + chain + chains + description | Schema passes | PASS |
| 3 | rejects invalid price format | Schema rejects `price: "abc"` | Validation error | PASS |
| 4 | rejects missing price | Schema rejects empty object | Validation error | PASS |
| 5 | accepts integer prices | Schema accepts `price: "1"` | Schema passes | PASS |
| 6 | validates complete config | PincerPayConfigSchema accepts apiKey + merchantAddress + routes | Schema passes | PASS |
| 7 | rejects empty apiKey | Schema rejects `apiKey: ""` | Validation error | PASS |
| 8 | accepts optional facilitatorUrl | Schema accepts valid URL in optional field | Schema passes | PASS |
| 9 | rejects invalid facilitatorUrl | Schema rejects malformed URL | Validation error | PASS |
| 10 | validates empty spending policy | SpendingPolicySchema accepts `{}` | Schema passes | PASS |
| 11 | validates full spending policy | Schema accepts maxPerTransaction + maxPerDay + allowedMerchants + allowedChains | Schema passes | PASS |

---

## packages/merchant — 11 tests

### `src/__tests__/client.test.ts` — Price conversion and route resolution (11 tests)

| # | Test | Purpose | Expected | Actual |
|---|------|---------|----------|--------|
| 1 | converts whole numbers | `toBaseUnits("1")` → 6-decimal USDC base units | `"1000000"` | PASS |
| 2 | converts decimal amounts | `toBaseUnits("0.01")` → base units | `"10000"` | PASS |
| 3 | truncates beyond 6 decimals | `toBaseUnits("0.0000001")` truncates | `"0"` | PASS |
| 4 | handles zero | `toBaseUnits("0")` and `"0.00"` | `"0"` | PASS |
| 5 | handles large amounts | `toBaseUnits("1000000")` | `"1000000000000"` | PASS |
| 6 | resolves single chain | `resolveRouteChains({ chain: "base" })` | `["eip155:8453"]` | PASS |
| 7 | resolves multiple chains | `resolveRouteChains({ chains: ["base", "polygon"] })` | `["eip155:8453", "eip155:137"]` | PASS |
| 8 | defaults to base | No chain specified defaults to base | `["eip155:8453"]` | PASS |
| 9 | prefers chains array | `chains` array takes precedence over `chain` string | Array result used | PASS |
| 10 | returns USDC address | `getUsdcAsset("base")` returns contract address | `"0x833589..."` | PASS |
| 11 | throws for unknown chains | `getUsdcAsset("ethereum")` throws | Error | PASS |

---

## packages/agent — 9 tests

### `src/__tests__/client.test.ts` — Agent wallet and spending policies (9 tests)

| # | Test | Purpose | Expected | Actual |
|---|------|---------|----------|--------|
| 1 | requires at least one wallet key | Constructor with no keys throws | Error | PASS |
| 2 | creates agent with EVM key | Constructor with evmPrivateKey sets chains + address | Valid agent instance | PASS |
| 3 | derives correct EVM address | Hardhat #0 key derives expected address | `"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"` | PASS |
| 4 | allows within per-tx limit | `checkPolicy("500000")` with 1 USDC limit | `{ allowed: true }` | PASS |
| 5 | blocks exceeding per-tx limit | `checkPolicy("1500000")` with 1 USDC limit | `{ allowed: false, reason: "per-transaction limit" }` | PASS |
| 6 | allows exactly the limit | `checkPolicy("1000000")` with 1 USDC limit | `{ allowed: true }` | PASS |
| 7 | tracks daily spending | `recordSpend` + cumulative `checkPolicy` respects daily limit | Blocks when cumulative > daily limit | PASS |
| 8 | blocks when daily exceeded | Transaction pushing total over daily limit | `{ allowed: false, reason: "daily limit" }` | PASS |
| 9 | allows all with no policies | No policies configured → everything allowed | `{ allowed: true }` for any amount | PASS |

---

## apps/facilitator — 8 tests

### `src/__tests__/ratelimit.test.ts` — Rate limiter middleware (4 tests)

| # | Test | Purpose | Expected | Actual |
|---|------|---------|----------|--------|
| 1 | allows requests within limit | Request within limit returns 200 | 200 + `X-RateLimit-Remaining: 2` | PASS |
| 2 | blocks requests exceeding limit | 3rd request with limit=2 returns 429 | 429 + `{ error: "Rate limit exceeded" }` | PASS |
| 3 | sets rate limit headers | Response includes rate limit headers | `X-RateLimit-Limit`, `Remaining`, `Reset` present | PASS |
| 4 | resets after window expires | After window elapses, counter resets | 200 on new request after window | PASS |

### `src/__tests__/e2e.test.ts` — Full payment flow (4 tests)

Spins up 3 localhost HTTP servers: mock JSON-RPC, facilitator (real x402 + mock DB), merchant (pincerpayHono middleware). Agent uses real EVM signing (Hardhat test keys).

| # | Test | Purpose | Expected | Actual |
|---|------|---------|----------|--------|
| 1 | agent pays and receives resource | Full flow: GET paywalled endpoint → 402 → agent signs EIP-712 → facilitator verify + settle → merchant returns resource | 200 + `{ data: "hello" }` | PASS |
| 2 | transaction recorded in DB | Mock DB insert captured correctly | `merchantId`, `chainId: "eip155:84532"`, `amount: "1000"`, `status: "optimistic"`, `toAddress` all correct | PASS |
| 3 | non-paywalled routes pass through | GET /api/free bypasses payment middleware | 200 + `{ data: "free" }` | PASS |
| 4 | health check works | GET /health on facilitator | 200 + `{ status: "ok", service: "pincerpay-facilitator" }` | PASS |

---

## Test Architecture

```
packages/core        → Unit tests: chain registry, Zod schemas
packages/merchant    → Unit tests: price conversion, route resolution
packages/agent       → Unit tests: wallet creation, spending policy enforcement
apps/facilitator     → Integration: rate limiter middleware
                     → E2E: full 3-server payment flow with real EVM crypto
```

**E2E test design**: Real cryptography (EVM EIP-712 signing), mocked infrastructure (JSON-RPC, database). Validates the entire HTTP request chain across 3 services without any external dependencies.
