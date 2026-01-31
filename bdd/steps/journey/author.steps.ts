import { Given, When, Before, After } from "@cucumber/cucumber";
import { join } from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

// Use fixtures directory for resources
const BDD_ROOT = process.cwd();
const FIXTURES_DIR = join(BDD_ROOT, "fixtures");
const TEST_RX_HOME = join(BDD_ROOT, ".test-rx-home");

// CLI path
const CLI_PATH = join(BDD_ROOT, "..", "packages/cli/src/index.ts");

interface AuthorWorld {
  commandOutput: string;
  commandExitCode: number;
  resourceDirs: string[];
}

/**
 * Run rx CLI command (local only, no registry)
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
        // No RX_REGISTRY - local only
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
  // Cleanup RX_HOME
  await rm(TEST_RX_HOME, { recursive: true, force: true });

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
