/**
 * Resource Definition step definitions
 */
import { Given, When, Before, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { rm } from "node:fs/promises";
import { join } from "node:path";

interface ResourceWorld {
  rx: import("resourcexjs").ResourceX | null;
  result: { type: string; content: unknown; meta?: Record<string, unknown> } | null;
  error: Error | null;
  content: unknown;
}

Before({ tags: "@resource-definition" }, async function (this: ResourceWorld) {
  this.rx = null;
  this.result = null;
  this.error = null;
  this.content = null;
});

After({ tags: "@resource-definition" }, async function () {
  // Clean up test files
  try {
    await rm(join(process.cwd(), "bdd/test-data"), { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

// Parse DataTable to ResourceDefinition array
function parseResourceTable(dataTable: {
  rawTable: string[][];
}): import("resourcexjs").ResourceDefinition[] {
  const rows = dataTable.rawTable;
  const headers = rows[0];
  const resources: import("resourcexjs").ResourceDefinition[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const resource: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      if (row[j]) {
        resource[headers[j]] = row[j];
      }
    }
    // Adjust basePath for test directory
    if (resource.basePath) {
      resource.basePath = join(process.cwd(), "bdd", resource.basePath);
    }
    resources.push(resource as unknown as import("resourcexjs").ResourceDefinition);
  }

  return resources;
}

Given(
  "ResourceX created with config",
  async function (this: ResourceWorld, dataTable: { rawTable: string[][] }) {
    const { createResourceX } = await import("resourcexjs");
    const resources = parseResourceTable(dataTable);
    this.rx = createResourceX({ resources });
  }
);

Given(
  "ResourceX created with resources",
  async function (this: ResourceWorld, dataTable: { rawTable: string[][] }) {
    const { createResourceX } = await import("resourcexjs");
    const resources = parseResourceTable(dataTable);
    this.rx = createResourceX({ resources });
  }
);

Given("ResourceX created with no resources", async function (this: ResourceWorld) {
  const { createResourceX } = await import("resourcexjs");
  this.rx = createResourceX();
});

When("resolve {string}", async function (this: ResourceWorld, url: string) {
  assert.ok(this.rx, "ResourceX not initialized");
  try {
    // Adjust file URLs for BDD test directory
    let adjustedUrl = url;
    if (url.includes("file://./")) {
      adjustedUrl = url.replace("file://./", `file://./bdd/`);
    }
    this.result = await this.rx.resolve(adjustedUrl);
  } catch (e) {
    this.error = e as Error;
  }
});

When(
  "deposit {string} to {string}",
  async function (this: ResourceWorld, content: string, url: string) {
    assert.ok(this.rx, "ResourceX not initialized");
    try {
      // Adjust file URLs to include bdd path
      let adjustedUrl = url;
      if (url.includes("file://./")) {
        adjustedUrl = url.replace("file://./", `file://./bdd/`);
      }
      await this.rx.deposit(adjustedUrl, content);
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When(
  /^deposit bytes (\[.*\]) to "([^"]*)"$/,
  async function (this: ResourceWorld, bytesStr: string, url: string) {
    assert.ok(this.rx, "ResourceX not initialized");
    try {
      const bytes = parseBytes(bytesStr);
      await this.rx.deposit(url, Buffer.from(bytes));
    } catch (e) {
      this.error = e as Error;
    }
  }
);

// Reuse parseBytes from binary.steps.ts
function parseBytes(bytesStr: string): number[] {
  const inner = bytesStr.replace(/^\[|\]$/g, "").trim();
  if (!inner) return [];
  return inner.split(",").map((s) => {
    const trimmed = s.trim();
    return trimmed.startsWith("0x") ? parseInt(trimmed, 16) : parseInt(trimmed, 10);
  });
}
