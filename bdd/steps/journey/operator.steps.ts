import { strict as assert } from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import { join } from "node:path";
import { After, Before, Given, Then, When } from "@cucumber/cucumber";

const BDD_ROOT = process.cwd();
const TEST_STORAGE = join(BDD_ROOT, ".test-registry");

interface OperatorWorld {
  server: Server | null;
  serverPort: number;
  lastResponse: Response | null;
  lastResponseBody: unknown;
}

// ============================================
// Hooks
// ============================================

Before({ tags: "@operator" }, async function (this: OperatorWorld) {
  this.server = null;
  this.serverPort = 3097;
  this.lastResponse = null;
  this.lastResponseBody = null;

  // Clean storage
  await rm(TEST_STORAGE, { recursive: true, force: true });
});

After({ tags: "@operator" }, async function (this: OperatorWorld) {
  // Stop server
  if (this.server) {
    this.server.close();
    this.server = null;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Clean storage
  await rm(TEST_STORAGE, { recursive: true, force: true });
});

// ============================================
// Given steps
// ============================================

Given("a clean server environment", async function (this: OperatorWorld) {
  // Done in Before hook
});

Given("the registry server is running", async function (this: OperatorWorld) {
  if (!this.server) {
    await startServer(this, this.serverPort, TEST_STORAGE);
  }
});

// ============================================
// When steps
// ============================================

When(
  "I start a registry server with:",
  async function (
    this: OperatorWorld,
    dataTable: { hashes: () => Array<{ option: string; value: string }> }
  ) {
    const options: Record<string, string> = {};
    for (const row of dataTable.hashes()) {
      options[row.option] = row.value;
    }

    const port = parseInt(options.port || "3097", 10);
    const storagePath = options.storagePath ? join(BDD_ROOT, options.storagePath) : TEST_STORAGE;

    this.serverPort = port;
    await startServer(this, port, storagePath);
  }
);

When("I GET {string}", async function (this: OperatorWorld, path: string) {
  const url = `http://localhost:${this.serverPort}${path}`;
  this.lastResponse = await fetch(url);
  try {
    this.lastResponseBody = await this.lastResponse.clone().json();
  } catch {
    this.lastResponseBody = await this.lastResponse.clone().text();
  }
});

When(
  "I publish via API:",
  async function (
    this: OperatorWorld,
    dataTable: { hashes: () => Array<{ locator: string; content: string }> }
  ) {
    for (const row of dataTable.hashes()) {
      await publishViaAPI(this.serverPort, row.locator, row.content);
    }
  }
);

// ============================================
// Then steps
// ============================================

Then(
  "the server should be running on port {int}",
  async function (this: OperatorWorld, port: number) {
    assert.ok(this.server, "Server should be running");
    assert.equal(this.serverPort, port);
  }
);

Then(
  "GET {string} should return status {int}",
  async function (this: OperatorWorld, path: string, status: number) {
    const url = `http://localhost:${this.serverPort}${path}`;
    const response = await fetch(url);
    assert.equal(response.status, status, `Expected status ${status} but got ${response.status}`);
  }
);

Then("the response status should be {int}", async function (this: OperatorWorld, status: number) {
  assert.ok(this.lastResponse, "No response available");
  assert.equal(this.lastResponse.status, status);
});

Then("the response should contain {string}", async function (this: OperatorWorld, key: string) {
  assert.ok(this.lastResponseBody, "No response body");
  if (typeof this.lastResponseBody === "object") {
    assert.ok(
      key in (this.lastResponseBody as Record<string, unknown>),
      `Response should contain "${key}"`
    );
  } else {
    assert.ok(String(this.lastResponseBody).includes(key), `Response should contain "${key}"`);
  }
});

// ============================================
// Helpers
// ============================================

async function startServer(world: OperatorWorld, port: number, storagePath: string): Promise<void> {
  const { createRegistryServer } = await import("@resourcexjs/server");
  const { FileSystemRXAStore, FileSystemRXMStore } = await import("@resourcexjs/node-provider");
  const { serve } = await import("@hono/node-server");

  await mkdir(storagePath, { recursive: true });

  const app = createRegistryServer({
    rxaStore: new FileSystemRXAStore(join(storagePath, "blobs")),
    rxmStore: new FileSystemRXMStore(join(storagePath, "manifests")),
  });

  return new Promise((resolve, reject) => {
    try {
      world.server = serve({ fetch: app.fetch, port }, () => resolve());
    } catch (err) {
      reject(err);
    }
  });
}

async function publishViaAPI(port: number, locator: string, content: string): Promise<void> {
  const { exec } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execAsync = promisify(exec);

  // Parse locator (Docker-style: name:tag)
  const match = locator.match(/^([^:]+):(.+)$/);
  if (!match) throw new Error(`Invalid locator: ${locator}`);
  const [, name, tag] = match;

  // Create temp files
  const tmpDir = join(BDD_ROOT, ".tmp-publish");
  await mkdir(tmpDir, { recursive: true });

  const manifestPath = join(tmpDir, "manifest.json");
  const contentPath = join(tmpDir, "content");
  const archivePath = join(tmpDir, "archive.tar.gz");

  await writeFile(manifestPath, JSON.stringify({ name, type: "text", tag }));
  await writeFile(contentPath, content);

  await execAsync(`tar -czf ${archivePath} -C ${tmpDir} content`);

  const fullLocator = `localhost/${name}:${tag}`;
  await execAsync(
    `curl -s -X POST http://localhost:${port}/api/v1/publish ` +
      `-F "locator=${fullLocator}" ` +
      `-F "manifest=@${manifestPath}" ` +
      `-F "content=@${archivePath}"`
  );

  await rm(tmpDir, { recursive: true, force: true });
}
