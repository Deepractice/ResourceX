#!/usr/bin/env node

/**
 * ResourceX MCP Server
 *
 * Provides AI agents with tools to discover, use, and publish AI resources.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { NodeProvider } from "@resourcexjs/node-provider";
import { FastMCP } from "fastmcp";
import { createResourceX, setProvider } from "resourcexjs";
import { roleType } from "rolexjs";

// Register Node.js provider
setProvider(new NodeProvider());

import { instructions } from "./instructions.js";
import { addTool, infoTool, ingestTool, listTool, pushTool, searchTool } from "./tools/index.js";

// ============================================
// Configuration: env var > shared config file
// ============================================

function readSharedConfig(): { registry?: string; path?: string } {
  try {
    const rxHome =
      process.env.RESOURCEX_HOME ||
      process.env.RX_HOME ||
      join(homedir(), ".deepractice", "resourcex");
    const configPath = join(rxHome, "config.json");
    if (existsSync(configPath)) {
      const raw = JSON.parse(readFileSync(configPath, "utf-8"));

      // Support multi-registry: find default registry URL
      if (raw.registries && Array.isArray(raw.registries)) {
        const defaultEntry = raw.registries.find((r: { default?: boolean }) => r.default);
        return { registry: defaultEntry?.url, path: raw.path };
      }

      // Backward compat: old single registry field
      return { registry: raw.registry, path: raw.path };
    }
  } catch {
    // Ignore
  }
  return {};
}

const sharedConfig = readSharedConfig();

// Environment variables take precedence over shared config
const registry = process.env.RESOURCEX_REGISTRY ?? sharedConfig.registry;
const storagePath = process.env.RESOURCEX_PATH ?? sharedConfig.path;

// Initialize ResourceX client
const rx = createResourceX({
  registry,
  path: storagePath,
});

// Register role type from RoleX
rx.supportType(roleType);

// Create MCP server
const server = new FastMCP({
  name: "resourcex",
  version: "0.1.0",
  instructions,
});

// ============================================
// Consumer Tools
// ============================================

server.addTool({
  name: searchTool.name,
  description: searchTool.description,
  parameters: searchTool.parameters,
  execute: searchTool.execute(rx),
});

server.addTool({
  name: ingestTool.name,
  description: ingestTool.description,
  parameters: ingestTool.parameters,
  execute: ingestTool.execute(rx),
});

server.addTool({
  name: infoTool.name,
  description: infoTool.description,
  parameters: infoTool.parameters,
  execute: infoTool.execute(rx),
});

server.addTool({
  name: listTool.name,
  description: listTool.description,
  parameters: listTool.parameters,
  execute: listTool.execute(rx),
});

// ============================================
// Author Tools
// ============================================

server.addTool({
  name: addTool.name,
  description: addTool.description,
  parameters: addTool.parameters,
  execute: addTool.execute(rx),
});

server.addTool({
  name: pushTool.name,
  description: pushTool.description,
  parameters: pushTool.parameters,
  execute: pushTool.execute(rx, registry),
});

// Start the server
server.start({
  transportType: "stdio",
});
