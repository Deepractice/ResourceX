import { Given, When, Then, Before, After, World } from "@cucumber/cucumber";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createResourceX } from "resourcexjs";
import { join } from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { spawn, type ChildProcess } from "node:child_process";

const PROJECT_ROOT = join(import.meta.dirname, "../../..");
const MCP_SERVER_PATH = join(PROJECT_ROOT, "apps/mcp-server/src/index.ts");
const TEST_STORAGE_PATH = join(PROJECT_ROOT, ".test-mcp-storage");

interface MCPWorld extends World {
  client: Client;
  transport: StdioClientTransport;
  rx: ReturnType<typeof createResourceX>;
  result: string;
  registryServer: ChildProcess | null;
  registryPort: number;
}

// ============================================
// Hooks
// ============================================

Before({ tags: "@mcp" }, async function (this: MCPWorld) {
  // Clean test storage
  await rm(TEST_STORAGE_PATH, { recursive: true, force: true });
  await mkdir(TEST_STORAGE_PATH, { recursive: true });

  // Initialize ResourceX client for test setup
  this.rx = createResourceX({ path: TEST_STORAGE_PATH });

  // Start MCP server via stdio transport
  this.transport = new StdioClientTransport({
    command: "bun",
    args: ["run", MCP_SERVER_PATH],
    env: {
      ...process.env,
      RESOURCEX_PATH: TEST_STORAGE_PATH,
    },
  });

  this.client = new Client({ name: "bdd-test", version: "1.0.0" }, { capabilities: {} });

  await this.client.connect(this.transport);
  this.registryServer = null;
  this.registryPort = 3099;
});

After({ tags: "@mcp" }, async function (this: MCPWorld) {
  // Close MCP client
  if (this.client) {
    await this.client.close();
  }

  // Stop registry server if running
  if (this.registryServer) {
    this.registryServer.kill();
    this.registryServer = null;
  }

  // Clean up test storage
  await rm(TEST_STORAGE_PATH, { recursive: true, force: true });
});

// ============================================
// Given Steps
// ============================================

Given("a running MCP server", async function (this: MCPWorld) {
  // Server is started in Before hook
  // Verify connection by pinging
  const result = await this.client.listTools();
  if (!result.tools || result.tools.length === 0) {
    throw new Error("MCP server has no tools registered");
  }
});

Given(
  "an MCP local resource {string} with content {string}",
  async function (this: MCPWorld, locator: string, content: string) {
    // Parse locator: name:tag
    const match = locator.match(/^([^:]+):(.+)$/);
    if (!match) {
      throw new Error(`Invalid locator format: ${locator}`);
    }
    const [, name, tag] = match;

    // Create resource directory
    const resourceDir = join(TEST_STORAGE_PATH, "temp", name);
    await mkdir(resourceDir, { recursive: true });

    // Write resource.json
    await writeFile(
      join(resourceDir, "resource.json"),
      JSON.stringify({ name, type: "text", tag })
    );

    // Write content
    await writeFile(join(resourceDir, "content"), content);

    // Add to ResourceX using the MCP tool (so it uses same storage as server)
    await this.client.callTool({
      name: "add",
      arguments: { path: resourceDir },
    });
  }
);

Given("a registry server running on port {int}", async function (this: MCPWorld, port: number) {
  this.registryPort = port;

  // Check if server is already running (from global BDD setup)
  try {
    const response = await fetch(`http://localhost:${port}/api/v1/health`);
    if (response.ok) {
      // Server already running, reuse it
      return;
    }
  } catch {
    // Server not running, start it
  }

  // Start the test registry server
  const serverScript = join(PROJECT_ROOT, "bdd/test-server.ts");
  this.registryServer = spawn("bun", ["run", serverScript], {
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: "pipe",
  });

  // Wait for server to start
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Server start timeout")), 5000);

    this.registryServer!.stdout?.on("data", (data: Buffer) => {
      if (data.toString().includes("started")) {
        clearTimeout(timeout);
        resolve();
      }
    });

    this.registryServer!.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
});

Given(
  "an MCP remote resource {string} on the registry with content {string}",
  async function (this: MCPWorld, locator: string, content: string) {
    // Parse locator: name:tag
    const match = locator.match(/^([^:]+):(.+)$/);
    if (!match) {
      throw new Error(`Invalid locator format: ${locator}`);
    }
    const [, name, tag] = match;

    // Create resource directory
    const resourceDir = join(TEST_STORAGE_PATH, "remote-temp", name);
    await mkdir(resourceDir, { recursive: true });

    await writeFile(
      join(resourceDir, "resource.json"),
      JSON.stringify({ name, type: "text", tag })
    );
    await writeFile(join(resourceDir, "content"), content);

    // Add to local first, then push to registry
    const tempRx = createResourceX({
      path: join(TEST_STORAGE_PATH, "remote-storage"),
      registry: `http://localhost:${this.registryPort}`,
    });

    await tempRx.add(resourceDir);
    await tempRx.push(`${name}:${tag}`);
  }
);

// ============================================
// When Steps
// ============================================

When("I call tool {string} with no parameters", async function (this: MCPWorld, toolName: string) {
  const response = await this.client.callTool({
    name: toolName,
    arguments: {},
  });

  this.result = extractTextContent(response);
});

When(
  "I call tool {string} with:",
  async function (this: MCPWorld, toolName: string, dataTable: any) {
    const args: Record<string, string> = {};
    for (const [key, value] of dataTable.rawTable) {
      args[key] = value;
    }

    const response = await this.client.callTool({
      name: toolName,
      arguments: args,
    });

    this.result = extractTextContent(response);
  }
);

// ============================================
// Then Steps
// ============================================

Then("the result should contain {string}", function (this: MCPWorld, expected: string) {
  if (!this.result.includes(expected)) {
    throw new Error(
      `Expected result to contain "${expected}"\n` + `Actual result: "${this.result}"`
    );
  }
});

Then("the result should be {string}", function (this: MCPWorld, expected: string) {
  const actual = this.result.trim();
  if (actual !== expected) {
    throw new Error(`Expected result to be "${expected}"\n` + `Actual result: "${actual}"`);
  }
});

// ============================================
// Helpers
// ============================================

function extractTextContent(response: any): string {
  if (response.content && Array.isArray(response.content)) {
    return response.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");
  }
  return String(response);
}
