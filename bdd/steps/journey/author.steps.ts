import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import { join } from "node:path";
import { After, Before, Given, When } from "@cucumber/cucumber";

// Use fixtures directory for resources
const BDD_ROOT = process.cwd();
const FIXTURES_DIR = join(BDD_ROOT, "fixtures");
const TEST_RX_HOME = join(BDD_ROOT, ".test-rx-home");
const TEST_REGISTRY_STORAGE = join(BDD_ROOT, ".test-registry-author");
const REGISTRY_PORT = 3097;
const REGISTRY_URL = `http://localhost:${REGISTRY_PORT}`;

// CLI path
const CLI_PATH = join(BDD_ROOT, "..", "apps/cli/src/index.ts");

// Author's own server instance (separate from CLI tests)
let authorServer: Server | null = null;

interface AuthorWorld {
  commandOutput: string;
  commandExitCode: number;
  resourceDirs: string[];
}

/**
 * Run rx CLI command
 */
async function runRxCommand(
  args: string,
  cwd: string
): Promise<{ output: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn("bun", [CLI_PATH, ...args.split(" ")], {
      cwd,
      env: {
        ...process.env,
        RX_HOME: TEST_RX_HOME,
        RX_REGISTRY: REGISTRY_URL,
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

// ============================================
// Hooks
// ============================================

Before({ tags: "@author" }, async function (this: AuthorWorld) {
  this.commandOutput = "";
  this.commandExitCode = 0;
  this.resourceDirs = [];

  // Create fresh RX_HOME (fixtures dir is persistent)
  await rm(TEST_RX_HOME, { recursive: true, force: true });
  await mkdir(join(TEST_RX_HOME, "hosted"), { recursive: true });
  await mkdir(join(TEST_RX_HOME, "cache"), { recursive: true });
  await mkdir(join(TEST_RX_HOME, "linked"), { recursive: true });
});

After({ tags: "@author" }, async function (this: AuthorWorld) {
  // Stop server if running
  if (authorServer) {
    authorServer.close();
    authorServer = null;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Cleanup RX_HOME
  await rm(TEST_RX_HOME, { recursive: true, force: true });

  // Cleanup registry storage
  await rm(TEST_REGISTRY_STORAGE, { recursive: true, force: true });

  // Cleanup dynamically created resource dirs (but keep pre-existing fixtures)
  for (const dir of this.resourceDirs) {
    await rm(dir, { recursive: true, force: true });
  }
});

// ============================================
// Given steps
// ============================================

Given("a clean local environment", async function (this: AuthorWorld) {
  // Already done in Before hook
});

Given("a registry server for publishing", async function (this: AuthorWorld) {
  if (!authorServer) {
    const { createRegistryServer } = await import("@resourcexjs/server");
    const { FileSystemRXAStore, FileSystemRXMStore } = await import("@resourcexjs/node-provider");
    const { serve } = await import("@hono/node-server");

    await mkdir(TEST_REGISTRY_STORAGE, { recursive: true });
    const app = createRegistryServer({
      rxaStore: new FileSystemRXAStore(join(TEST_REGISTRY_STORAGE, "blobs")),
      rxmStore: new FileSystemRXMStore(join(TEST_REGISTRY_STORAGE, "manifests")),
    });

    await new Promise<void>((resolve, reject) => {
      try {
        authorServer = serve({ fetch: app.fetch, port: REGISTRY_PORT }, () => resolve());
      } catch (err) {
        reject(err);
      }
    });
  }
});

Given("a fresh local cache", async function (this: AuthorWorld) {
  // Clear hosted and cache directories
  await rm(join(TEST_RX_HOME, "hosted"), { recursive: true, force: true });
  await rm(join(TEST_RX_HOME, "cache"), { recursive: true, force: true });
  await mkdir(join(TEST_RX_HOME, "hosted"), { recursive: true });
  await mkdir(join(TEST_RX_HOME, "cache"), { recursive: true });
});

Given("a fresh local environment", async function (this: AuthorWorld) {
  // Clear all local directories (hosted, cache, linked)
  await rm(join(TEST_RX_HOME, "hosted"), { recursive: true, force: true });
  await rm(join(TEST_RX_HOME, "cache"), { recursive: true, force: true });
  await rm(join(TEST_RX_HOME, "linked"), { recursive: true, force: true });
  await rm(join(TEST_RX_HOME, "local"), { recursive: true, force: true });
  await mkdir(join(TEST_RX_HOME, "hosted"), { recursive: true });
  await mkdir(join(TEST_RX_HOME, "cache"), { recursive: true });
  await mkdir(join(TEST_RX_HOME, "linked"), { recursive: true });
  await mkdir(join(TEST_RX_HOME, "local"), { recursive: true });
});

Given(
  "I create a resource directory {string} with:",
  async function (
    this: AuthorWorld,
    dirName: string,
    dataTable: { hashes: () => Array<{ file: string; content: string }> }
  ) {
    const resourceDir = join(FIXTURES_DIR, dirName);
    await mkdir(resourceDir, { recursive: true });

    for (const row of dataTable.hashes()) {
      await writeFile(join(resourceDir, row.file), row.content);
    }

    this.resourceDirs.push(resourceDir);
  }
);

Given(
  "I update the resource directory {string} with:",
  async function (
    this: AuthorWorld,
    dirName: string,
    dataTable: { hashes: () => Array<{ file: string; content: string }> }
  ) {
    const resourceDir = join(FIXTURES_DIR, dirName);

    for (const row of dataTable.hashes()) {
      await writeFile(join(resourceDir, row.file), row.content);
    }
  }
);

Given(
  "I update file {string} with {string}",
  async function (this: AuthorWorld, filePath: string, content: string) {
    const fullPath = join(FIXTURES_DIR, filePath);
    await writeFile(fullPath, content);
  }
);

Given(
  "an author local resource {string} with content {string}",
  async function (this: AuthorWorld, locator: string, content: string) {
    // Parse locator in Docker-style format: name:tag
    const match = locator.match(/^([^:]+):(.+)$/);
    if (!match) {
      throw new Error(`Invalid locator: ${locator}`);
    }
    const [, name, version] = match;
    const type = "text";

    // Create resource directory in fixtures
    const resourceDir = join(FIXTURES_DIR, `local-${name}`);
    await mkdir(resourceDir, { recursive: true });
    await writeFile(join(resourceDir, "resource.json"), JSON.stringify({ name, type, version }));
    await writeFile(join(resourceDir, "content"), content);

    // Add using CLI with author's RX_HOME
    const { output, exitCode } = await runRxCommand(`add ${resourceDir}`, FIXTURES_DIR);
    if (exitCode !== 0) {
      throw new Error(`Failed to add resource: ${output}`);
    }

    this.resourceDirs.push(resourceDir);
  }
);

// ============================================
// When steps
// ============================================

When("I run {string}", async function (this: AuthorWorld, command: string) {
  // Replace relative paths with absolute paths
  let processedCommand = command.replace(/^rx\s+/, ""); // Remove "rx " prefix

  if (processedCommand.includes("./")) {
    processedCommand = processedCommand.replace(/\.\/([^\s]+)/g, (_, path) =>
      join(FIXTURES_DIR, path)
    );
  }

  const { output, exitCode } = await runRxCommand(processedCommand, FIXTURES_DIR);
  this.commandOutput = output;
  this.commandExitCode = exitCode;
});

// Then steps are defined in common.steps.ts
