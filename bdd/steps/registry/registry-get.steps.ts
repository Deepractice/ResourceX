import { Given, When, Then, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import type { Registry, RXR } from "resourcexjs";

const TEST_DIR = join(process.cwd(), ".test-bdd-registry-get");

interface RegistryGetWorld {
  registry: Registry | null;
  rxr: RXR | null;
  error: Error | null;
}

After({ tags: "@get" }, async function () {
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

Given(
  "a linked multi-file resource {string}:",
  async function (
    this: RegistryGetWorld,
    locator: string,
    dataTable: { hashes: () => Array<{ path: string; content: string }> }
  ) {
    const { createRXM, createRXA, parseRXL } = await import("resourcexjs");

    const rxl = parseRXL(locator);
    const manifest = createRXM({
      domain: rxl.domain ?? "localhost",
      name: rxl.name,
      type: rxl.type ?? "text",
      version: rxl.version ?? "1.0.0",
    });

    const rows = dataTable.hashes();
    const files: Record<string, string> = {};
    for (const row of rows) {
      files[row.path] = row.content;
    }

    const rxr: RXR = {
      locator: rxl,
      manifest,
      archive: await createRXA(files),
    };

    await this.registry!.add(rxr);
  }
);

When("I get {string}", async function (this: RegistryGetWorld, locator: string) {
  try {
    this.rxr = await this.registry!.get(locator);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
    this.rxr = null;
  }
});

Then("I should receive a raw RXR", async function (this: RegistryGetWorld) {
  assert.ok(!this.error, `Should not throw error: ${this.error?.message}`);
  assert.ok(this.rxr, "Should receive an RXR");
  assert.ok(this.rxr?.locator, "RXR should have locator");
  assert.ok(this.rxr?.manifest, "RXR should have manifest");
  assert.ok(this.rxr?.archive, "RXR should have archive");
});

Then(
  "rxr.locator should have name {string}",
  async function (this: RegistryGetWorld, name: string) {
    assert.equal(this.rxr?.locator.name, name);
  }
);

Then(
  "rxr.manifest should have type {string}",
  async function (this: RegistryGetWorld, type: string) {
    assert.equal(this.rxr?.manifest.type, type);
  }
);

Then("rxr.archive should be accessible", async function (this: RegistryGetWorld) {
  assert.ok(this.rxr?.archive, "Archive should exist");
  // Verify we can access archive methods
  const pkg = await this.rxr!.archive.extract();
  const files = await pkg.files();
  assert.ok(files instanceof Map, "files() should return a Map");
});

Then(
  "rxr.archive.extract\\().files\\() should have {int} files",
  async function (this: RegistryGetWorld, count: number) {
    const pkg = await this.rxr!.archive.extract();
    const files = await pkg.files();
    assert.equal(files.size, count);
  }
);

Then(
  "rxr file {string} should contain {string}",
  async function (this: RegistryGetWorld, path: string, expected: string) {
    const pkg = await this.rxr!.archive.extract();
    const file = await pkg.file(path);
    assert.ok(file, `File ${path} should exist`);
    assert.ok(file.toString().includes(expected), `File should contain "${expected}"`);
  }
);

Then("rxr.archive should be raw archive content", async function (this: RegistryGetWorld) {
  assert.ok(this.rxr?.archive, "Archive should exist");
  // Verify archive is accessible as raw buffer
  const buffer = await this.rxr!.archive.buffer();
  assert.ok(Buffer.isBuffer(buffer), "buffer() should return a Buffer");
});

Then("I can read file content as Buffer", async function (this: RegistryGetWorld) {
  const pkg = await this.rxr!.archive.extract();
  const files = await pkg.files();
  for (const [, content] of files) {
    assert.ok(Buffer.isBuffer(content), "File content should be a Buffer");
  }
});

Then(
  "the raw content should be {string}",
  async function (this: RegistryGetWorld, expected: string) {
    assert.ok(this.rxr, "Should have rxr from get()");
    const pkg = await this.rxr!.archive.extract();
    const file = await pkg.file("content");
    assert.ok(file, "Should have content file");
    assert.equal(file.toString(), expected, "Content should match");
  }
);
