import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import type { RXA, RXP, PathNode } from "resourcexjs";

interface ArchiveWorld {
  rxa: RXA | null;
  rxp: RXP | null;
  rxpSecond: RXP | null;
  rxaFromPack: RXA | null;
  paths: string[] | null;
  tree: PathNode[] | null;
  fileBuffer: Buffer | null;
  filesMap: Map<string, Buffer> | null;
  archiveBuffer: Buffer | null;
  existingTarGzBuffer: Buffer | null;
  stream: ReadableStream<Uint8Array> | null;
  error: Error | null;
}

// ============================================
// Background
// ============================================

Given("I have access to resourcexjs archive", async function (this: ArchiveWorld) {
  const { createRXA } = await import("resourcexjs");
  assert.ok(createRXA, "createRXA should be defined");
});

// ============================================
// RXA - Create archive
// ============================================

When(
  "I create archive with file {string} containing {string}",
  async function (this: ArchiveWorld, path: string, content: string) {
    const { createRXA } = await import("resourcexjs");
    this.rxa = await createRXA({ [path]: Buffer.from(content) });
  }
);

When("I create archive with files:", async function (this: ArchiveWorld, dataTable: DataTable) {
  const { createRXA } = await import("resourcexjs");
  const files: Record<string, Buffer> = {};

  for (const row of dataTable.hashes()) {
    files[row.path] = Buffer.from(row.content);
  }

  this.rxa = await createRXA(files);
});

Given(
  "an existing tar.gz buffer with file {string} containing {string}",
  async function (this: ArchiveWorld, path: string, content: string) {
    const { createRXA } = await import("resourcexjs");
    const tempRxa = await createRXA({ [path]: Buffer.from(content) });
    this.existingTarGzBuffer = await tempRxa.buffer();
  }
);

When("I create archive from the buffer", async function (this: ArchiveWorld) {
  const { createRXA } = await import("resourcexjs");
  assert.ok(this.existingTarGzBuffer, "Existing buffer should be defined");
  this.rxa = await createRXA({ buffer: this.existingTarGzBuffer });
});

// ============================================
// Given - Pre-created archive
// ============================================

Given(
  "archive with file {string} containing {string}",
  async function (this: ArchiveWorld, path: string, content: string) {
    const { createRXA } = await import("resourcexjs");
    this.rxa = await createRXA({ [path]: Buffer.from(content) });
  }
);

Given("archive with files:", async function (this: ArchiveWorld, dataTable: DataTable) {
  const { createRXA } = await import("resourcexjs");
  const files: Record<string, Buffer> = {};

  for (const row of dataTable.hashes()) {
    files[row.path] = Buffer.from(row.content);
  }

  this.rxa = await createRXA(files);
});

// ============================================
// RXA - Archive operations
// ============================================

When("I get archive buffer", async function (this: ArchiveWorld) {
  assert.ok(this.rxa, "RXA should be defined");
  this.archiveBuffer = await this.rxa.buffer();
});

When("I get archive stream", async function (this: ArchiveWorld) {
  assert.ok(this.rxa, "RXA should be defined");
  this.stream = this.rxa.stream;
});

Then("I should receive a Buffer", function (this: ArchiveWorld) {
  assert.ok(this.archiveBuffer, "Archive buffer should be defined");
  assert.ok(Buffer.isBuffer(this.archiveBuffer), "Should be a Buffer");
});

Then("I should receive a ReadableStream", function (this: ArchiveWorld) {
  assert.ok(this.stream, "Stream should be defined");
  assert.ok(typeof this.stream.getReader === "function", "Should be a ReadableStream");
});

Then("archive buffer should be valid tar.gz format", async function (this: ArchiveWorld) {
  assert.ok(this.rxa, "RXA should be defined");
  const buffer = await this.rxa.buffer();
  // tar.gz magic bytes: 1f 8b (gzip header)
  assert.equal(buffer[0], 0x1f, "First byte should be 0x1f (gzip)");
  assert.equal(buffer[1], 0x8b, "Second byte should be 0x8b (gzip)");
});

// ============================================
// RXA.extract() -> RXP
// ============================================

