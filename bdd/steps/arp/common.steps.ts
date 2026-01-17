/**
 * Common step definitions shared across ARP features
 */
import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ARP } from "resourcexjs/arp";

interface CommonWorld {
  arp?: ARP;
  url?: string;
  content?: unknown;
  result?: { type: string; content: unknown; meta?: Record<string, unknown> } | null;
  error?: Error | null;
}

// Helper to create ARP instance
async function getARP(): Promise<ARP> {
  const { createARP, fileTransport, httpsTransport, httpTransport, textSemantic, binarySemantic } =
    await import("resourcexjs/arp");
  return createARP({
    transports: [fileTransport, httpsTransport, httpTransport],
    semantics: [textSemantic, binarySemantic],
  });
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

// Resource operations
When("deposit the content to {string}", async function (this: CommonWorld, url: string) {
  assert.ok(this.content !== undefined && this.content !== null, "Content not set");
  try {
    const arp = await getARP();
    const arl = arp.parse(url);
    await arl.deposit(this.content);
  } catch (e) {
    this.error = e as Error;
  }
});

When("delete resource {string}", async function (this: CommonWorld, url: string) {
  try {
    const arp = await getARP();
    const arl = arp.parse(url);
    await arl.delete();
  } catch (e) {
    this.error = e as Error;
  }
});

Then("resource {string} should exist", async function (this: CommonWorld, url: string) {
  const arp = await getARP();
  const arl = arp.parse(url);
  const exists = await arl.exists();
  assert.ok(exists, `Resource should exist: ${url}`);
});

Then("resource {string} should not exist", async function (this: CommonWorld, url: string) {
  const arp = await getARP();
  const arl = arp.parse(url);
  const exists = await arl.exists();
  assert.ok(!exists, `Resource should not exist: ${url}`);
});
