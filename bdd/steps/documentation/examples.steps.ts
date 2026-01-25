import { Given, When, Then, Before, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { rm } from "node:fs/promises";
import type { Registry, RXR, RXL, RXM, RXA, RXP, ResolvedResource } from "resourcexjs";

const TEST_DIR = join(process.cwd(), ".test-doc-examples");

interface DocExamplesWorld {
  registry: Registry | null;
  locator: RXL | null;
  manifest: RXM | null;
  archive: RXA | null;
  package: RXP | null;
  rxr: RXR | null;
  retrievedRxr: RXR | null;
  resolvedResource: ResolvedResource | null;
  newArchive: RXA | null;
  searchResults: RXL[] | null;
  error: Error | null;
}

Before({ tags: "@documentation" }, async function (this: DocExamplesWorld) {
  this.registry = null;
  this.locator = null;
  this.manifest = null;
  this.archive = null;
  this.package = null;
  this.rxr = null;
  this.retrievedRxr = null;
  this.resolvedResource = null;
  this.newArchive = null;
  this.searchResults = null;
  this.error = null;
});

After({ tags: "@documentation" }, async function () {
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

// Helper to parse vertical data table (key | value format)
function parseVerticalTable(dataTable: { raw: () => string[][] }): Record<string, string> {
  const rows = dataTable.raw();
  const data: Record<string, string> = {};
  for (const row of rows) {
    if (row.length >= 2) {
      data[row[0].trim()] = row[1].trim();
    }
  }
  return data;
}

// ============================================
// Background
// ============================================

Given("a clean test registry", async function (this: DocExamplesWorld) {
  await rm(TEST_DIR, { recursive: true, force: true }).catch(() => {});
  const { createRegistry } = await import("resourcexjs");
  this.registry = createRegistry({ path: TEST_DIR });
});

// ============================================
// RXL Steps
// ============================================

When("I doc parse locator {string}", async function (this: DocExamplesWorld, locatorStr: string) {
  const { parseRXL } = await import("resourcexjs");
  this.locator = parseRXL(locatorStr);
});

Then("doc locator domain should be {string}", function (this: DocExamplesWorld, expected: string) {
  assert.equal(this.locator?.domain, expected);
});

Then("doc locator domain should be undefined", function (this: DocExamplesWorld) {
  assert.equal(this.locator?.domain, undefined);
});

Then("doc locator path should be {string}", function (this: DocExamplesWorld, expected: string) {
  assert.equal(this.locator?.path, expected);
});

Then("doc locator name should be {string}", function (this: DocExamplesWorld, expected: string) {
  assert.equal(this.locator?.name, expected);
});

Then("doc locator type should be {string}", function (this: DocExamplesWorld, expected: string) {
  assert.equal(this.locator?.type, expected);
});

Then("doc locator type should be undefined", function (this: DocExamplesWorld) {
  assert.equal(this.locator?.type, undefined);
});

Then("doc locator version should be {string}", function (this: DocExamplesWorld, expected: string) {
  assert.equal(this.locator?.version, expected);
});

Then(
  "doc locator toString should be {string}",
  function (this: DocExamplesWorld, expected: string) {
    assert.equal(this.locator?.toString(), expected);
  }
);

// ============================================
// RXM Steps
// ============================================

Given(
  "I doc create manifest with:",
  async function (this: DocExamplesWorld, dataTable: { raw: () => string[][] }) {
    const { createRXM } = await import("resourcexjs");
    const data = parseVerticalTable(dataTable);
    this.manifest = createRXM(data);
  }
);

Then("doc manifest domain should be {string}", function (this: DocExamplesWorld, expected: string) {
  assert.equal(this.manifest?.domain, expected);
});

Then(
  "doc manifest toLocator should be {string}",
  function (this: DocExamplesWorld, expected: string) {
    assert.equal(this.manifest?.toLocator(), expected);
  }
);

// ============================================
// RXA Steps
// ============================================

Given(
  "I doc create archive with content {string}",
  async function (this: DocExamplesWorld, content: string) {
    const { createRXA } = await import("resourcexjs");
    this.archive = await createRXA({ content });
  }
);

Given(
  "I doc create archive with files:",
  async function (
    this: DocExamplesWorld,
    dataTable: { hashes: () => Array<{ path: string; content: string }> }
  ) {
    const { createRXA } = await import("resourcexjs");
    const rows = dataTable.hashes();
    const files: Record<string, string> = {};
    for (const row of rows) {
      files[row.path] = row.content;
    }
    this.archive = await createRXA(files);
  }
);

Then(
  "doc archive should have file {string}",
  async function (this: DocExamplesWorld, path: string) {
    const pkg = await this.archive!.extract();
    const paths = pkg.paths();
    assert.ok(paths.includes(path), `Archive should have file "${path}", got: ${paths.join(", ")}`);
  }
);

Then(
  "doc archive file {string} should contain {string}",
  async function (this: DocExamplesWorld, path: string, expected: string) {
    const pkg = await this.archive!.extract();
    const buffer = await pkg.file(path);
    assert.equal(buffer.toString(), expected);
  }
);

// ============================================
// RXP Steps
// ============================================

When("I doc extract the archive to package", async function (this: DocExamplesWorld) {
  this.package = await this.archive!.extract();
});

Then(
  "doc package paths should contain {string}",
  function (this: DocExamplesWorld, expected: string) {
    const paths = this.package!.paths();
    assert.ok(
      paths.includes(expected),
      `Package paths should contain "${expected}", got: ${paths.join(", ")}`
    );
  }
);

Then(
  "doc package tree should have directory {string}",
  function (this: DocExamplesWorld, dirName: string) {
    const tree = this.package!.tree();
    const found = tree.find((node) => node.name === dirName && node.type === "directory");
    assert.ok(found, `Package tree should have directory "${dirName}"`);
  }
);

Then(
  "doc package tree should have file {string}",
  function (this: DocExamplesWorld, fileName: string) {
    const tree = this.package!.tree();
    const found = tree.find((node) => node.name === fileName && node.type === "file");
    assert.ok(found, `Package tree should have file "${fileName}"`);
  }
);

Then(
  "doc package tree {string} should have file {string}",
  function (this: DocExamplesWorld, dirName: string, fileName: string) {
    const tree = this.package!.tree();
    const dir = tree.find((node) => node.name === dirName && node.type === "directory");
    assert.ok(dir, `Package tree should have directory "${dirName}"`);
    const found = dir!.children?.find((node) => node.name === fileName && node.type === "file");
    assert.ok(found, `Directory "${dirName}" should have file "${fileName}"`);
  }
);

Then(
  "doc package tree {string} should have directory {string}",
  function (this: DocExamplesWorld, parentDir: string, childDir: string) {
    const tree = this.package!.tree();
    const parent = tree.find((node) => node.name === parentDir && node.type === "directory");
    assert.ok(parent, `Package tree should have directory "${parentDir}"`);
    const found = parent!.children?.find(
      (node) => node.name === childDir && node.type === "directory"
    );
    assert.ok(found, `Directory "${parentDir}" should have directory "${childDir}"`);
  }
);

Then(
  "doc package file {string} should contain {string}",
  async function (this: DocExamplesWorld, path: string, expected: string) {
    const buffer = await this.package!.file(path);
    assert.equal(buffer.toString(), expected);
  }
);

Then(
  "doc package files map should have key {string} with value {string}",
  async function (this: DocExamplesWorld, key: string, value: string) {
    const files = await this.package!.files();
    assert.ok(files.has(key), `Files map should have key "${key}"`);
    assert.equal(files.get(key)!.toString(), value);
  }
);

When("I doc pack the package back to archive", async function (this: DocExamplesWorld) {
  this.newArchive = await this.package!.pack();
});

Then(
  "doc new archive file {string} should contain {string}",
  async function (this: DocExamplesWorld, path: string, expected: string) {
    const pkg = await this.newArchive!.extract();
    const buffer = await pkg.file(path);
    assert.equal(buffer.toString(), expected);
  }
);

// ============================================
// RXR Steps
// ============================================

When("I doc assemble RXR from manifest and archive", async function (this: DocExamplesWorld) {
  const { parseRXL } = await import("resourcexjs");
  this.rxr = {
    locator: parseRXL(this.manifest!.toLocator()),
    manifest: this.manifest!,
    archive: this.archive!,
  };
});

Then(
  "doc RXR locator toString should be {string}",
  function (this: DocExamplesWorld, expected: string) {
    assert.equal(this.rxr?.locator.toString(), expected);
  }
);

Then(
  "doc RXR manifest name should be {string}",
  function (this: DocExamplesWorld, expected: string) {
    assert.equal(this.rxr?.manifest.name, expected);
  }
);

Then(
  "doc RXR archive file {string} should contain {string}",
  async function (this: DocExamplesWorld, path: string, expected: string) {
    const pkg = await this.rxr!.archive.extract();
    const buffer = await pkg.file(path);
    assert.equal(buffer.toString(), expected);
  }
);

// ============================================
// Registry Steps
// ============================================

Given(
  "I doc create a complete resource:",
  async function (this: DocExamplesWorld, dataTable: { raw: () => string[][] }) {
    const { createRXM, createRXA, parseRXL } = await import("resourcexjs");
    const data = parseVerticalTable(dataTable);

    const content = data.content;
    delete data.content;

    this.manifest = createRXM(data);
    this.archive = await createRXA({ content });
    this.rxr = {
      locator: parseRXL(this.manifest.toLocator()),
      manifest: this.manifest,
      archive: this.archive,
    };
  }
);

When("I doc add the resource to registry", async function (this: DocExamplesWorld) {
  await this.registry!.add(this.rxr!);
});

When("I doc get {string} from registry", async function (this: DocExamplesWorld, locator: string) {
  this.retrievedRxr = await this.registry!.get(locator);
});

When(
  "I doc resolve {string} from registry",
  async function (this: DocExamplesWorld, locator: string) {
    this.resolvedResource = await this.registry!.resolve(locator);
  }
);

Then(
  "doc retrieved RXR manifest name should be {string}",
  function (this: DocExamplesWorld, expected: string) {
    assert.equal(this.retrievedRxr?.manifest.name, expected);
  }
);

Then(
  "doc retrieved RXR archive should contain {string}",
  async function (this: DocExamplesWorld, expected: string) {
    const pkg = await this.retrievedRxr!.archive.extract();
    const buffer = await pkg.file("content");
    assert.equal(buffer.toString(), expected);
  }
);

Then(
  "doc retrieved RXR archive should have file {string}",
  async function (this: DocExamplesWorld, path: string) {
    const pkg = await this.retrievedRxr!.archive.extract();
    const paths = pkg.paths();
    assert.ok(paths.includes(path), `Archive should have file "${path}"`);
  }
);

Then(
  "doc resolved execute should return {string}",
  async function (this: DocExamplesWorld, expected: string) {
    const result = await this.resolvedResource!.execute();
    assert.equal(result, expected);
  }
);

Then(
  "doc {string} should exist in registry",
  async function (this: DocExamplesWorld, locator: string) {
    const exists = await this.registry!.exists(locator);
    assert.ok(exists, `"${locator}" should exist in registry`);
  }
);

Then(
  "doc {string} should not exist in registry",
  async function (this: DocExamplesWorld, locator: string) {
    const exists = await this.registry!.exists(locator);
    assert.ok(!exists, `"${locator}" should not exist in registry`);
  }
);

When(
  "I doc search registry with query {string}",
  async function (this: DocExamplesWorld, query: string) {
    this.searchResults = await this.registry!.search({ query });
  }
);

Then("doc search results should contain {string}", function (this: DocExamplesWorld, name: string) {
  const found = this.searchResults?.some((rxl) => rxl.name.includes(name));
  assert.ok(found, `Search results should contain "${name}"`);
});
