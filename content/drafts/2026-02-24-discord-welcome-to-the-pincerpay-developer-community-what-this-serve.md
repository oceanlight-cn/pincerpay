---
id: >-
  2026-02-24-discord-welcome-to-the-pincerpay-developer-community-what-this-serve
title: >-
  Welcome to the PincerPay developer community — what this server is for,
  channel 
channel: discord
type: discord-announcement
status: draft
created_at: '2026-02-20T21:48:54.154Z'
updated_at: '2026-02-20T21:48:54.154Z'
scheduled_for: '2026-02-24T14:00:00Z'
published_at: null
platform_id: null
platform_url: null
calendar_week: week-1
topic_brief: >-
  Welcome to the PincerPay developer community — what this server is for,
  channel guide, how to get help
tags: []
generation_model: claude-sonnet-4-6
review_notes: ''
rejection_reason: ''
metrics:
  impressions: null
  engagement: null
  clicks: null
  pulled_at: null
---
**[Community]** Welcome to PincerPay

This is the developer community for PincerPay — an x402 payment gateway that lets AI agents pay for HTTP resources using USDC. If you're building agents that consume APIs, or APIs that want to monetize agent traffic, you're in the right place.

**Channels:**
• **#announcements** — releases, breaking changes, new features
• **#support** — stuck on an integration? ask here, we respond fast
• **#showcase** — share what you're building with PincerPay
• **#general** — everything else

**Getting started:**
```bash
npm install @pincerpay/merchant @pincerpay/agent
```

Merchants add 3 lines of Express middleware. Agents wrap `fetch()`. That's the integration.

**What PincerPay is:** Non-custodial USDC payments on Solana (~$0.0001/transaction). Agents keep their own keys. Settlement in 400ms.

**What it isn't:** a wallet, a DeFi protocol, or a walled garden. We implement open standards — x402, AP2, UCP.

→ Docs: https://docs.pincerpay.com
→ Try the demo: https://demo.pincerpay.com
→ GitHub: https://github.com/ds1/pincerpay
