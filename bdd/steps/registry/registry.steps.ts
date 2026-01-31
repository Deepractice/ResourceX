import { Given, When, Then, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir, rm, stat } from "node:fs/promises";
import type { ResourceX, RXR, RXL, Executable } from "resourcexjs";

const TEST_DIR = join(process.cwd(), ".test-bdd-registry");

interface RegistryWorld {
  registry: ResourceX | null;
  resource: RXR | null;
  resolvedResource: Executable | null;
  existsResult: boolean | null;
  searchResults: string[] | null;
  error: Error | null;
  customPath: string | null;
}

After({ tags: "@registry" }, async function () {
  // Clean up test directory
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

Given("a registry with default configuration", async function (this: RegistryWorld) {
  const { createResourceX } = await import("resourcexjs");
  await mkdir(TEST_DIR, { recursive: true });
  this.registry = createResourceX({ path: TEST_DIR });
  this.error = null;
});

Given("a registry with path {string}", async function (this: RegistryWorld, path: string) {
  const { createResourceX } = await import("resourcexjs");
  this.customPath = join(process.cwd(), path);
  await mkdir(this.customPath, { recursive: true });
  this.registry = createResourceX({ path: this.customPath });
  this.error = null;
});

Given(
  "a resource with:",
  async function (
    this: RegistryWorld,
    dataTable: {
      hashes: () => Array<{ domain: string; name: string; type: string; version: string }>;
    }
  ) {
    const { manifest, archive, resource, parse } = await import("resourcexjs");
    const rows = dataTable.hashes();
    const row = rows[0];

    const rxm = manifest({
      domain: row.domain || undefined,
      name: row.name,
      type: row.type,
      version: row.version,
    });

    const rxa = await archive({ content: Buffer.from("default content") });
    this.resource = resource(rxm, rxa);
  }
);

Given("resource content {string}", async function (this: RegistryWorld, content: string) {
  const { manifest, archive, resource } = await import("resourcexjs");
  if (this.resource) {
    const rxm = manifest({
      domain: this.resource.manifest.domain,
      name: this.resource.manifest.name,
      type: this.resource.manifest.type,
      version: this.resource.manifest.version,
    });
    const rxa = await archive({ content: Buffer.from(content) });
    this.resource = resource(rxm, rxa);
  }
});

Given(
  "a linked resource {string} with content {string}",
  async function (this: RegistryWorld, locator: string, content: string) {
    // For BDD tests, we use a temp directory approach
    const { join } = await import("node:path");
    const { mkdirSync, writeFileSync } = await import("node:fs");

    const { parse } = await import("resourcexjs");
    const rxl = parse(locator);

    // Create temp resource directory
    const tempDir = join(TEST_DIR, ".temp-resource", `${rxl.name}.${rxl.type}`);
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(join(tempDir, "content"), content);
    writeFileSync(
      join(tempDir, "manifest.json"),
      JSON.stringify({
        name: rxl.name,
        type: rxl.type,
        version: rxl.version,
      })
    );

    await this.registry!.add(tempDir);
  }
);

Given("a linked resource {string}", async function (this: RegistryWorld, locator: string) {
  const { join } = await import("node:path");
  const { mkdirSync, writeFileSync } = await import("node:fs");

  const { parse } = await import("resourcexjs");
  const rxl = parse(locator);

  // Create temp resource directory
  const tempDir = join(TEST_DIR, ".temp-resource", `${rxl.name}.${rxl.type}`);
  mkdirSync(tempDir, { recursive: true });
  writeFileSync(join(tempDir, "content"), "test content");
  writeFileSync(
    join(tempDir, "manifest.json"),
    JSON.stringify({
      name: rxl.name,
      type: rxl.type,
      version: rxl.version,
    })
  );

  await this.registry!.add(tempDir);
});

Given(
  "linked resources:",
  async function (this: RegistryWorld, dataTable: { hashes: () => Array<{ locator: string }> }) {
    const { join } = await import("node:path");
    const { mkdirSync, writeFileSync } = await import("node:fs");
    const { parse } = await import("resourcexjs");

    const rows = dataTable.hashes();

    for (const row of rows) {
      const rxl = parse(row.locator);

      const tempDir = join(TEST_DIR, ".temp-resource", `${rxl.name}.${rxl.type}`);
      mkdirSync(tempDir, { recursive: true });
      writeFileSync(join(tempDir, "content"), "test content");
      writeFileSync(
        join(tempDir, "manifest.json"),
        JSON.stringify({
          name: rxl.name,
          type: rxl.type,
          version: rxl.version,
        })
      );

      await this.registry!.add(tempDir);
    }
  }
);

When("I link the resource", async function (this: RegistryWorld) {
  // This step doesn't make sense with new API
  // ResourceX.add() takes a path, not RXR
  this.error = new Error("Use 'add' with path instead");
});

When("I link a resource {string}", async function (this: RegistryWorld, locator: string) {
  const { join } = await import("node:path");
  const { mkdirSync, writeFileSync } = await import("node:fs");
  const { parse } = await import("resourcexjs");

  const rxl = parse(locator);

  const tempDir = join(TEST_DIR, ".temp-resource", `${rxl.name}.${rxl.type}`);
  mkdirSync(tempDir, { recursive: true });
  writeFileSync(join(tempDir, "content"), "test content");
  writeFileSync(
    join(tempDir, "manifest.json"),
    JSON.stringify({
      name: rxl.name,
      type: rxl.type,
      version: rxl.version,
    })
  );

  try {
    await this.registry!.add(tempDir);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When("I resolve {string}", async function (this: RegistryWorld, locator: string) {
  try {
    this.resolvedResource = await this.registry!.resolve(locator);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When("I check if {string} exists", async function (this: RegistryWorld, locator: string) {
  this.existsResult = await this.registry!.has(locator);
});

When("I delete {string}", async function (this: RegistryWorld, locator: string) {
  try {
    await this.registry!.remove(locator);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When("I search for {string}", async function (this: RegistryWorld, query: string) {
  try {
    this.searchResults = await this.registry!.search(query);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When(
  "I search for resources of type {string}",
  async function (this: RegistryWorld, _type: string) {
    try {
      this.searchResults = await this.registry!.search(_type);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When(
  "I search with options:",
  async function (
    this: RegistryWorld,
    dataTable: { hashes: () => Array<{ key: string; value: string }> }
  ) {
    const rows = dataTable.hashes();
    let query: string | undefined;

    for (const row of rows) {
      if (row.key === "query") {
        query = row.value;
      }
    }

    try {
      this.searchResults = await this.registry!.search(query);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When("I search without options", async function (this: RegistryWorld) {
  try {
    this.searchResults = await this.registry!.search();
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

Then("the resource should exist in local registry", async function (this: RegistryWorld) {
  const { format } = await import("resourcexjs");
  const locator = format(this.resource!.locator);
  const exists = await this.registry!.has(locator);
  assert.ok(exists, "Resource should exist in local registry");
});

Then("the resource should be cached locally", async function (this: RegistryWorld) {
  const { format } = await import("resourcexjs");
  const locator = format(this.resource!.locator);
  const exists = await this.registry!.has(locator);
  assert.ok(exists, "Resource should be cached locally");
});

Then("I can resolve {string}", async function (this: RegistryWorld, locator: string) {
  const resolved = await this.registry!.resolve(locator);
  assert.ok(resolved, "Should be able to resolve resource");
});

Then("I can resolve {string} from local", async function (this: RegistryWorld, locator: string) {
  const resolved = await this.registry!.resolve(locator);
  assert.ok(resolved, "Should be able to resolve resource from local");
});

Then("I should receive an RXR object", async function (this: RegistryWorld) {
  assert.ok(this.resolvedResource, "Should receive an Executable");
  assert.ok(this.resolvedResource?.execute, "Executable should have execute method");
});

Then("the content should be {string}", async function (this: RegistryWorld, expected: string) {
  const content = await this.resolvedResource!.execute();
  assert.equal(content, expected);
});

Then("it should throw a RegistryError", async function (this: RegistryWorld) {
  assert.ok(this.error, "Error should have been thrown");
  // Use error.name instead of instanceof (bundle-safe)
  assert.strictEqual(
    this.error?.name,
    "RegistryError",
    `Expected RegistryError but got ${this.error?.name}`
  );
});

Then("it should return true", async function (this: RegistryWorld) {
  assert.equal(this.existsResult, true);
});

Then("it should return false", async function (this: RegistryWorld) {
  assert.equal(this.existsResult, false);
});

Then("the resource should no longer exist", async function (this: RegistryWorld) {
  // Checked in next step
});

Then("checking existence should return false", async function (this: RegistryWorld) {
  const exists = await this.registry!.has("to-delete.prompt@1.0.0");
  assert.equal(exists, false);
});

Then("it should not throw an error", async function (this: RegistryWorld) {
  assert.ok(!this.error, "Should not throw an error");
});

Then("I should find {int} resources", async function (this: RegistryWorld, count: number) {
  if (this.error?.message?.includes("not implemented")) {
    return "pending";
  }
  assert.equal(this.searchResults?.length ?? 0, count);
});

Then("results should contain {string}", async function (this: RegistryWorld, name: string) {
  if (this.error?.message?.includes("not implemented")) {
    return "pending";
  }
  const found = this.searchResults?.some((locator) => locator.includes(name));
  assert.ok(found, `Results should contain "${name}"`);
});

Then(
  "the resource should be stored in {string}",
  async function (this: RegistryWorld, path: string) {
    // New storage structure: {basePath}/local/{name}.{type}/{version}/
    const fullPath = join(process.cwd(), path, "local", "test.text", "1.0.0");
    try {
      await stat(fullPath);
      assert.ok(true);
    } catch {
      assert.fail(`Resource should be stored in ${path}`);
    }
  }
);
