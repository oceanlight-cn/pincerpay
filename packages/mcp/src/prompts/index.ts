import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetStartedPrompt } from "./get-started.js";
import { registerMerchantPrompt } from "./integrate-merchant.js";
import { registerAgentPrompt } from "./integrate-agent.js";
import { registerDebugPrompt } from "./debug-transaction.js";
import { registerManagePaywallsPrompt } from "./manage-paywalls.js";
import { registerMonitorPaymentsPrompt } from "./monitor-payments.js";

export function registerPrompts(server: McpServer) {
  registerGetStartedPrompt(server);
  registerMerchantPrompt(server);
  registerAgentPrompt(server);
  registerDebugPrompt(server);
  registerManagePaywallsPrompt(server);
  registerMonitorPaymentsPrompt(server);
}
