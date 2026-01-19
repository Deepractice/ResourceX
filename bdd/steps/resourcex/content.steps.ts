import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import type { RXC } from "resourcexjs";

interface ContentWorld {
  rxc: RXC | null;
  fileBuffer: Buffer | null;
  filesMap: Map<string, Buffer> | null;
  rawBuffer: Buffer | null;
  error: Error | null;
}

Given("I have access to resourcexjs content", async function (this: ContentWorld) {
  const { createRXC } = await import("resourcexjs");
  assert.ok(createRXC, "createRXC should be defined");
});

// ============================================
// Create - Single file
// ============================================

When(
  "I create content with file {string} containing {string}",
  async function (this: ContentWorld, path: string, content: string) {
    const { createRXC } = await import("resourcexjs");
    this.rxc = await createRXC({ [path]: Buffer.from(content) });
  }
);

// ============================================
// Create - Multiple files
// ============================================

When("I create content with files:", async function (this: ContentWorld, dataTable: DataTable) {
  const { createRXC } = await import("resourcexjs");
  const files: Record<string, Buffer> = {};

  for (const row of dataTable.hashes()) {
    files[row.path] = Buffer.from(row.content);
  }

  this.rxc = await createRXC(files);
});

// ============================================
// Given - Pre-created content
// ============================================

Given(
  "content with file {string} containing {string}",
  async function (this: ContentWorld, path: string, content: string) {
    const { createRXC } = await import("resourcexjs");
    this.rxc = await createRXC({ [path]: Buffer.from(content) });
  }
);

Given("content with files:", async function (this: ContentWorld, dataTable: DataTable) {
  const { createRXC } = await import("resourcexjs");
  const files: Record<string, Buffer> = {};

  for (const row of dataTable.hashes()) {
    files[row.path] = Buffer.from(row.content);
  }

  this.rxc = await createRXC(files);
});

// ============================================
// Read - file() and files()
// ============================================

When("I read file {string}", async function (this: ContentWorld, path: string) {
  assert.ok(this.rxc, "RXC should be defined");
  try {
    this.fileBuffer = await this.rxc.file(path);
  } catch (e) {
    this.error = e as Error;
  }
});

When("I read all files", async function (this: ContentWorld) {
  assert.ok(this.rxc, "RXC should be defined");
  this.filesMap = await this.rxc.files();
});

When("I get the raw buffer", async function (this: ContentWorld) {
  assert.ok(this.rxc, "RXC should be defined");
  this.rawBuffer = await this.rxc.buffer();
});

// ============================================
// Then - Assertions
// ============================================

Then("content should have {int} file(s)", async function (this: ContentWorld, count: number) {
  assert.ok(this.rxc, "RXC should be defined");
  const files = await this.rxc.files();
  assert.equal(files.size, count, `Expected ${count} files but got ${files.size}`);
});

Then(
  "rxc file {string} should contain {string}",
  async function (this: ContentWorld, path: string, expected: string) {
    assert.ok(this.rxc, "RXC should be defined");
    const buffer = await this.rxc.file(path);
    assert.equal(buffer.toString(), expected);
  }
);

Then("I should get buffer containing {string}", function (this: ContentWorld, expected: string) {
  assert.ok(this.fileBuffer, "File buffer should be defined");
  assert.equal(this.fileBuffer.toString(), expected);
});

Then("I should get a map with {int} entries", function (this: ContentWorld, count: number) {
  assert.ok(this.filesMap, "Files map should be defined");
  assert.equal(this.filesMap.size, count);
});

Then(
  "map should contain {string} with {string}",
  function (this: ContentWorld, path: string, expected: string) {
    assert.ok(this.filesMap, "Files map should be defined");
    const buffer = this.filesMap.get(path);
    assert.ok(buffer, `File "${path}" should exist in map`);
    assert.equal(buffer.toString(), expected);
  }
);

Then(
  "it should throw ContentError with message {string}",
  async function (this: ContentWorld, expectedMessage: string) {
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

Then("buffer should be valid tar.gz format", function (this: ContentWorld) {
  assert.ok(this.rawBuffer, "Raw buffer should be defined");
  // tar.gz magic bytes: 1f 8b (gzip header)
  assert.equal(this.rawBuffer[0], 0x1f, "First byte should be 0x1f (gzip)");
  assert.equal(this.rawBuffer[1], 0x8b, "Second byte should be 0x8b (gzip)");
});
