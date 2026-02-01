#!/usr/bin/env node
/**
 * ResourceX MCP Server
 *
 * Provides AI agents with tools to discover, use, and publish AI resources.
 */

import { FastMCP } from "fastmcp";
import { createResourceX } from "resourcexjs";
import { instructions } from "./instructions.js";
import { searchTool, resolveTool, infoTool, listTool, addTool, pushTool } from "./tools/index.js";

// Configuration from environment
const registry = process.env.RESOURCEX_REGISTRY;
const storagePath = process.env.RESOURCEX_PATH;

// Initialize ResourceX client
const rx = createResourceX({
  registry,
  path: storagePath,
});

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
  name: resolveTool.name,
  description: resolveTool.description,
  parameters: resolveTool.parameters,
  execute: resolveTool.execute(rx),
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
