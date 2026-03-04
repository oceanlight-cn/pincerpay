---
title: "MCP Server"
description: "Connect PincerPay to Claude Code, Cursor, Windsurf, and any MCP-compatible AI assistant."
order: 3.5
section: "SDKs"
---

The `@pincerpay/mcp` package is a [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI coding assistants direct access to PincerPay's chain configs, code scaffolding, gas estimates, documentation, and transaction tools. Connect it to Claude Code, Cursor, Windsurf, or any MCP-compatible client.

## Quick Start

### Claude Code

```bash
claude mcp add pincerpay -- npx -y @pincerpay/mcp
```

That's it. Claude Code will automatically discover and use the PincerPay tools.

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pincerpay": {
      "command": "npx",
      "args": ["-y", "@pincerpay/mcp"],
      "env": {
        "PINCERPAY_API_KEY": "pp_live_your_key_here"
      }
    }
  }
}
```

### Cursor

Settings > Tools & MCP > Add Server:

```json
{
  "mcpServers": {
    "pincerpay": {
      "command": "npx",
      "args": ["-y", "@pincerpay/mcp"],
      "env": {
        "PINCERPAY_API_KEY": "pp_live_your_key_here"
      }
    }
  }
}
```

### Windsurf

Add via the Cascade MCP panel or `mcp.json`:

```json
{
  "mcpServers": {
    "pincerpay": {
      "command": "npx",
      "args": ["-y", "@pincerpay/mcp"],
      "env": {
        "PINCERPAY_API_KEY": "pp_live_your_key_here"
      }
    }
  }
}
```

### Remote (Streamable HTTP)

Run as a standalone HTTP server for remote or shared environments:

```bash
npx @pincerpay/mcp --transport=http --port=3100 --api-key=pp_live_your_key
```

## Tools

The MCP server exposes 7 tools that your AI assistant can call:

| Tool | Description | Auth Required |
|------|-------------|:---:|
| `list-supported-chains` | List supported chains and USDC configs | No |
| `estimate-gas-cost` | Estimate gas fees per chain | No |
| `validate-payment-config` | Validate merchant config with route pattern checks | No |
| `scaffold-x402-middleware` | Generate Express/Hono/Next.js middleware | No |
| `scaffold-agent-client` | Generate agent fetch wrapper with spending policies | No |
| `generate-ucp-manifest` | Create commerce discovery manifest | No |
| `check-transaction-status` | Query transaction status | Yes |

## Resources

| Resource | URI | Description |
|----------|-----|-------------|
| Chain configs | `chain://{shorthand}` | Config for any of the 6 supported chains |
| OpenAPI spec | `pincerpay://openapi` | Live facilitator OpenAPI spec |
| Documentation | `docs://pincerpay/{topic}` | Embedded docs (5 topics) |

### Doc Topics

The server embeds full documentation that your assistant can read on demand:

| Topic | URI | Content |
|-------|-----|---------|
| Getting Started | `docs://pincerpay/getting-started` | Prerequisites, Choose Your Path (merchant vs agent), devnet/mainnet, key concepts |
| Merchant Guide | `docs://pincerpay/merchant` | Express, Hono, and Next.js middleware setup, multi-chain routes, config reference |
| Agent Guide | `docs://pincerpay/agent` | Agent setup, spending policies (base units), runtime management, properties |
| Troubleshooting | `docs://pincerpay/troubleshooting` | Common issues table, devnet funding, debugging tips |
| Reference | `docs://pincerpay/reference` | Chain shorthands, USDC amounts, package exports, API methods |

## Prompts

Interactive prompts guide your assistant through common workflows:

| Prompt | Description |
|--------|-------------|
| `get-started` | Interactive onboarding — determines your role and guides you to the right flow |
| `integrate-merchant` | Step-by-step merchant SDK integration (Express, Hono, or Next.js) |
| `integrate-agent` | Agent SDK setup with spending policies and gas estimates |
| `debug-transaction` | Transaction troubleshooting by hash/signature |

## Try It

After connecting, paste any of these into your AI assistant:

- "Set up PincerPay merchant middleware for my Express app"
- "Scaffold an agent client with a $5/day spending limit on Solana"
- "What chains does PincerPay support? Show me gas costs for each"
- "Generate a UCP manifest for my API"
- "Check the status of this transaction: 5UxK3..."
- "Help me debug why my agent is getting 402 errors"

## API Key

Get your API key from [pincerpay.com/dashboard/settings](https://pincerpay.com/dashboard/settings).

Developer tools (scaffolding, gas estimates, chain listing, config validation) work **without** an API key. Operations tools (transaction status) require one.

For Claude Code, pass the key as an environment variable:

```bash
claude mcp add pincerpay -e PINCERPAY_API_KEY=pp_live_your_key -- npx -y @pincerpay/mcp
```

## CLI Options

```
--api-key=KEY           PincerPay API key (or PINCERPAY_API_KEY env var)
--facilitator-url=URL   Custom facilitator URL (or PINCERPAY_FACILITATOR_URL)
--transport=stdio|http  Transport type (default: stdio)
--port=PORT             HTTP port (default: 3100, only with --transport=http)
```
