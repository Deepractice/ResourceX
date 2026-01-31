import { Given, When, Then, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import type { Registry, RXR, ResolvedResource } from "resourcexjs";

const TEST_DIR = join(process.cwd(), ".test-bdd-add-link");
const RESOURCE_DIRS: string[] = [];

interface AddLinkWorld {
  registry: Registry | null;
  resource: RXR | null;
  resolvedResource: ResolvedResource | null;
  error: Error | null;
}

// ============================================
// Cleanup
// ============================================

After({ tags: "@add or @link" }, async function () {
  // Clean up test registry directory
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }

  // Clean up resource directories
  for (const dir of RESOURCE_DIRS) {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  }
  RESOURCE_DIRS.length = 0;
});

// ============================================
// Background
// ============================================

Given("a clean local registry", async function (this: AddLinkWorld) {
  const { createResourceX } = await import("resourcexjs");

  // Clean and recreate test directory
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
  await mkdir(TEST_DIR, { recursive: true });

  this.registry = createResourceX({ path: TEST_DIR });
  this.resource = null;
  this.resolvedResource = null;
  this.error = null;
});

// ============================================
// Given - Create resources
// ============================================

Given(
  "I have a resource {string} with content {string}",
  async function (this: AddLinkWorld, locator: string, content: string) {
    const { manifest, archive, parse } = await import("resourcexjs");

    const rxl = parse(locator);
    const rxm = manifest({
      domain: rxl.domain ?? "localhost",
      name: rxl.name,
      type: rxl.type ?? "text",
      version: rxl.version ?? "1.0.0",
    });

    this.resource = {
      locator: rxl,
      manifest,
      archive: await archive({ content }),
    };
  }
);

Given(
  "a resource directory {string} with:",
  async function (
    this: AddLinkWorld,
    dirPath: string,
    dataTable: { hashes: () => Array<{ file: string; content: string }> }
  ) {
    const fullPath = join(process.cwd(), dirPath);

    // Track for cleanup
    RESOURCE_DIRS.push(fullPath);

    // Create directory
    await mkdir(fullPath, { recursive: true });

    // Write files
    const rows = dataTable.hashes();
    for (const row of rows) {
      const filePath = join(fullPath, row.file);
      await writeFile(filePath, row.content, "utf-8");
    }
  }
);

// ============================================
// When - Add operations
// ============================================

When("I add the resource to registry", async function (this: AddLinkWorld) {
  try {
    await this.registry!.add(this.resource!);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When("I add {string} to registry", async function (this: AddLinkWorld, dirPath: string) {
  const fullPath = join(process.cwd(), dirPath);
  try {
    await this.registry!.add(fullPath);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When(
  "I create a resource {string} with content {string}",
  async function (this: AddLinkWorld, locator: string, content: string) {
    const { manifest, archive, parse } = await import("resourcexjs");

    const rxl = parse(locator);
    const rxm = manifest({
      domain: rxl.domain ?? "localhost",
      name: rxl.name,
      type: rxl.type ?? "text",
      version: rxl.version ?? "1.0.0",
    });

    this.resource = {
      locator: rxl,
      manifest,
      archive: await archive({ content }),
    };
  }
);

// ============================================
// When - Link operations
// ============================================

When("I link {string} to registry", async function (this: AddLinkWorld, dirPath: string) {
  const fullPath = join(process.cwd(), dirPath);
  try {
    await this.registry!.link(fullPath);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

// ============================================
// When - File modification
// ============================================

When(
  "I modify {string} to {string}",
  async function (this: AddLinkWorld, filePath: string, newContent: string) {
    const fullPath = join(process.cwd(), filePath);
    await writeFile(fullPath, newContent, "utf-8");
  }
);

// ============================================
// Then - Assertions
// ============================================

Then("I should be able to resolve {string}", async function (this: AddLinkWorld, locator: string) {
  try {
    this.resolvedResource = await this.registry!.resolve(locator);
    assert.ok(this.resolvedResource, "Should be able to resolve resource");
  } catch (e) {
    assert.fail(`Failed to resolve "${locator}": ${(e as Error).message}`);
  }
});
