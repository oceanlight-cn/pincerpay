import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerManagePaywallsPrompt(server: McpServer) {
  server.prompt(
    "manage-paywalls",
    "Manage paywalled endpoints: list, create, update, delete, or review configuration. " +
      "Orchestrates the paywall CRUD tools for your merchant account.",
    {
      action: z
        .enum(["list", "create", "update", "delete", "review"])
        .describe("What to do with paywalls."),
    },
    ({ action }) => {
      const instructions: Record<string, string> = {
        list: `Please list all my paywalled endpoints using the list-paywalls tool.
Show them in a clear table format with: endpoint pattern, USDC price, active status, and creation date.
If I have no paywalls, suggest creating one.`,
        create: `I want to create a new paywalled endpoint.
Ask me for:
1. The endpoint pattern (HTTP method + path, e.g. "GET /api/weather")
2. The USDC price (e.g. "0.01")
3. An optional description
4. Whether to restrict to specific chains (or use my merchant defaults)

Then use the create-paywall tool to create it.
After creation, suggest using validate-payment-config to verify the setup.`,
        update: `I want to update an existing paywall.
First, use list-paywalls to show my current paywalls.
Then ask which one to update and what to change (price, description, chains, or active status).
Use the update-paywall tool to apply changes.`,
        delete: `I want to delete a paywall.
First, use list-paywalls to show my current paywalls.
Then ask which one to delete. Warn that this is permanent — suggest disabling (isActive=false) via update-paywall as an alternative.
If confirmed, use the delete-paywall tool.`,
        review: `Please review my paywall configuration for best practices.
1. Use list-paywalls to fetch all paywalls
2. Check for: unreasonably low prices (< $0.001), inactive paywalls that might be forgotten, missing descriptions
3. Use get-merchant-profile to check my supported chains
4. Suggest improvements and warn about any issues`,
      };

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: instructions[action],
            },
          },
        ],
      };
    },
  );
}
