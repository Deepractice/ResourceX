/**
 * Deepractice transport step definitions
 */
import { Given, Then, Before, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

interface DeepracticeWorld {
  rx: import("resourcexjs").ResourceX | null;
  parentDir: string;
  result: { type: string; content: unknown; meta?: Record<string, unknown> } | null;
  error: Error | null;
  content: unknown;
}

Before({ tags: "@deepractice" }, async function (this: DeepracticeWorld) {
  this.rx = null;
  this.parentDir = homedir();
  this.result = null;
  this.error = null;
  this.content = null;
});

After({ tags: "@deepractice" }, async function (this: DeepracticeWorld) {
  // Clean up test files in default location
  try {
    await rm(join(homedir(), ".deepractice"), { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }

  // Clean up test files in custom location
  try {
    await rm(join(process.cwd(), "bdd/test-data"), { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

Given("deepractice handler with default config", async function (this: DeepracticeWorld) {
  const { createResourceX, deepracticeHandler } = await import("resourcexjs");
  this.parentDir = homedir();
  this.rx = createResourceX({
    transports: [deepracticeHandler()],
  });
});

Given(
  "deepractice handler with parentDir {string}",
  async function (this: DeepracticeWorld, parentDir: string) {
    const { createResourceX, deepracticeHandler } = await import("resourcexjs");
    // Adjust relative paths for BDD test directory
    const adjustedParentDir = parentDir.startsWith("./")
      ? join(process.cwd(), "bdd", parentDir.slice(2))
      : parentDir;
    this.parentDir = adjustedParentDir;
    this.rx = createResourceX({
      transports: [deepracticeHandler({ parentDir: adjustedParentDir })],
    });
  }
);

// Create local file at deepractice path (default location)
Given(
  "local file at deepractice path {string} with content {string}",
  async function (this: DeepracticeWorld, path: string, content: string) {
    const fullPath = join(this.parentDir, ".deepractice", path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf-8");
  }
);

// Create local file at custom deepractice path
Given(
  "local file at custom deepractice path {string} with content {string}",
  async function (this: DeepracticeWorld, path: string, content: string) {
    const fullPath = join(this.parentDir, ".deepractice", path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf-8");
  }
);

Then(
  "file at deepractice path {string} should contain {string}",
  async function (this: DeepracticeWorld, path: string, expected: string) {
    const fullPath = join(this.parentDir, ".deepractice", path);
    const content = await readFile(fullPath, "utf-8");
    assert.ok(content.includes(expected), `File should contain "${expected}", got: ${content}`);
  }
);

Then(
  "file at custom deepractice path {string} should contain {string}",
  async function (this: DeepracticeWorld, path: string, expected: string) {
    const fullPath = join(this.parentDir, ".deepractice", path);
    const content = await readFile(fullPath, "utf-8");
    assert.ok(content.includes(expected), `File should contain "${expected}", got: ${content}`);
  }
);
