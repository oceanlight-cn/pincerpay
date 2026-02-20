# Strategy: Landing Walmart as a PincerPay Merchant

**Date:** February 20, 2026
**Status:** Research Complete
**Classification:** Confidential — Business Strategy

---

## Executive Summary

PincerPay's best path into Walmart is **not through consumer checkout**, but through the **machine-to-machine API economy** Walmart is actively building around agentic commerce and the Universal Commerce Protocol (UCP).

**Core thesis:** Walmart is a co-creator of UCP alongside Google, Shopify, Target, Visa, Mastercard, Stripe, and Adyen. UCP uses AP2 for payments. AP2 uses x402 as its stablecoin payment rail. PincerPay already builds on x402 with native AP2 mandate architecture. This makes PincerPay a natural fit as the **x402 facilitator** for Walmart's agentic commerce APIs.

**Timeline:** 3 years from first action to marquee partnership
**Estimated Total Cost:** $600K–$1.4M
**Recommended Entry Point:** x402-gated premium API access for Walmart Connect (advertising platform)

---

## Table of Contents

1. [Why Walmart, Why Now](#why-walmart-why-now)
2. [Walmart's Current Position](#walmarts-current-position)
3. [Entry Points & Decision Makers](#entry-points--decision-makers)
4. [Competitive Landscape](#competitive-landscape)
5. [Use Cases (Ranked by Probability)](#use-cases)
6. [The Five-Phase Strategy](#the-five-phase-strategy)
7. [Regulatory & Compliance Requirements](#regulatory--compliance-requirements)
8. [Risk Factors & Mitigations](#risk-factors--mitigations)
9. [Timeline & Budget](#timeline--budget)
10. [Sources](#sources)

---

## Why Walmart, Why Now

Four converging signals make this the right moment:

1. **New CEO is "all in" on agentic commerce.** John Furner (CEO since Feb 1, 2026) stated at NRF 2026: *"The transition from traditional web or app search to agent-led commerce represents the next great evolution in retail."*

2. **Walmart co-created UCP, which uses x402.** Universal Commerce Protocol — co-developed with Google, Shopify, Target, Visa, Mastercard, Stripe, Adyen — standardizes agentic commerce. AP2 (the payment layer) integrates x402 as the stablecoin settlement rail. PincerPay's architecture maps directly to this stack.

3. **Walmart is exploring stablecoins.** WSJ reported (June 2025) Walmart is exploring issuing its own stablecoin. The GENIUS Act (signed July 2025) provides the legal framework. Analysts estimate $783M–$2B in annual interchange fee savings.

4. **OnePay launched crypto.** Walmart's fintech arm (OnePay) went live with BTC/ETH trading in January 2026 via Zerohash, signaling institutional comfort with digital assets.

---

## Walmart's Current Position

### Leadership

| Role | Person | Relevance |
|------|--------|-----------|
| **CEO** | John Furner (since Feb 1, 2026) | Former NRF chairman. Vocal proponent of agentic commerce. |
| **CTO** | Suresh Kumar (EVP, Global CTO/CDO) | Former Google VP. Declared "Walmart is all in on agents" (July 2025). |
| **EVP, AI Acceleration** | Daniel Danker (new role, 2025) | Oversees AI strategy across the enterprise. |
| **EVP, AI Platforms** | Reports to Kumar (new role, 2025) | Manages AI infrastructure and developer tools. |

No dedicated VP of Payments identified publicly. Payments falls under Kumar's broader tech org, with consumer payments channeled through OnePay.

### Payments Stack

- **OnePay** (formerly Hazel/One): Walmart's majority-owned fintech ($2.5B valuation, 3M+ active customers). High-yield savings, debit/credit cards, P2P, BNPL (exclusively Klarna), and crypto trading (BTC/ETH via Zerohash since Jan 2026).
- **Klarna**: Exclusive BNPL provider since March 2025. Klarna offered 15.3M stock warrants (~$500M) to seal the deal — illustrating the scale of commitment Walmart expects.
- **Walmart Pay**: In-app QR payment at self-checkout.
- **Walmart Connect**: Advertising platform with REST APIs (Sponsored Search, Display, Video). Accounts for >25% of operating income in Q4 2025.

### Agentic AI Initiatives

- **Four "Super Agents"**: Serving customers, associates, partners, and developers. **WIBEY** is the developer-focused agent — a unified entry point for intelligent action across Walmart's systems.
- **OpenAI Partnership** (Oct 2025): Customers can shop Walmart through ChatGPT using "Instant Checkout."
- **Google/Gemini Partnership** (Jan 2026): Built on UCP. Gemini automatically surfaces Walmart products when relevant.
- **UCP**: Open-source standard for agentic commerce — discovery, consideration, purchase, and order management. Compatible with AP2 for payments. Co-created with Google, Shopify, Target, Visa, Mastercard, Stripe, Adyen.
- **AI Supplier Negotiations**: Pactum's AI chatbot negotiates with thousands of smaller suppliers (64-68% close rate).

### Stablecoin & Crypto Timeline

| Year | Event |
|------|-------|
| 2016 | Walmart + IBM Hyperledger supply chain trials |
| 2017 | Joins IBM Food Trust consortium (Dole, Nestle, Tyson) |
| 2018 | Multiple blockchain patents (energy, health records, drones) |
| 2019 | **Stablecoin patent filed** (USD-backed digital currency for payments, payroll, financial inclusion) |
| 2021 | Hires "Digital Currency and Cryptocurrency Product Lead" at Bentonville HQ |
| 2021 | Founds Hazel fintech (later OnePay) with Ribbit Capital |
| 2025 (Jun) | **WSJ: Walmart exploring own stablecoin issuance** |
| 2025 (Jul) | GENIUS Act signed — enables non-bank stablecoin issuance |
| 2025 (Oct) | OnePay announces BTC/ETH trading via Zerohash |
| 2025 (Oct) | Walmart–OpenAI partnership for ChatGPT shopping |
| 2026 (Jan) | OnePay Crypto goes live. Walmart–Google UCP partnership at NRF. |

### Developer APIs

Available via developer.walmart.com:
- Marketplace API (100K+ third-party sellers)
- Supplier API
- Transportation API
- Commerce API (requires additional approval + "sound business case")
- Advertising API (Walmart Connect)

---

## Entry Points & Decision Makers

### How Fintechs Have Approached Walmart

**Affirm (2017–2025):**
1. Started on Walmart-owned sub-brands (Art.com, Allswell, Hayneedle) — low-risk proof point
2. ~18 months of pilot before formal announcement
3. Took almost a year to build in-store technology for Walmart specifically
4. Formal partnership announced Feb 2019 — 4,000 Supercenters + Walmart.com
5. Lost to Klarna in March 2025 (outbid on financial terms + AI differentiation)

**Lesson:** Start small on adjacent properties. Build Walmart-specific technology. Be prepared for eventual commoditization.

**Klarna (2025):**
- $500M in stock warrants + AI marketing differentiation
- Routed through OnePay (Walmart's fintech arm)
- Timed to Klarna's IPO preparation

**Lesson:** Walmart expects significant skin in the game from payment partners.

### Warm Introduction Paths (Ranked)

1. **Through Google / Coinbase / Cloudflare** — PincerPay builds on x402 (Coinbase's protocol). Coinbase + Google collaborate on AP2. Recognition by x402 Foundation enables introductions to Walmart's UCP team. **Highest probability warm path.**
2. **Through Shopify** — Co-developed UCP. If PincerPay has Shopify merchants as customers, Shopify's partnership team could facilitate introductions.
3. **Through UCP Working Group** — As a facilitator implementing UCP + AP2 + x402, PincerPay has a legitimate seat at the table. Working group meetings include Walmart's technical team.
4. **Walmart Converge** (August, Bengaluru) — Walmart Global Tech's flagship developer conference. Sessions on agentic AI and developer tools. Contact: converge@walmart.com.
5. **Direct outreach to Walmart Global Tech** — Target engineers/PMs on WIBEY, Marketplace APIs, or Walmart Connect.
6. **Supplier application** — Register at corporate.walmart.com as Technology & IT Professional Services supplier. Formal but slow.

### Innovation Entry Points

- **Store No. 8**: Shut down in early 2024. Innovation is now "fully embedded" across the org — no single front door.
- **Walmart Global Tech**: The de facto innovation arm. Based in Bentonville, AR and Bengaluru, India.

### Key Conferences

| Event | Timing | Why |
|-------|--------|-----|
| **NRF: Retail's Big Show** | January, NYC | Premier retail-tech conference. Furner keynoted with Google's Pichai in 2026. |
| **Walmart Converge** | August, Bengaluru | Walmart Global Tech's flagship. Agentic AI + developer tools. |
| **Walmart API Virtual Summit** | Quarterly | Marketplace-focused developer events. |
| **CES** | January, Las Vegas | Walmart Connect presence. |

---

## Competitive Landscape

### Payment Partners in Walmart's Orbit

| Partner | Role | How They Got In |
|---------|------|-----------------|
| Klarna | Exclusive BNPL (via OnePay) | $500M warrants + AI differentiation |
| Zerohash | Crypto trading for OnePay | B2B infrastructure deal |
| Green Dot | Prepaid debit cards | Long-standing financial services partner |
| MoneyGram | Money transfers | Financial services at MoneyCenters |
| Pactum | AI supplier negotiations | B2B SaaS partnership |
| Google | Agentic commerce (UCP/Gemini) | Platform-level strategic partnership |
| OpenAI | ChatGPT Instant Checkout | Platform-level strategic partnership |

### Crypto Payment Companies at Retail (Not Walmart)

| Company | Retailer Presence | Strategy |
|---------|------------------|----------|
| Flexa | 41K+ locations (Home Depot, Regal Cinemas) | POS integration partners (NCR, InComm) |
| BitPay | AT&T, IKEA, Ralph Lauren | Integrate with existing payment flows |
| Coinbase Commerce | SMB/e-commerce | Merchant crypto acceptance |

**No crypto payment company has a direct partnership with Walmart for consumer checkout.** OnePay/Zerohash is the closest — and it's an internal play.

---

## Use Cases

### Tier 1: Highest Probability (API/Machine Economy)

#### 1. Walmart Connect API Monetization via x402

Walmart Connect's advertising APIs serve sponsored search, display, and video management for marketplace sellers. PincerPay enables **pay-per-call pricing** for premium endpoints (real-time analytics, campaign optimization, attribution data) using x402.

- **Why it fits:** Walmart Connect is >25% of operating income. Micropayment API monetization aligns with the agentic economy.
- **Entry angle:** "Walmart Connect API Extension" — new revenue model without changing existing infrastructure.

#### 2. Agentic Commerce Settlement Layer

Walmart co-created UCP. x402 is already integrated into Google's AP2 as the stablecoin rail. PincerPay serves as the **x402 facilitator** for agent-to-Walmart transactions within UCP/AP2.

- **Why it fits:** Walmart's "four super agents" need payment settlement for inter-agent commerce.
- **Entry angle:** Demonstrate PincerPay as a UCP-compatible x402 facilitator for Walmart's developer agents.

#### 3. Walmart Marketplace Seller API Payments

100K+ sellers use Marketplace APIs. PincerPay enables **USDC-based instant settlement** for seller payouts, replacing 3-5 day ACH.

- **Why it fits:** Faster payouts attract sellers. Stablecoin costs a fraction of ACH/wire fees.

### Tier 2: Medium Probability (B2B/Supply Chain)

#### 4. Cross-Border Supplier Payments

USDC settlement for international supplier invoices on Solana. B2B cross-border payments are $120B/year industry-wide.

- **Why it fits:** Walmart already tested blockchain for Canadian freight with positive results. B2B stablecoin payments grew 733% YoY in 2025.

#### 5. Commerce API Pay-Per-Use

x402-gated Commerce API access where developers pay per transaction in USDC.

- **Why it fits:** Commerce API already requires "additional approval and a sound business case." x402 adds self-service monetization.

### Tier 3: Lower Probability (Consumer-Facing)

#### 6. Stablecoin Checkout via OnePay

If Walmart issues its own stablecoin, PincerPay could provide x402 settlement infrastructure.

- **Why it's lower probability:** OnePay + Zerohash already handle crypto. Walmart would likely build in-house or use Circle/Stripe.

---

## The Five-Phase Strategy

### Phase 1: Credibility Building (Months 1–9)

**Objective:** Build the technical foundation and social proof that makes Walmart take a meeting.

**Technical prerequisites:**
- [ ] Deploy facilitator to **Solana mainnet** (currently devnet)
- [ ] Complete end-to-end mainnet payment tests
- [ ] Implement OFAC screening / sanctions compliance
- [ ] Obtain **SOC 2 Type II certification** (~6-9 months)
- [ ] Commission **third-party security audit** (Trail of Bits, Halborn, or similar)
- [ ] Implement UCP compatibility (`.well-known/ucp` already in PincerPay spec)
- [ ] Build AP2 mandate format compatibility
- [ ] Process **$1M+ cumulative transaction volume** through real merchants

**Reference customers:**
- Sign 3-5 mid-market merchants with real volume
- Prioritize merchants in Walmart's orbit: Marketplace sellers, Connect advertisers, or Shopify merchants (Shopify is a UCP co-creator)
- Target at least one recognized brand name as case study

**Ecosystem positioning:**
- Apply to join **x402 Foundation** (Coinbase + Cloudflare)
- Engage with **UCP working group** (Google, Shopify, Walmart are co-creators)
- Publish technical content on agentic commerce payments
- Attend **Walmart Converge 2026** (August, Bengaluru) and **NRF 2027** (January, NYC)

**Team:**
- Hire/contract **Head of Enterprise Sales** with Fortune 500 retail experience
- Hire/contract **Compliance Lead** with MTL/AML/OFAC experience
- Consider advisory board member with Walmart or retail executive connections

**Estimated cost:** $200K–$500K

### Phase 2: Initial Contact (Months 6–12)

**Objective:** Get a meeting with Walmart Global Tech (payments, APIs, or agentic commerce team).

**Approach:**

Do NOT pitch "crypto payments for Walmart checkout." Instead:

> **Pitch:** "x402 settlement infrastructure for Walmart's agentic commerce APIs."
>
> **Frame:** PincerPay enables Walmart's AI agents (Sparky, WIBEY, third-party agents via UCP) to make and receive micropayments in USDC over HTTP — no accounts, no API keys, no billing cycles.
>
> **Proof point:** Working demo where a third-party AI agent pays for Walmart Connect API access via x402/PincerPay, settles in USDC on Solana in <1 second.
>
> **Business case:** New revenue model for Walmart's API economy. Every API call generates revenue without traditional invoicing overhead.

**Estimated cost:** $50K–$100K (conferences, travel, outreach, demo development)

### Phase 3: Pilot Proposal (Months 12–18)

**Objective:** Propose a low-risk, high-signal pilot that doesn't need board-level approval.

**Recommended pilot: "x402-Gated Premium API Access for Walmart Connect"**

| Dimension | Detail |
|-----------|--------|
| **Scope** | Premium real-time analytics endpoints for Walmart Connect advertising partners |
| **Settlement** | USDC on Solana via PincerPay facilitator |
| **Duration** | 90 days |
| **Partners** | 5-10 advertising partners (Pacvue, Skai, DataCaciques) |
| **Pricing** | Pay-per-call in USDC (e.g., $0.01/call) alongside traditional billing |

**Why this pilot works:**
- **Low risk** — Doesn't touch consumer checkout, OnePay, or core commerce
- **Measurable** — Transaction volume, API calls, revenue, latency
- **Aligned** — Walmart Connect already has an API partner ecosystem
- **Trendy** — x402 endorsed by Google, Cloudflare, Coinbase. Walmart is a UCP co-creator
- **Small team** — Only Walmart Connect API team + PincerPay

**Alternative pilot:** x402 settlement layer for WIBEY (developer super agent) when interacting with external paid APIs.

**Estimated cost:** $100K–$200K

### Phase 4: Proof of Value (Months 18–24)

**Target metrics for a successful pilot:**

| Metric | Target |
|--------|--------|
| Transactions processed | 10,000+ during 90-day pilot |
| Average settlement time | <500ms |
| Uptime | 99.9%+ |
| Incremental revenue | $10K+ for Walmart Connect |
| Security incidents | Zero |
| Partner satisfaction | Positive from 3+ partners |

**Deliverables:**
- Analytics dashboard (transactions, volume, latency, error rates)
- ROI analysis: x402 micropayments vs. traditional monthly invoicing
- Partner satisfaction survey
- Security audit results from pilot period

**Estimated cost:** $50K–$100K

### Phase 5: Scale (Months 24–36+)

**Expansion path if pilot succeeds:**

1. **Walmart Connect (full rollout)** — All advertising API endpoints support x402 pricing. AI advertising agents autonomously manage and pay for campaigns.
2. **Walmart Marketplace APIs** — Sellers and their AI agents pay for premium services (analytics, inventory optimization, repricing) via x402.
3. **Supplier Payment Settlement** — USDC instant settlement for smaller suppliers (same segment where Pactum AI negotiates deals). Replaces 30-60 day net terms.
4. **UCP/AP2 Facilitator** — PincerPay becomes a recognized x402 facilitator within Walmart's UCP implementation. Any AI agent in the Google/OpenAI ecosystem can transact with Walmart APIs using USDC.
5. **Consumer-Adjacent (long-term)** — If Walmart issues its own stablecoin, PincerPay's infrastructure supports settlement. 3-5 years out.

**Estimated cost:** $200K–$500K

---

## Regulatory & Compliance Requirements

### What PincerPay Needs Before Approaching

| Requirement | Status | Priority | Notes |
|-------------|--------|----------|-------|
| **SOC 2 Type II** | Not started | Critical | 6-9 month process. ~$50-100K. Non-negotiable for Fortune 10. |
| **Third-party security audit** | Not started | Critical | Trail of Bits, Halborn, or similar. ~$50-150K. |
| **OFAC screening** | In roadmap (Phase S4) | High | Accelerate. Partner with Chainalysis, Elliptic, or TRM Labs. |
| **AML/KYC compliance** | Partial | High | Walmart requires robust AML/KYC from any payments partner. |
| **Money transmitter licensing** | N/A if non-custodial | Medium | PincerPay as non-custodial facilitator (verify + broadcast, never hold funds) avoids MTL. If taking custody, need state licenses or licensed partner. |
| **PCI DSS** | Likely N/A | Low | PincerPay uses stablecoin rails, not card rails. Walmart may require equivalent security cert (SOC 2 covers this). |

---

## Risk Factors & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Walmart builds x402 in-house** | Medium | High | Move fast. Become reference facilitator before Walmart invests. Make PincerPay cheaper/faster than building. |
| **Walmart stablecoin with closed-loop settlement** | Medium | High | Position as complementary (settlement for external agents), not competing with internal stablecoin. |
| **PincerPay is too small for vendor risk assessment** | High | High | **Biggest risk.** Mitigate with: SOC 2, security audit, VC funding for runway, partner with larger entity (Coinbase/Cloudflare) for endorsement. |
| **Regulatory change blocks stablecoin payments** | Low | High | GENIUS Act is law. Monitor amendments. Maintain traditional payment rail compatibility. |
| **x402 protocol loses traction** | Low-Medium | High | x402 has Google, Cloudflare, Coinbase, Visa backing. Maintain EVM + traditional rail compatibility as hedge. |
| **Walmart's agentic commerce timeline slips** | Medium | Medium | Even if delayed, Walmart Connect API use case stands independently. |
| **Competitor facilitator with more resources** | Medium | Medium | First-mover in Solana-native x402. Anchor program on Solana is differentiation. |

---

## Timeline & Budget

| Phase | Timeline | Cost | Key Milestone |
|-------|----------|------|---------------|
| **1. Credibility** | Months 1–9 | $200K–$500K | SOC 2, mainnet, $1M+ volume, security audit, UCP compat |
| **2. Contact** | Months 6–12 | $50K–$100K | Meeting with Walmart Global Tech or Connect team |
| **3. Pilot** | Months 12–18 | $100K–$200K | Signed pilot for Walmart Connect API x402 integration |
| **4. Proof** | Months 18–24 | $50K–$100K | 10K+ transactions, positive ROI demo |
| **5. Scale** | Months 24–36+ | $200K–$500K | Expansion to Marketplace, supplier payments |
| **TOTAL** | **~3 years** | **$600K–$1.4M** | **Walmart as marquee PincerPay merchant** |

```
Month:  1    3    6    9    12   15   18   21   24   30   36
        │    │    │    │    │    │    │    │    │    │    │
        ├────┴────┴────┴────┤    │    │    │    │    │    │
        │  PHASE 1: CREDIBILITY  │    │    │    │    │    │
        │  SOC 2, mainnet,  │    │    │    │    │    │    │
        │  security audit   │    │    │    │    │    │    │
        │                   │    │    │    │    │    │    │
        │         ├─────────┴────┤    │    │    │    │    │
        │         │ PHASE 2: CONTACT  │    │    │    │    │
        │         │ Get meeting  │    │    │    │    │    │
        │         │              │    │    │    │    │    │
        │         │    ├─────────┴────┴────┤    │    │    │
        │         │    │  PHASE 3: PILOT   │    │    │    │
        │         │    │  90-day test on   │    │    │    │
        │         │    │  Walmart Connect  │    │    │    │
        │         │    │                   │    │    │    │
        │         │    │         ├─────────┴────┤    │    │
        │         │    │         │ PHASE 4: PROOF    │    │
        │         │    │         │ 10K+ txns, ROI    │    │
        │         │    │         │                   │    │
        │         │    │         │    ├──────────────┴────┤
        │         │    │         │    │  PHASE 5: SCALE   │
        │         │    │         │    │  Full rollout     │
```

---

## The Core Thesis

**PincerPay's path into Walmart is through the API economy, not the checkout counter.**

Walmart is building an agentic commerce platform where AI agents autonomously discover, evaluate, and purchase goods. UCP + AP2 + x402 is the emerging standard stack. PincerPay already builds on x402 with native AP2 architecture.

The strategy:
1. Become a recognized x402 facilitator in the UCP/AP2 ecosystem
2. Land reference customers in Walmart's orbit (Marketplace sellers, Connect advertisers, Shopify merchants)
3. Propose a low-risk pilot on Walmart Connect APIs (not consumer checkout)
4. Demonstrate measurable value (new revenue, lower settlement costs, faster payments)
5. Expand into broader API commerce and supply chain settlement

The window for PincerPay to establish itself before larger players crowd the space is approximately **12–18 months**.

---

## Sources

- [Walmart & Amazon Explore Stablecoins — PYMNTS](https://www.pymnts.com/cryptocurrency/2025/walmart-amazon-explore-stablecoins-as-senate-advances-regulatory-framework/)
- [Walmart Stablecoin Gambit — RetailWire](https://retailwire.com/walmarts-stablecoin-gambit-reinventing-payments-at-scale/)
- [OnePay BTC/ETH Trading — CoinDesk](https://www.coindesk.com/business/2025/10/04/walmart-backed-onepay-to-add-bitcoin-and-ether-trading-to-finance-app-cnbc/)
- [OnePay Goes Live — CrowdFund Insider](https://www.crowdfundinsider.com/2026/01/257145-walmart-backed-onepay-goes-live-with-bitcoin-payments-for-150-million-weekly-us-shoppers/)
- [Walmart AI Leadership — CIO Dive](https://www.ciodive.com/news/walmart-ai-leadership-super-agents/753975/)
- [Walmart "All In" on Agents — Fortune](https://fortune.com/2025/07/24/walmart-ai-agents-sparky-agentic-shopping/)
- [Walmart + Google UCP — Walmart Corporate](https://corporate.walmart.com/news/2026/01/11/walmart-and-google-turn-ai-discovery-into-effortless-shopping-experiences)
- [Walmart + OpenAI — Walmart Corporate](https://corporate.walmart.com/news/2025/10/14/walmart-partners-with-openai-to-create-ai-first-shopping-experiences)
- [Universal Commerce Protocol — Google Developers Blog](https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/)
- [UCP Announcement — TechCrunch](https://techcrunch.com/2026/01/11/google-announces-a-new-protocol-to-facilitate-commerce-using-ai-agents/)
- [WIBEY Developer Agent — Walmart Global Tech](https://tech.walmart.com/content/walmart-global-tech/en_us/blog/post/wibey-announcement.html)
- [Walmart Agentic Future — Walmart Corporate](https://corporate.walmart.com/news/2025/05/29/inside-walmarts-strategy-for-building-an-agentic-future)
- [Klarna Warrants for Walmart — PYMNTS](https://www.pymnts.com/bnpl/2025/klarna-offered-15-million-warrants-to-seal-walmart-partnership/)
- [Klarna Wins Walmart — CNBC](https://www.cnbc.com/2025/03/17/walmart-klarna-nearing-ipo-wins-fintech-partnership-from-affirm.html)
- [Affirm + Walmart — TechCrunch](https://techcrunch.com/2019/02/27/affirms-latest-partnership-brings-its-alternative-financing-to-walmarts-u-s-stores-and-website/)
- [Walmart Stablecoin Patent — CryptoSlate](https://cryptoslate.com/walmart-patents-own-cryptocurrency-battle-amazon-retail/)
- [Walmart Blockchain — Nasdaq](https://www.nasdaq.com/articles/walmart-taps-blockchain-technology-for-several-patents-2018-09-13)
- [Store No. 8 Shutdown — InnoLead](https://www.innovationleader.com/topics/articles-and-content-by-topic/innovation-labs-and-spaces/walmart-is-shutting-down-its-store-no-8-innovation-lab-heres-what-that-means-for-other-corporate-innovators/)
- [x402 Protocol](https://www.x402.org/)
- [Google AP2 + x402 — Coinbase](https://www.coinbase.com/developer-platform/discover/launches/google_x402)
- [AP2 Protocol — Google Cloud](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol)
- [GENIUS Act — Congress.gov](https://www.congress.gov/119/plaws/publ27/PLAW-119publ27.pdf)
- [GENIUS Act Analysis — Gibson Dunn](https://www.gibsondunn.com/the-genius-act-a-new-era-of-stablecoin-regulation/)
- [GENIUS Act & MTL — K&L Gates](https://www.klgates.com/The-GENIUS-Act-and-Stablecoins-Could-This-Replace-State-Money-Transmitter-Licensing-10-6-2025)
- [Stablecoins in B2B Payments — McKinsey](https://www.mckinsey.com/industries/financial-services/our-insights/stablecoins-in-payments-what-the-raw-transaction-numbers-miss)
- [Walmart Developer Portal](https://developer.walmart.com/)
- [Walmart Connect API](https://www.walmartconnect.com/resources/articles/2025/partner-network-display-advertising-api)
- [Walmart Converge](https://public.walmart.com/content/converge/en_in.html)
- [NRF 2026 — John Furner Keynote](https://nrfbigshow.nrf.com/speaker/john-furner)
- [Walmart Supplier Application](https://corporate.walmart.com/suppliers/apply-to-be-a-supplier/service-non-resale)
