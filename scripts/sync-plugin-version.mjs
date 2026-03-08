#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";

const mcp = JSON.parse(readFileSync("packages/mcp/package.json", "utf8"));
const pluginPath = "extensions/claude-code/.claude-plugin/plugin.json";
const plugin = JSON.parse(readFileSync(pluginPath, "utf8"));

if (plugin.version !== mcp.version) {
  plugin.version = mcp.version;
  writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + "\n");
  console.log(`plugin.json version synced to ${mcp.version}`);
} else {
  console.log(`plugin.json already at ${mcp.version}`);
}
