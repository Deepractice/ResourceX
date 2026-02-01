import { Given, When, Then, Before, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import type { ResourceX, Resource, Executable } from "resourcexjs";

const TEST_DIR = join(process.cwd(), ".test-bdd-resourcex");
const DEV_DIR = join(TEST_DIR, "dev");

interface ResourceXWorld {
  rx: ResourceX;
  tempResourceDir: string | null;
  devDir: string | null;
  info: Resource | null;
  executable: Executable | null;
  searchResults: string[] | null;
  error: Error | null;
}

// ============================================
// Hooks
// ============================================

Before({ tags: "@resourcex" }, async function (this: ResourceXWorld) {
  const { createResourceX } = await import("resourcexjs");
  await mkdir(TEST_DIR, { recursive: true });
  this.rx = createResourceX({ path: TEST_DIR });
  this.tempResourceDir = null;
  this.devDir = null;
  this.info = null;
  this.executable = null;
  this.searchResults = null;
  this.error = null;
});

After({ tags: "@resourcex" }, async function () {
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

// ============================================
// Helper functions
// ============================================

/**
 * Parse Docker-style locator format: name:tag
 * Returns { name, tag }
 */
function parseLocator(locator: string): { name: string; tag: string } {
  const colonIndex = locator.lastIndexOf(":");
  if (colonIndex === -1) {
    return { name: locator, tag: "latest" };
  }
  return {
    name: locator.substring(0, colonIndex),
    tag: locator.substring(colonIndex + 1),
  };
}

async function createResourceDir(
  basePath: string,
  name: string,
  type: string,
  version: string,
  content: string
): Promise<string> {
  const dir = join(basePath, name);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "content"), content);
  await writeFile(join(dir, "resource.json"), JSON.stringify({ name, type, version }));
  return dir;
}

// ============================================
// Given steps
// ============================================

Given(
  "a resource directory with:",
  async function (
    this: ResourceXWorld,
    dataTable: {
      hashes: () => Array<{ name: string; type: string; version: string; content: string }>;
    }
  ) {
    const rows = dataTable.hashes();
    const row = rows[0];
    this.tempResourceDir = await createResourceDir(
      TEST_DIR,
      row.name,
      row.type,
      row.version,
      row.content
    );
  }
);

Given(
  "I have added resource {string} with type {string}",
  async function (this: ResourceXWorld, locator: string, type: string) {
    const { name, tag } = parseLocator(locator);
    const dir = await createResourceDir(TEST_DIR, name, type, tag, "default content");
    await this.rx.add(dir);
  }
);

Given(
  "I have added resource {string} with type {string} and content {string}",
  async function (this: ResourceXWorld, locator: string, type: string, content: string) {
    const { name, tag } = parseLocator(locator);
    const dir = await createResourceDir(TEST_DIR, name, type, tag, content);
    await this.rx.add(dir);
  }
);

Given(
  "I have added resources:",
  async function (
    this: ResourceXWorld,
    dataTable: { hashes: () => Array<{ locator: string; type: string }> }
  ) {
    const rows = dataTable.hashes();
    for (const row of rows) {
      const { name, tag } = parseLocator(row.locator);
      const dir = await createResourceDir(TEST_DIR, name, row.type, tag, "content");
      await this.rx.add(dir);
    }
  }
);

Given(
  "a dev directory with resource {string} type {string} and content {string}",
  async function (this: ResourceXWorld, locator: string, type: string, content: string) {
    const { name, tag } = parseLocator(locator);
    this.devDir = await createResourceDir(DEV_DIR, name, type, tag, content);
  }
);

Given(
  "a linked dev directory with {string} type {string} and content {string}",
  async function (this: ResourceXWorld, locator: string, type: string, content: string) {
    const { name, tag } = parseLocator(locator);
    const dir = await createResourceDir(DEV_DIR, name, type, tag, content);
    await this.rx.link(dir);
  }
);

Given(
  "a custom {string} type that uppercases content",
  async function (this: ResourceXWorld, typeName: string) {
    this.rx.supportType({
      name: typeName,
      description: "Uppercase type",
      code: `({
        async resolve(ctx) {
          const content = new TextDecoder().decode(ctx.files["content"]);
          return content.toUpperCase();
        }
      })`,
    });
  }
);

// ============================================
// When steps
// ============================================

When("I add the resource directory", async function (this: ResourceXWorld) {
  await this.rx.add(this.tempResourceDir!);
});

When("I link the dev directory", async function (this: ResourceXWorld) {
  await this.rx.link(this.devDir!);
});

When(
  "I add resource {string} with type {string} and content {string}",
  async function (this: ResourceXWorld, locator: string, type: string, content: string) {
    const { name, tag } = parseLocator(locator);
    const dir = await createResourceDir(TEST_DIR, name, type, tag, content);
    await this.rx.add(dir);
  }
);

When("I get info for {string}", async function (this: ResourceXWorld, locator: string) {
  this.info = await this.rx.info(locator);
});

When("I remove {string}", async function (this: ResourceXWorld, locator: string) {
  await this.rx.remove(locator);
});

When("I resolve {string}", async function (this: ResourceXWorld, locator: string) {
  this.executable = await this.rx.resolve(locator);
});

When("I search for {string}", async function (this: ResourceXWorld, query: string) {
  this.searchResults = await this.rx.search(query);
});

// ============================================
// Then steps
// ============================================

Then("the resource {string} should exist", async function (this: ResourceXWorld, locator: string) {
  const exists = await this.rx.has(locator);
  assert.ok(exists, `Resource ${locator} should exist`);
});

Then("has {string} should return true", async function (this: ResourceXWorld, locator: string) {
  const exists = await this.rx.has(locator);
  assert.equal(exists, true);
});

Then("has {string} should return false", async function (this: ResourceXWorld, locator: string) {
  const exists = await this.rx.has(locator);
  assert.equal(exists, false);
});

Then(
  "resolving {string} should return {string}",
  async function (this: ResourceXWorld, locator: string, expected: string) {
    const executable = await this.rx.resolve(locator);
    const result = await executable.execute();
    assert.equal(result, expected);
  }
);

Then("info name should be {string}", function (this: ResourceXWorld, expected: string) {
  assert.equal(this.info!.name, expected);
});

Then("info type should be {string}", function (this: ResourceXWorld, expected: string) {
  assert.equal(this.info!.type, expected);
});

Then("info version should be {string}", function (this: ResourceXWorld, expected: string) {
  assert.equal(this.info!.tag, expected);
});

Then("execute should return {string}", async function (this: ResourceXWorld, expected: string) {
  const result = await this.executable!.execute();
  assert.equal(result, expected);
});

Then(
  "execute should return object with key {string}",
  async function (this: ResourceXWorld, key: string) {
    const result = await this.executable!.execute();
    assert.ok(typeof result === "object" && result !== null);
    assert.ok(key in (result as Record<string, unknown>));
  }
);

Then("search should find {int} resources", function (this: ResourceXWorld, count: number) {
  assert.equal(this.searchResults!.length, count);
});
