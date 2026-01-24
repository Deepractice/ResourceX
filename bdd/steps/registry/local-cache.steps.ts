import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir, writeFile, stat } from "node:fs/promises";
import type { Registry, RXR, RXL, ResolvedResource } from "resourcexjs";
import { TypeHandlerChain } from "resourcexjs";

const TEST_DIR = join(process.cwd(), ".test-bdd-registry");

interface LocalCacheWorld {
  registry: Registry | null;
  resource: RXR | null;
  resolvedResource: ResolvedResource | null;
  rxr: RXR | null;
  existsResult: boolean | null;
  searchResults: RXL[] | null;
  error: Error | null;
}

// Helper to create a resource directly in a specific directory (local or cache)
async function createResourceAt(
  basePath: string,
  area: "local" | "cache",
  manifest: { domain: string; path?: string; name: string; type?: string; version: string },
  content: string
) {
  const { createRXA, createRXM, TypeHandlerChain } = await import("resourcexjs");

  let resourcePath: string;
  const resourceName = manifest.type ? `${manifest.name}.${manifest.type}` : manifest.name;
  const version = manifest.version ?? "latest";

  if (area === "local") {
    // local: {basePath}/local/{name}.{type}/{version}
    resourcePath = join(basePath, "local", resourceName, version);
  } else {
    // cache: {basePath}/cache/{domain}/{path}/{name}.{type}/{version}
    resourcePath = join(basePath, "cache", manifest.domain);
    if (manifest.path) {
      resourcePath = join(resourcePath, manifest.path);
    }
    resourcePath = join(resourcePath, resourceName, version);
  }

  await mkdir(resourcePath, { recursive: true });

  // Write manifest
  const rxm = createRXM(manifest);
  const manifestPath = join(resourcePath, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(rxm.toJSON(), null, 2), "utf-8");

  // Write content
  const rxa = await createRXA({ content });
  const typeHandler = TypeHandlerChain.create();
  const rxr: RXR = {
    locator: rxm.toLocator() as unknown as RXL,
    manifest: rxm,
    archive: rxa,
  };
  const serialized = await typeHandler.serialize(rxr);
  const contentPath = join(resourcePath, "archive.tar.gz");
  await writeFile(contentPath, serialized);
}

// ============================================
// Given steps for local/cache resources
// ============================================

Given(
  "a resource {string} exists in local with content {string}",
  async function (this: LocalCacheWorld, locator: string, content: string) {
    const { parseRXL } = await import("resourcexjs");
    const rxl = parseRXL(locator);

    await createResourceAt(
      TEST_DIR,
      "local",
      {
        domain: rxl.domain ?? "localhost",
        path: rxl.path,
        name: rxl.name,
        type: rxl.type,
        version: rxl.version ?? "latest",
      },
      content
    );
  }
);

Given(
  "a resource {string} exists in local",
  async function (this: LocalCacheWorld, locator: string) {
    const { parseRXL } = await import("resourcexjs");
    const rxl = parseRXL(locator);

    await createResourceAt(
      TEST_DIR,
      "local",
      {
        domain: rxl.domain ?? "localhost",
        path: rxl.path,
        name: rxl.name,
        type: rxl.type,
        version: rxl.version ?? "latest",
      },
      "test content"
    );
  }
);

Given(
  "a resource {string} exists in cache with content {string}",
  async function (this: LocalCacheWorld, locator: string, content: string) {
    const { parseRXL } = await import("resourcexjs");
    const rxl = parseRXL(locator);

    await createResourceAt(
      TEST_DIR,
      "cache",
      {
        domain: rxl.domain ?? "localhost",
        path: rxl.path,
        name: rxl.name,
        type: rxl.type,
        version: rxl.version ?? "latest",
      },
      content
    );
  }
);

Given(
  "a resource {string} exists in cache",
  async function (this: LocalCacheWorld, locator: string) {
    const { parseRXL } = await import("resourcexjs");
    const rxl = parseRXL(locator);

    await createResourceAt(
      TEST_DIR,
      "cache",
      {
        domain: rxl.domain ?? "localhost",
        path: rxl.path,
        name: rxl.name,
        type: rxl.type,
        version: rxl.version ?? "latest",
      },
      "cached content"
    );
  }
);

