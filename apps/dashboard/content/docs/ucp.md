---
title: "UCP: Agent-Readable Commerce Discovery"
description: How UCP manifests let agents discover what a merchant sells, how to pay, and what they'll get.
order: 4.3
section: Learn
---

The Universal Commerce Protocol lets agents discover what a merchant sells, how to pay, and what they'll get, all from a single machine-readable endpoint.

Without UCP, an agent needs hardcoded knowledge of every API it interacts with. With UCP, any agent can browse any merchant's offerings at runtime.

## The Manifest

Merchants publish a `/.well-known/ucp` JSON manifest:

```json
{
  "name": "WeatherAPI",
  "description": "Real-time weather data for AI agents",
  "version": "1.0",
  "payment": {
    "handler": "pincerpay",
    "chains": ["solana"],
    "token": "USDC"
  },
  "endpoints": [
    {
      "path": "/api/weather",
      "method": "GET",
      "price": "0.01",
      "description": "Current weather for a given location",
      "params": {
        "city": { "type": "string", "required": true }
      }
    }
  ]
}
```

## How Agents Use It

1. Agent fetches `https://merchant.com/.well-known/ucp`
2. Agent reads available endpoints, prices, and required parameters
3. Agent decides whether to purchase based on its mandate and budget
4. Agent calls the endpoint, handles the [x402 flow](/docs/x402), gets the data

UCP turns every API into a browsable storefront for agents.

## Generating a Manifest

The PincerPay [MCP server](https://github.com/ds1/pincerpay/tree/master/packages/mcp) includes a `generate-ucp-manifest` tool that creates a manifest from your paywall configuration. You can also write one by hand or generate it from your route definitions.
