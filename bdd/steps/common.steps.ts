/**
 * Common step definitions shared across features
 */
import { Given, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

interface CommonWorld {
  url?: string;
  result?: { type: string; content: unknown; meta?: Record<string, unknown> } | null;
  error?: Error | null;
}

// Shared Given steps
Given("ARP URL {string}", function (this: CommonWorld, url: string) {
  this.url = url;
});

Given(
  "local file {string} with content {string}",
  async function (filePath: string, content: string) {
    const fullPath = join(process.cwd(), "bdd", filePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf-8");
  }
);

// Shared Then steps
Then("should return resource object", function (this: CommonWorld) {
  assert.ok(this.result, `Failed: ${this.error?.message}`);
  assert.ok(typeof this.result === "object", "Result should be an object");
});

Then("type should be {string}", function (this: CommonWorld, expected: string) {
  assert.ok(this.result, `Failed: ${this.error?.message}`);
  assert.equal(this.result.type, expected);
});

Then(
  "content should be {string}",
  function (this: CommonWorld & { result?: Buffer }, expected: string) {
    assert.ok(this.result, `Failed: ${this.error?.message}`);
    // Handle both Buffer (transport) and Resource (semantic/resolve)
    const content = Buffer.isBuffer(this.result)
      ? this.result.toString("utf-8")
      : (this.result as { content: unknown }).content;
    assert.equal(content, expected);
  }
);

Then(
  "content should contain {string}",
  function (this: CommonWorld & { result?: Buffer }, expected: string) {
    assert.ok(this.result, `Failed: ${this.error?.message}`);
    // Handle both Buffer (transport) and Resource (semantic/resolve)
    const content = Buffer.isBuffer(this.result)
      ? this.result.toString("utf-8")
      : String((this.result as { content: unknown }).content);
    assert.ok(content.includes(expected), `Content should include "${expected}", got: ${content}`);
  }
);

Then("should throw error", function (this: CommonWorld) {
  assert.ok(this.error, "Expected an error to be thrown");
});

Then("error message should contain {string}", function (this: CommonWorld, expected: string) {
  assert.ok(this.error, "Expected an error");
  assert.ok(
    this.error.message.includes(expected),
    `Error message should include "${expected}", got: ${this.error.message}`
  );
});

// Meta field assertions
Then("meta.url should be {string}", function (this: CommonWorld, expected: string) {
  assert.ok(this.result, `Failed: ${this.error?.message}`);
  assert.ok(this.result.meta, "Result should have meta");
  assert.equal(this.result.meta.url, expected);
});

Then("meta.semantic should be {string}", function (this: CommonWorld, expected: string) {
  assert.ok(this.result, `Failed: ${this.error?.message}`);
  assert.ok(this.result.meta, "Result should have meta");
  assert.equal(this.result.meta.semantic, expected);
});

Then("meta.transport should be {string}", function (this: CommonWorld, expected: string) {
  assert.ok(this.result, `Failed: ${this.error?.message}`);
  assert.ok(this.result.meta, "Result should have meta");
  assert.equal(this.result.meta.transport, expected);
});

Then("meta.encoding should be {string}", function (this: CommonWorld, expected: string) {
  assert.ok(this.result, `Failed: ${this.error?.message}`);
  assert.ok(this.result.meta, "Result should have meta");
  assert.equal(this.result.meta.encoding, expected);
});
