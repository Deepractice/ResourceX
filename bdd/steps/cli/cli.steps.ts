import { Given, When, Then, Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import type { Server } from "node:http";

// Test directories (use absolute path to avoid cwd issues)
const MONOREPO_ROOT = join(process.cwd(), "..");
const TEST_BASE = join(MONOREPO_ROOT, ".test-bdd-cli");
const TEST_RESOURCES = join(TEST_BASE, "resources");
const TEST_RX_HOME = join(TEST_BASE, "rx-home");

// Server configuration
const SERVER_PORT = 3099;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

// CLI path (relative to monorepo root, not bdd directory)
const CLI_PATH = join(process.cwd(), "..", "packages/cli/src/index.ts");

interface CLIWorld {
  commandOutput: string;
  commandExitCode: number;
  resourceDir: string | null;
}

// Server instance (shared across all tests)
let server: Server | null = null;

/**
 * Start the registry server using @resourcexjs/server
 */
async function startServer(): Promise<void> {
  const { createRegistryServer } = await import("@resourcexjs/server");
  const { serve } = await import("@hono/node-server");

  const storagePath = join(TEST_BASE, "server-data");
  await mkdir(storagePath, { recursive: true });

  const app = createRegistryServer({ storagePath });

  return new Promise((resolve, reject) => {
    try {
      server = serve(
        {
          fetch: app.fetch,
          port: SERVER_PORT,
        },
        () => {
          console.log(`[BDD] Registry server started on port ${SERVER_PORT}`);
          resolve();
        }
      );
    } catch (err) {
      console.error(`[BDD] Failed to start server:`, err);
      reject(err);
    }
  });
}

/**
 * Stop the registry server
 */
async function stopServer(): Promise<void> {
  if (server) {
    server.close();
    server = null;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

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
 * Publish resource directly to server via API
 */
async function publishToServer(
  name: string,
  type: string,
  version: string,
  content: string
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

  await writeFile(manifestPath, JSON.stringify({ name, type, version }));
  await writeFile(contentPath, content);

  // Create tar.gz with "content" file
  await execAsync(`tar -czf ${archivePath} -C ${tmpDir} content`);

  // Publish via curl (no /api prefix)
  const locator = `localhost/${name}.${type}@${version}`;
  const result = await execAsync(
    `curl -s -X POST ${SERVER_URL}/publish ` +
      `-F "locator=${locator}" ` +
      `-F "manifest=@${manifestPath}" ` +
      `-F "content=@${archivePath}"`
  );

  // Cleanup
  await rm(tmpDir, { recursive: true, force: true });
}

// ============================================
// Hooks
// ============================================

BeforeAll({ tags: "@cli" }, async function () {
  // Create test directories
  await mkdir(TEST_BASE, { recursive: true });
  await mkdir(TEST_RESOURCES, { recursive: true });
  await mkdir(TEST_RX_HOME, { recursive: true });
  await mkdir(join(TEST_BASE, "server-data"), { recursive: true });

  // Start @resourcexjs/server
  await startServer();

  // Wait a moment for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 200));
});

AfterAll({ tags: "@cli" }, async function () {
  // Stop server
  await stopServer();

  // Cleanup test directories
  try {
    await rm(TEST_BASE, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

Before({ tags: "@cli" }, async function (this: CLIWorld) {
  this.commandOutput = "";
  this.commandExitCode = 0;
  this.resourceDir = null;

  // Clean rx home directories for each test
  await rm(join(TEST_RX_HOME, "hosted"), { recursive: true, force: true });
  await rm(join(TEST_RX_HOME, "cache"), { recursive: true, force: true });
  await rm(join(TEST_RX_HOME, "linked"), { recursive: true, force: true });
  await mkdir(join(TEST_RX_HOME, "hosted"), { recursive: true });
  await mkdir(join(TEST_RX_HOME, "cache"), { recursive: true });
  await mkdir(join(TEST_RX_HOME, "linked"), { recursive: true });
});

After({ tags: "@cli" }, async function (this: CLIWorld) {
  // Clean up resource directories
  if (this.resourceDir) {
    await rm(this.resourceDir, { recursive: true, force: true });
  }
});

// ============================================
// Given steps
// ============================================

Given("a running registry server", async function (this: CLIWorld) {
  // Server is started in BeforeAll
  // Verify it's running with retry
  let lastError: Error | null = null;
  for (let i = 0; i < 10; i++) {
    try {
      const response = await fetch(`${SERVER_URL}/search`);
      if (response.ok) {
        return; // Server is running
      }
    } catch (e) {
      lastError = e as Error;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  assert.fail(`Registry server not running after retries: ${lastError?.message}`);
});

Given("rx CLI is configured with the test registry", async function (this: CLIWorld) {
  // Config is set via environment variables in runRxCommand
  // RX_HOME and RX_REGISTRY are passed when running CLI
});

Given(
  "a CLI resource directory {string} with:",
  async function (
    this: CLIWorld,
    dirName: string,
    dataTable: { hashes: () => Array<{ file: string; content: string }> }
  ) {
    const resourceDir = join(TEST_RESOURCES, dirName);
    await mkdir(resourceDir, { recursive: true });

    for (const row of dataTable.hashes()) {
      await writeFile(join(resourceDir, row.file), row.content);
    }

    this.resourceDir = resourceDir;
  }
);

Given(
  "a local resource {string} with content {string}",
  async function (this: CLIWorld, locator: string, content: string) {
    // Parse locator
    const match = locator.match(/^([^.]+)\.([^@]+)@(.+)$/);
    if (!match) {
      throw new Error(`Invalid locator: ${locator}`);
    }
    const [, name, type, version] = match;

    // Create resource directory
    const resourceDir = join(TEST_RESOURCES, name);
    await mkdir(resourceDir, { recursive: true });
    await writeFile(join(resourceDir, "resource.json"), JSON.stringify({ name, type, version }));
    await writeFile(join(resourceDir, "content"), content);

    // Add using CLI
    const { output, exitCode } = await runRxCommand(`add ${resourceDir}`, TEST_RX_HOME, SERVER_URL);
    if (exitCode !== 0) {
      throw new Error(`Failed to add resource: ${output}`);
    }

    this.resourceDir = resourceDir;
  }
);

Given(
  "a remote resource {string} on the registry",
  async function (this: CLIWorld, locator: string) {
    const match = locator.match(/^([^.]+)\.([^@]+)@(.+)$/);
    if (!match) {
      throw new Error(`Invalid locator: ${locator}`);
    }
    const [, name, type, version] = match;

    await publishToServer(name, type, version, "Remote content");
  }
);

Given(
  "a remote resource {string} on the registry with content {string}",
  async function (this: CLIWorld, locator: string, content: string) {
    const match = locator.match(/^([^.]+)\.([^@]+)@(.+)$/);
    if (!match) {
      throw new Error(`Invalid locator: ${locator}`);
    }
    const [, name, type, version] = match;

    await publishToServer(name, type, version, content);
  }
);

Given("the resource is not in local cache", async function (this: CLIWorld) {
  // Cache is cleaned in Before hook, so nothing to do
});

// ============================================
// When steps
// ============================================

When("I run rx command {string}", async function (this: CLIWorld, command: string) {
  // Replace relative paths with absolute paths
  let processedCommand = command;
  if (command.includes("./")) {
    processedCommand = command.replace(/\.\/([^\s]+)/g, (_, path) => join(TEST_RESOURCES, path));
  }

  const { output, exitCode } = await runRxCommand(processedCommand, TEST_RX_HOME, SERVER_URL);
  this.commandOutput = output;
  this.commandExitCode = exitCode;
});

// ============================================
// Then steps
// ============================================

Then("the command should succeed", async function (this: CLIWorld) {
  assert.equal(
    this.commandExitCode,
    0,
    `Command should succeed but got exit code ${this.commandExitCode}. Output: ${this.commandOutput}`
  );
});

Then("the command should fail", async function (this: CLIWorld) {
  assert.notEqual(this.commandExitCode, 0, "Command should fail");
});

Then("the output should contain {string}", async function (this: CLIWorld, expected: string) {
  assert.ok(
    this.commandOutput.includes(expected),
    `Output should contain "${expected}" but got: ${this.commandOutput}`
  );
});

Then(
  "the output should not contain {string}",
  async function (this: CLIWorld, notExpected: string) {
    assert.ok(
      !this.commandOutput.includes(notExpected),
      `Output should not contain "${notExpected}" but got: ${this.commandOutput}`
    );
  }
);