When("I extract the archive", async function (this: ArchiveWorld) {
  assert.ok(this.rxa, "RXA should be defined");
  this.rxp = await this.rxa.extract();
});

When("I extract the archive twice", async function (this: ArchiveWorld) {
  assert.ok(this.rxa, "RXA should be defined");
  this.rxp = await this.rxa.extract();
  this.rxpSecond = await this.rxa.extract();
});

Then("I should receive an RXP package", function (this: ArchiveWorld) {
  assert.ok(this.rxp, "RXP should be defined");
  assert.ok(typeof this.rxp.paths === "function", "RXP should have paths method");
  assert.ok(typeof this.rxp.file === "function", "RXP should have file method");
});

Then("both extractions should return the same RXP instance", function (this: ArchiveWorld) {
  assert.ok(this.rxp, "First RXP should be defined");
  assert.ok(this.rxpSecond, "Second RXP should be defined");
  assert.strictEqual(this.rxp, this.rxpSecond, "Should be the same instance");
});

// ============================================
// RXP - paths()
// ============================================

When("I extract and get paths", async function (this: ArchiveWorld) {
  assert.ok(this.rxa, "RXA should be defined");
  this.rxp = await this.rxa.extract();
  this.paths = this.rxp.paths();
});

Then(/^paths should equal \[(.+)\]$/, function (this: ArchiveWorld, expected: string) {
  assert.ok(this.paths, "Paths should be defined");
  // Parse the array content, handling both quoted strings
  const expectedArray = expected.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
  assert.deepEqual(this.paths, expectedArray);
});

Then("paths should contain {string}", function (this: ArchiveWorld, path: string) {
  assert.ok(this.paths, "Paths should be defined");
  assert.ok(this.paths.includes(path), `Paths should contain "${path}"`);
});

Then("paths should have {int} items", function (this: ArchiveWorld, count: number) {
  assert.ok(this.paths, "Paths should be defined");
  assert.equal(this.paths.length, count, `Expected ${count} paths but got ${this.paths.length}`);
});

// ============================================
// RXP - tree()
// ============================================

When("I extract and get tree", async function (this: ArchiveWorld) {
  assert.ok(this.rxa, "RXA should be defined");
  this.rxp = await this.rxa.extract();
  this.tree = this.rxp.tree();
});

Then("tree should have {int} root nodes", function (this: ArchiveWorld, count: number) {
  assert.ok(this.tree, "Tree should be defined");
  assert.equal(this.tree.length, count, `Expected ${count} root nodes but got ${this.tree.length}`);
});

Then("tree should contain file node {string}", function (this: ArchiveWorld, name: string) {
  assert.ok(this.tree, "Tree should be defined");
  const found = this.tree.some((node) => node.name === name && node.type === "file");
  assert.ok(found, `Tree should contain file node "${name}"`);
});

Then("tree should contain directory node {string}", function (this: ArchiveWorld, name: string) {
  assert.ok(this.tree, "Tree should be defined");
  const found = this.tree.some((node) => node.name === name && node.type === "directory");
  assert.ok(found, `Tree should contain directory node "${name}"`);
});

Then(
  "{string} directory should contain {string}",
  function (this: ArchiveWorld, dirName: string, fileName: string) {
    assert.ok(this.tree, "Tree should be defined");
    const dir = this.tree.find((node) => node.name === dirName && node.type === "directory");
    assert.ok(dir, `Directory "${dirName}" should exist`);
    assert.ok(dir.children, `Directory "${dirName}" should have children`);
    const found = dir.children.some((child) => child.name === fileName);
    assert.ok(found, `Directory "${dirName}" should contain "${fileName}"`);
  }
);

Then(
  "{string} directory should contain directory {string}",
  function (this: ArchiveWorld, dirName: string, subDirName: string) {
    assert.ok(this.tree, "Tree should be defined");
    const dir = this.tree.find((node) => node.name === dirName && node.type === "directory");
    assert.ok(dir, `Directory "${dirName}" should exist`);
    assert.ok(dir.children, `Directory "${dirName}" should have children`);
    const found = dir.children.some(
      (child) => child.name === subDirName && child.type === "directory"
    );
    assert.ok(found, `Directory "${dirName}" should contain directory "${subDirName}"`);
  }
);

