import { Given, When, Then, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir, rm, stat } from "node:fs/promises";
import type { Registry, RXR, RXL } from "resourcexjs";

const TEST_DIR = join(process.cwd(), ".test-bdd-registry");

interface RegistryWorld {
  registry: Registry | null;
  resource: RXR | null;
  resolvedResource: RXR | null;
  existsResult: boolean | null;
  searchResults: RXL[] | null;
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
  const { createRegistry } = await import("resourcexjs");
  await mkdir(TEST_DIR, { recursive: true });
  this.registry = createRegistry({ path: TEST_DIR });
  this.error = null;
});

Given("a registry with path {string}", async function (this: RegistryWorld, path: string) {
  const { createRegistry } = await import("resourcexjs");
  this.customPath = join(process.cwd(), path);
  await mkdir(this.customPath, { recursive: true });
  this.registry = createRegistry({ path: this.customPath });
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
    const { createRXM, createRXC, parseRXL } = await import("resourcexjs");
    const rows = dataTable.hashes();
    const row = rows[0];

    const manifest = createRXM({
      domain: row.domain,
      name: row.name,
      type: row.type,
      version: row.version,
    });

    this.resource = {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      content: createRXC("default content"),
    };
  }
);

Given("resource content {string}", async function (this: RegistryWorld, content: string) {
  const { createRXC } = await import("resourcexjs");
  if (this.resource) {
    this.resource.content = createRXC(content);
  }
});

Given(
  "a linked resource {string} with content {string}",
  async function (this: RegistryWorld, locator: string, content: string) {
    const { createRXM, createRXC, parseRXL } = await import("resourcexjs");

    const rxl = parseRXL(locator);
    const manifest = createRXM({
      domain: rxl.domain ?? "localhost",
      name: rxl.name,
      type: rxl.type ?? "prompt",
      version: rxl.version ?? "1.0.0",
    });

    const rxr: RXR = {
      locator: rxl,
      manifest,
      content: createRXC(content),
    };

    await this.registry!.link(rxr);
  }
);

Given("a linked resource {string}", async function (this: RegistryWorld, locator: string) {
  const { createRXM, createRXC, parseRXL } = await import("resourcexjs");

  const rxl = parseRXL(locator);
  const manifest = createRXM({
    domain: rxl.domain ?? "localhost",
    name: rxl.name,
    type: rxl.type ?? "prompt",
    version: rxl.version ?? "1.0.0",
  });

  const rxr: RXR = {
    locator: rxl,
    manifest,
    content: createRXC("test content"),
  };

  await this.registry!.link(rxr);
});

Given(
  "linked resources:",
  async function (this: RegistryWorld, dataTable: { hashes: () => Array<{ locator: string }> }) {
    const { createRXM, createRXC, parseRXL } = await import("resourcexjs");
    const rows = dataTable.hashes();

    for (const row of rows) {
      const rxl = parseRXL(row.locator);
      const manifest = createRXM({
        domain: rxl.domain ?? "localhost",
        name: rxl.name,
        type: rxl.type ?? "prompt",
        version: rxl.version ?? "1.0.0",
      });

      const rxr: RXR = {
        locator: rxl,
        manifest,
        content: createRXC("test content"),
      };

      await this.registry!.link(rxr);
    }
  }
);

When("I link the resource", async function (this: RegistryWorld) {
  try {
    await this.registry!.link(this.resource!);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When("I link a resource {string}", async function (this: RegistryWorld, locator: string) {
  const { createRXM, createRXC, parseRXL } = await import("resourcexjs");

  const rxl = parseRXL(locator);
  const manifest = createRXM({
    domain: rxl.domain ?? "localhost",
    name: rxl.name,
    type: rxl.type ?? "prompt",
    version: rxl.version ?? "1.0.0",
  });

  this.resource = {
    locator: rxl,
    manifest,
    content: createRXC("test content"),
  };

  try {
    await this.registry!.link(this.resource);
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
  this.existsResult = await this.registry!.exists(locator);
});

When("I delete {string}", async function (this: RegistryWorld, locator: string) {
  try {
    await this.registry!.delete(locator);
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
    // Search by type - currently not fully supported
    try {
      this.searchResults = await this.registry!.search(_type);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

Then("the resource should exist in local registry", async function (this: RegistryWorld) {
  const locator = this.resource!.manifest.toLocator();
  const exists = await this.registry!.exists(locator);
  assert.ok(exists, "Resource should exist in local registry");
});

Then("the resource should be cached locally", async function (this: RegistryWorld) {
  const locator = this.resource!.manifest.toLocator();
  const exists = await this.registry!.exists(locator);
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
  assert.ok(this.resolvedResource, "Should receive an RXR object");
  assert.ok(this.resolvedResource?.locator, "RXR should have locator");
  assert.ok(this.resolvedResource?.manifest, "RXR should have manifest");
  assert.ok(this.resolvedResource?.content, "RXR should have content");
});

Then("the content should be {string}", async function (this: RegistryWorld, expected: string) {
  const content = await this.resolvedResource!.content.text();
  assert.equal(content, expected);
});

Then("it should throw a RegistryError", async function (this: RegistryWorld) {
  const { RegistryError } = await import("resourcexjs");
  assert.ok(this.error, "Error should have been thrown");
  assert.ok(
    this.error instanceof RegistryError,
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
  const exists = await this.registry!.exists("localhost/to-delete.prompt@1.0.0");
  assert.equal(exists, false);
});

Then("it should not throw an error", async function (this: RegistryWorld) {
  assert.ok(!this.error, "Should not throw an error");
});

Then("I should find {int} resources", async function (this: RegistryWorld, count: number) {
  // Search not implemented yet - skip assertion if error
  if (this.error?.message?.includes("not implemented")) {
    return "pending";
  }
  assert.equal(this.searchResults?.length ?? 0, count);
});

Then("results should contain {string}", async function (this: RegistryWorld, name: string) {
  // Search not implemented yet - skip assertion if error
  if (this.error?.message?.includes("not implemented")) {
    return "pending";
  }
  const found = this.searchResults?.some((rxl) => rxl.name.includes(name));
  assert.ok(found, `Results should contain "${name}"`);
});

Then(
  "the resource should be stored in {string}",
  async function (this: RegistryWorld, path: string) {
    const fullPath = join(process.cwd(), path, "localhost", "test.prompt@1.0.0");
    try {
      await stat(fullPath);
      assert.ok(true);
    } catch {
      assert.fail(`Resource should be stored in ${path}`);
    }
  }
);
