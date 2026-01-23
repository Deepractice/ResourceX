import { Given, When, Then, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir, rm, stat } from "node:fs/promises";
import type { ARP, ARL } from "resourcexjs/arp";

const TEST_DIR = join(process.cwd(), ".test-bdd-list-mkdir");

interface ListMkdirWorld {
  arp: ARP | null;
  arl: ARL | null;
  testDir: string;
  listResult: string[] | null;
  error: Error | null;
}

After({ tags: "@list-mkdir" }, async function () {
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

// Reuse background steps from transport.steps.ts
// These steps are already defined there:
// - "a file transport handler"
// - "a temporary directory for testing"
// - "a directory {string} with files:"
// - "a directory structure:"
// - "a directory {string}"

Given("an ARP instance with http transport only", async function (this: ListMkdirWorld) {
  const { createARP, httpTransport, textSemantic } = await import("resourcexjs/arp");
  this.arp = createARP({
    transports: [httpTransport],
    semantics: [textSemantic],
  });
  this.error = null;
});

When("I parse ARP URL {string} and call list", async function (this: ListMkdirWorld, url: string) {
  const { createARP } = await import("resourcexjs/arp");
  this.arp = this.arp ?? createARP();
  this.testDir = this.testDir ?? TEST_DIR;

  // Replace relative path with test directory
  const adjustedUrl = url.replace("file://", `file://${this.testDir}/`);

  try {
    this.arl = this.arp.parse(adjustedUrl);
    this.listResult = await this.arl.list();
    this.error = null;
  } catch (e) {
    this.error = e as Error;
    this.listResult = null;
  }
});

When(
  "I parse ARP URL {string} and call list with recursive option",
  async function (this: ListMkdirWorld, url: string) {
    const { createARP } = await import("resourcexjs/arp");
    this.arp = this.arp ?? createARP();
    this.testDir = this.testDir ?? TEST_DIR;

    const adjustedUrl = url.replace("file://", `file://${this.testDir}/`);

    try {
      this.arl = this.arp.parse(adjustedUrl);
      this.listResult = await this.arl.list({ recursive: true });
      this.error = null;
    } catch (e) {
      this.error = e as Error;
      this.listResult = null;
    }
  }
);

When(
  "I parse ARP URL {string} and call list with pattern {string}",
  async function (this: ListMkdirWorld, url: string, pattern: string) {
    const { createARP } = await import("resourcexjs/arp");
    this.arp = this.arp ?? createARP();
    this.testDir = this.testDir ?? TEST_DIR;

    const adjustedUrl = url.replace("file://", `file://${this.testDir}/`);

    try {
      this.arl = this.arp.parse(adjustedUrl);
      this.listResult = await this.arl.list({ pattern });
      this.error = null;
    } catch (e) {
      this.error = e as Error;
      this.listResult = null;
    }
  }
);

When("I parse ARP URL {string} and call mkdir", async function (this: ListMkdirWorld, url: string) {
  const { createARP } = await import("resourcexjs/arp");
  this.arp = this.arp ?? createARP();
  this.testDir = this.testDir ?? TEST_DIR;

  // Ensure test dir exists
  await mkdir(this.testDir, { recursive: true });

  const adjustedUrl = url.replace("file://", `file://${this.testDir}/`);

  try {
    this.arl = this.arp.parse(adjustedUrl);
    await this.arl.mkdir();
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

Then("list result should contain {string}", async function (this: ListMkdirWorld, item: string) {
  assert.ok(this.listResult, "List result should exist");
  assert.ok(
    this.listResult!.includes(item),
    `List should contain "${item}", got: ${this.listResult}`
  );
});

Then(
  "list result should not contain {string}",
  async function (this: ListMkdirWorld, item: string) {
    assert.ok(this.listResult, "List result should exist");
    assert.ok(!this.listResult!.includes(item), `List should not contain "${item}"`);
  }
);

Then("path {string} should exist", async function (this: ListMkdirWorld, path: string) {
  const fullPath = join(this.testDir, path);
  try {
    await stat(fullPath);
    assert.ok(true);
  } catch {
    assert.fail(`Path "${path}" should exist`);
  }
});

Then("path {string} should be a directory", async function (this: ListMkdirWorld, path: string) {
  const fullPath = join(this.testDir, path);
  const stats = await stat(fullPath);
  assert.ok(stats.isDirectory(), `Path "${path}" should be a directory`);
});

// "it should not throw an error" is defined in registry.steps.ts

Then(
  "it should throw a TransportError with message containing {string}",
  async function (this: ListMkdirWorld, expectedMsg: string) {
    const { TransportError } = await import("resourcexjs/arp");
    assert.ok(this.error, "Error should have been thrown");
    assert.ok(
      this.error instanceof TransportError,
      `Expected TransportError but got ${this.error?.name}`
    );
    assert.ok(
      this.error.message.includes(expectedMsg),
      `Error message should contain "${expectedMsg}", got: ${this.error.message}`
    );
  }
);