// ============================================
// RXP - file()
// ============================================

When("I extract and read file {string}", async function (this: ArchiveWorld, path: string) {
  assert.ok(this.rxa, "RXA should be defined");
  this.rxp = await this.rxa.extract();
  try {
    this.fileBuffer = await this.rxp.file(path);
  } catch (e) {
    this.error = e as Error;
  }
});

Then("rxp file buffer should contain {string}", function (this: ArchiveWorld, expected: string) {
  assert.ok(this.fileBuffer, "File buffer should be defined");
  assert.equal(this.fileBuffer.toString(), expected);
});

Then(
  "rxp should throw ContentError with message {string}",
  async function (this: ArchiveWorld, expectedMessage: string) {
    const { ContentError } = await import("resourcexjs");
    assert.ok(this.error, "Error should have been thrown");
    assert.ok(
      this.error instanceof ContentError,
      `Expected ContentError but got ${this.error.name}`
    );
    assert.ok(
      this.error.message.includes(expectedMessage),
      `Expected message to include "${expectedMessage}" but got "${this.error.message}"`
    );
  }
);

// ============================================
// RXP - files()
// ============================================

When("I extract and read all files", async function (this: ArchiveWorld) {
  assert.ok(this.rxa, "RXA should be defined");
  this.rxp = await this.rxa.extract();
  this.filesMap = await this.rxp.files();
});

Then("rxp files map should have {int} entries", function (this: ArchiveWorld, count: number) {
  assert.ok(this.filesMap, "Files map should be defined");
  assert.equal(this.filesMap.size, count);
});

Then(
  "rxp files map should contain {string} with {string}",
  function (this: ArchiveWorld, path: string, expected: string) {
    assert.ok(this.filesMap, "Files map should be defined");
    const buffer = this.filesMap.get(path);
    assert.ok(buffer, `File "${path}" should exist in map`);
    assert.equal(buffer.toString(), expected);
  }
);

// ============================================
// RXP.pack() -> RXA
// ============================================

When("I extract and then pack", async function (this: ArchiveWorld) {
  assert.ok(this.rxa, "RXA should be defined");
  this.rxp = await this.rxa.extract();
  this.rxaFromPack = await this.rxp.pack();
});

Then("I should receive an RXA archive", function (this: ArchiveWorld) {
  assert.ok(this.rxaFromPack, "RXA from pack should be defined");
  assert.ok(typeof this.rxaFromPack.buffer === "function", "RXA should have buffer method");
  assert.ok(typeof this.rxaFromPack.extract === "function", "RXA should have extract method");
});

Then("the new archive buffer should be valid tar.gz format", async function (this: ArchiveWorld) {
  assert.ok(this.rxaFromPack, "RXA from pack should be defined");
  const buffer = await this.rxaFromPack.buffer();
  assert.equal(buffer[0], 0x1f, "First byte should be 0x1f (gzip)");
  assert.equal(buffer[1], 0x8b, "Second byte should be 0x8b (gzip)");
});

// ============================================
// Roundtrip
// ============================================

When("I extract, pack, and extract again", async function (this: ArchiveWorld) {
  assert.ok(this.rxa, "RXA should be defined");
  const rxp1 = await this.rxa.extract();
  this.paths = rxp1.paths(); // Save original paths
  const rxa2 = await rxp1.pack();
  this.rxp = await rxa2.extract();
});

Then("the final package should have same paths as original", function (this: ArchiveWorld) {
  assert.ok(this.paths, "Original paths should be defined");
  assert.ok(this.rxp, "Final RXP should be defined");
  const finalPaths = this.rxp.paths();
  assert.deepEqual(finalPaths.sort(), this.paths.sort(), "Paths should match");
});

Then(
  "rxp file {string} should contain {string}",
  async function (this: ArchiveWorld, path: string, expected: string) {
    assert.ok(this.rxp, "RXP should be defined");
    const buffer = await this.rxp.file(path);
    assert.equal(buffer.toString(), expected);
  }
);
