import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import { join } from "node:path";
import { After, AfterAll, Before, BeforeAll, Given, When } from "@cucumber/cucumber";

// Test directories
const BDD_ROOT = process.cwd();
const TEST_BASE = join(BDD_ROOT, ".test-consumer");
const TEST_RX_HOME = join(TEST_BASE, "rx-home");
const TEST_REGISTRY_STORAGE = join(TEST_BASE, "registry-data");

// Server configuration
const REGISTRY_PORT = 3098;
const REGISTRY_URL = `http://localhost:${REGISTRY_PORT}`;

// CLI path
const CLI_PATH = join(BDD_ROOT, "..", "apps/cli/src/index.ts");

interface ConsumerWorld {
  commandOutput: string;
  commandExitCode: number;
  registryUrl: string;
  serverRunning: boolean;
  noRegistryConfigured: boolean;
}

// Server instance (shared across consumer tests)
let consumerServer: Server | null = null;

/**
 * Run rx CLI command
 */
async function runRxCommand(
  args: string,
  rxHome: string,
  registry: string
): Promise<{ output: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn("bun", [CLI_PATH, ...args.split(" ")], {
      env: {
        ...process.env,
        RX_HOME: rxHome,
        RX_REGISTRY: registry,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";

    proc.stdout?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    proc.stderr?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    proc.on("close", (code) => {
      resolve({ output, exitCode: code ?? 0 });
    });

    proc.on("error", () => {
      resolve({ output, exitCode: 1 });
    });
  });
}

/**
 * Parse new locator format: name:tag or name (defaults to :latest)
 */
function parseLocator(locator: string): { name: string; tag: string } {
  const colonIndex = locator.lastIndexOf(":");
  if (colonIndex === -1) {
    return { name: locator, tag: "latest" };
  }
  return {
    name: locator.substring(0, colonIndex),
    tag: locator.substring(colonIndex + 1),
  };
}

/**
 * Publish resource directly to server via API
 * New locator format: name:tag
 */
async function publishResourceToServer(
  name: string,
  tag: string,
  content: string,
  serverUrl: string
): Promise<void> {
  const { exec } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execAsync = promisify(exec);

  // Create temp files
  const tmpDir = join(TEST_BASE, "tmp-publish");
  await mkdir(tmpDir, { recursive: true });

  const manifestPath = join(tmpDir, "manifest.json");
  const contentPath = join(tmpDir, "content");
  const archivePath = join(tmpDir, "archive.tar.gz");

  // Type is now in manifest, default to "text" for tests
  await writeFile(manifestPath, JSON.stringify({ name, type: "text", tag }));
  await writeFile(contentPath, content);

  // Create tar.gz with "content" file
  await execAsync(`tar -czf ${archivePath} -C ${tmpDir} content`);

  // Extract host:port from server URL for registry
  const url = new URL(serverUrl);
  const registry =
    url.port && url.port !== "80" && url.port !== "443"
      ? `${url.hostname}:${url.port}`
      : url.hostname;

  // New locator format: registry/name:tag
  const locator = `${registry}/${name}:${tag}`;
  await execAsync(
    `curl -s -X POST ${serverUrl}/api/v1/publish ` +
      `-F "locator=${locator}" ` +
      `-F "manifest=@${manifestPath}" ` +
      `-F "content=@${archivePath}"`
  );

  // Cleanup
  await rm(tmpDir, { recursive: true, force: true });
}

/**
 * Start the registry server
 */
async function startServer(): Promise<void> {
  const { createRegistryServer } = await import("@resourcexjs/server");
  const { FileSystemRXAStore, FileSystemRXMStore } = await import("@resourcexjs/node-provider");
  const { serve } = await import("@hono/node-server");

  await mkdir(TEST_REGISTRY_STORAGE, { recursive: true });
  const app = createRegistryServer({
    rxaStore: new FileSystemRXAStore(join(TEST_REGISTRY_STORAGE, "blobs")),
    rxmStore: new FileSystemRXMStore(join(TEST_REGISTRY_STORAGE, "manifests")),
  });

  return new Promise((resolve, reject) => {
    try {
      consumerServer = serve(
        {
          fetch: app.fetch,
          port: REGISTRY_PORT,
        },
        () => resolve()
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Stop the registry server
 */
async function stopServer(): Promise<void> {
  if (consumerServer) {
    consumerServer.close();
    consumerServer = null;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// ============================================
// Hooks - specific to @consumer tag
// ============================================

BeforeAll({ tags: "@consumer" }, async () => {
  // Create test directories
  await mkdir(TEST_BASE, { recursive: true });
  await mkdir(TEST_RX_HOME, { recursive: true });
  await mkdir(TEST_REGISTRY_STORAGE, { recursive: true });

  // Start registry server
  await startServer();
  await new Promise((resolve) => setTimeout(resolve, 200));
});

AfterAll({ tags: "@consumer" }, async () => {
  // Stop server
  await stopServer();

  // Cleanup test directories
  try {
    await rm(TEST_BASE, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

Before({ tags: "@consumer" }, async function (this: ConsumerWorld) {
  this.commandOutput = "";
  this.commandExitCode = 0;
  this.registryUrl = REGISTRY_URL;
  this.serverRunning = true;
  this.noRegistryConfigured = false;

  // Clean rx home directories for each test
  await rm(join(TEST_RX_HOME, "local"), { recursive: true, force: true });
  await rm(join(TEST_RX_HOME, "cache"), { recursive: true, force: true });
  await rm(join(TEST_RX_HOME, "linked"), { recursive: true, force: true });
  await mkdir(join(TEST_RX_HOME, "local"), { recursive: true });
  await mkdir(join(TEST_RX_HOME, "cache"), { recursive: true });
  await mkdir(join(TEST_RX_HOME, "linked"), { recursive: true });

  // Clean registry storage for each test
  await rm(TEST_REGISTRY_STORAGE, { recursive: true, force: true });
  await mkdir(TEST_REGISTRY_STORAGE, { recursive: true });
});

After({ tags: "@consumer" }, async function (this: ConsumerWorld) {
  // Restore server if it was stopped for a test
  if (!this.serverRunning && !consumerServer) {
    await startServer();
    this.serverRunning = true;
  }
});

// ============================================
// Consumer-specific Given steps
// These use unique step text to avoid conflicts
// ============================================

Given("a consumer test environment", async function (this: ConsumerWorld) {
  // Already done in Before hook
});

Given("a registry server with published resources", async function (this: ConsumerWorld) {
  // Server is started in BeforeAll, verify it's running
  for (let i = 0; i < 10; i++) {
    try {
      const response = await fetch(`${REGISTRY_URL}/api/v1/search`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  assert.fail("Registry server not running");
});

Given("a registry server with no resources", async function (this: ConsumerWorld) {
  // Server is started, registry storage is cleaned in Before hook
});

Given(
  "the registry has resource {string} with content {string}",
  async function (this: ConsumerWorld, locator: string, content: string) {
    const { name, tag } = parseLocator(locator);
    await publishResourceToServer(name, tag, content, REGISTRY_URL);
  }
);

Given(
  "the registry has these resources:",
  async function (
    this: ConsumerWorld,
    dataTable: { hashes: () => Array<{ locator: string; content: string }> }
  ) {
    for (const row of dataTable.hashes()) {
      const { name, tag } = parseLocator(row.locator);
      await publishResourceToServer(name, tag, row.content, REGISTRY_URL);
    }
  }
);

Given("the registry is unavailable", async function (this: ConsumerWorld) {
  await stopServer();
  this.serverRunning = false;
});

Given("no registry server is running", async function (this: ConsumerWorld) {
  await stopServer();
  this.serverRunning = false;
});

Given(
  "rx CLI is configured with registry {string}",
  async function (this: ConsumerWorld, registryUrl: string) {
    this.registryUrl = registryUrl;
  }
);

Given("consumer has no registry configured", async function (this: ConsumerWorld) {
  this.noRegistryConfigured = true;
});

Given("consumer cache is empty", async function (this: ConsumerWorld) {
  // Cache is cleaned in Before hook
});

Given("consumer network is interrupted", async function (this: ConsumerWorld) {
  await stopServer();
  this.serverRunning = false;
});

Given(
  "the registry resource {string} content changes to {string}",
  async function (this: ConsumerWorld, locator: string, newContent: string) {
    const { name, tag } = parseLocator(locator);
    await publishResourceToServer(name, tag, newContent, REGISTRY_URL);
  }
);

// ============================================
// Consumer-specific When step
// Uses unique step text to avoid conflict with author.steps.ts
// ============================================

When("I run consumer command {string}", async function (this: ConsumerWorld, command: string) {
  const processedCommand = command.replace(/^rx\s+/, "");
  const registry = this.noRegistryConfigured ? "" : this.registryUrl;
  const { output, exitCode } = await runRxCommand(processedCommand, TEST_RX_HOME, registry);
  this.commandOutput = output;
  this.commandExitCode = exitCode;
});

// ============================================
// Consumer-specific Then steps
// ============================================

import { Then } from "@cucumber/cucumber";

Then("the output should contain a helpful error message", async function (this: ConsumerWorld) {
  const hasError =
    this.commandOutput.includes("error") ||
    this.commandOutput.includes("Error") ||
    this.commandOutput.includes("failed") ||
    this.commandOutput.includes("Failed") ||
    this.commandOutput.includes("not found") ||
    this.commandOutput.includes("Unable to connect");
  assert.ok(hasError, `Expected helpful error message but got: ${this.commandOutput}`);
});
