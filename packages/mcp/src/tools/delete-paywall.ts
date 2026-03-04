import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FacilitatorClient } from "../client.js";

const inputSchema = {
  id: z.string().uuid().describe("Paywall UUID to delete."),
};

export function registerDeletePaywall(
  server: McpServer,
  client: FacilitatorClient,
) {
  server.tool(
    "delete-paywall",
    "Permanently delete a paywalled endpoint. This cannot be undone. " +
      "Use update-paywall with isActive=false to disable without deleting. " +
      "Requires a PincerPay API key.",
    inputSchema,
    async ({ id }) => {
      try {
        client.requireAuth();
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: err instanceof Error ? err.message : String(err) }],
          isError: true,
        };
      }

      try {
        await client.deletePaywall(id);
        return {
          content: [{ type: "text" as const, text: `Paywall ${id} deleted successfully.` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Failed to delete paywall: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );
}