Given(
  "a linked resource with:",
  async function (
    this: LocalCacheWorld,
    dataTable: {
      hashes: () => Array<{
        domain?: string;
        path?: string;
        name: string;
        type?: string;
        version: string;
      }>;
    }
  ) {
    const { createRXM, createRXA, parseRXL } = await import("resourcexjs");
    const rows = dataTable.hashes();
    const row = rows[0];

    const manifest = createRXM({
      domain: row.domain ?? "localhost",
      path: row.path,
      name: row.name,
      type: row.type,
      version: row.version,
    });

    const rxr: RXR = {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ content: "test content" }),
    };

    await this.registry!.add(rxr);
  }
);

Given(
  "I simulate a cached resource with:",
  async function (
    this: LocalCacheWorld,
    dataTable: {
      hashes: () => Array<{
        domain: string;
        path?: string;
        name: string;
        type?: string;
        version: string;
      }>;
    }
  ) {
    const rows = dataTable.hashes();
    const row = rows[0];

    await createResourceAt(
      TEST_DIR,
      "cache",
      {
        domain: row.domain,
        path: row.path,
        name: row.name,
        type: row.type,
        version: row.version,
      },
      "simulated cache content"
    );
  }
);

// ============================================
// When steps - "I get {string}" is defined in registry-get.steps.ts
// ============================================

// ============================================
// Then steps for path assertions
// ============================================

Then(
  "the resource should exist at {string}",
  async function (this: LocalCacheWorld, relativePath: string) {
    const fullPath = join(TEST_DIR, relativePath, "manifest.json");
    try {
      await stat(fullPath);
      assert.ok(true, `Resource exists at ${relativePath}`);
    } catch {
      assert.fail(`Resource should exist at ${relativePath} but doesn't`);
    }
  }
);

Then(
  "the resource should NOT exist at {string}",
  async function (this: LocalCacheWorld, relativePath: string) {
    const fullPath = join(TEST_DIR, relativePath, "manifest.json");
    try {
      await stat(fullPath);
      assert.fail(`Resource should NOT exist at ${relativePath} but does`);
    } catch {
      // Expected - file doesn't exist
      assert.ok(true);
    }
  }
);

Then(
  "the resource should still exist at {string}",
  async function (this: LocalCacheWorld, relativePath: string) {
    const fullPath = join(TEST_DIR, relativePath, "manifest.json");
    try {
      await stat(fullPath);
      assert.ok(true, `Resource still exists at ${relativePath}`);
    } catch {
      assert.fail(`Resource should still exist at ${relativePath} but doesn't`);
    }
  }
);

Then(
  "the manifest domain should be {string}",
  async function (this: LocalCacheWorld, expectedDomain: string) {
    if (this.resolvedResource) {
      assert.equal(
        this.resolvedResource.resource.manifest.domain,
        expectedDomain,
        "Manifest domain should match"
      );
    } else if (this.rxr) {
      assert.equal(this.rxr.manifest.domain, expectedDomain, "Manifest domain should match");
    } else if (this.resource) {
      assert.equal(this.resource.manifest.domain, expectedDomain, "Manifest domain should match");
    } else {
      assert.fail("No resource to check domain");
    }
  }
);

Then(
  "the filesystem should have:",
  async function (
    this: LocalCacheWorld,
    dataTable: { hashes: () => Array<{ path: string; exists: string }> }
  ) {
    const rows = dataTable.hashes();
    for (const row of rows) {
      const fullPath = join(TEST_DIR, row.path);
      const shouldExist = row.exists === "true";

      try {
        await stat(fullPath);
        if (!shouldExist) {
          assert.fail(`File should NOT exist: ${row.path}`);
        }
      } catch {
        if (shouldExist) {
          assert.fail(`File should exist: ${row.path}`);
        }
      }
    }
  }
);

// Note: "error message should contain {string}" is defined in steps/arp/common.steps.ts
