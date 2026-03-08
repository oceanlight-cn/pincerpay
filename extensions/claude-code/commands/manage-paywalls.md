---
description: Manage paywalled endpoints — list, create, update, delete, or review configuration
argument-hint: [list | create | update | delete | review]
---

# Manage Paywalls

Help the user manage their paywalled endpoints. If an argument is provided, go directly to that action. Otherwise, ask what they want to do.

## Actions

### list
List all paywalled endpoints using the `list-paywalls` tool. Show them in a clear table format with: endpoint pattern, USDC price, active status, and creation date. If there are no paywalls, suggest creating one.

### create
Create a new paywalled endpoint. Ask the user for:
1. The endpoint pattern (HTTP method + path, e.g., `"GET /api/weather"`)
2. The USDC price (e.g., `"0.01"`)
3. An optional description
4. Whether to restrict to specific chains (or use merchant defaults)

Then use the `create-paywall` tool. After creation, suggest using `validate-payment-config` to verify the setup.

### update
Update an existing paywall. First, use `list-paywalls` to show current paywalls. Then ask which one to update and what to change (price, description, chains, or active status). Use the `update-paywall` tool to apply changes.

### delete
Delete a paywall. First, use `list-paywalls` to show current paywalls. Then ask which one to delete. Warn that this is permanent — suggest disabling (`isActive=false`) via `update-paywall` as a safer alternative. If confirmed, use the `delete-paywall` tool.

### review
Review paywall configuration for best practices:
1. Use `list-paywalls` to fetch all paywalls
2. Check for: unreasonably low prices (< $0.001), inactive paywalls that might be forgotten, missing descriptions
3. Use `get-merchant-profile` to check supported chains
4. Suggest improvements and warn about any issues
