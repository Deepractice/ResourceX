import { Given, When, Then, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir, rm, writeFile, access } from "node:fs/promises";
import type { TransportHandler, TransportResult } from "resourcexjs";

const TEST_DIR = join(process.cwd(), ".test-bdd-transport");

interface TransportWorld {
  transport: TransportHandler | null;
  testDir: string;
  result: TransportResult | null;
  error: Error | null;
}

After({ tags: "@transport" }, async function () {
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

Given("a file transport handler", async function (this: TransportWorld) {
  const { fileTransport } = await import("resourcexjs/arp");
  this.transport = fileTransport;
  this.error = null;
  this.result = null;
});

Given("a temporary directory for testing", async function (this: TransportWorld) {
  this.testDir = TEST_DIR;
  await mkdir(TEST_DIR, { recursive: true });
});

Given(
  "a file {string} with content {string}",
  async function (this: TransportWorld, filename: string, content: string) {
    const filePath = join(this.testDir, filename);
    await mkdir(join(this.testDir, ...filename.split("/").slice(0, -1)), { recursive: true });
    await writeFile(filePath, content);
  }
);

Given(
  "a directory {string} with files:",
  async function (
    this: TransportWorld,
    dirName: string,
    dataTable: { hashes: () => Array<{ name: string }> }
  ) {
    const dirPath = join(this.testDir, dirName);
    await mkdir(dirPath, { recursive: true });

    const rows = dataTable.hashes();
    for (const row of rows) {
      await writeFile(join(dirPath, row.name), "test content");
    }
  }
);

Given("a directory {string}", async function (this: TransportWorld, dirName: string) {
  const dirPath = join(this.testDir, dirName);
  await mkdir(dirPath, { recursive: true });
});

Given(
  "a directory structure:",
  async function (this: TransportWorld, dataTable: { hashes: () => Array<{ path: string }> }) {
    const rows = dataTable.hashes();
    for (const row of rows) {
      const filePath = join(this.testDir, row.path);
      const dir = join(this.testDir, ...row.path.split("/").slice(0, -1));
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, "test content");
    }
  }
);

When("transport get {string}", async function (this: TransportWorld, location: string) {
  try {
    this.result = await this.transport!.get(join(this.testDir, location));
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When(
  "transport get {string} with params:",
  async function (
    this: TransportWorld,
    location: string,
    dataTable: { hashes: () => Array<{ key: string; value: string }> }
  ) {
    const rows = dataTable.hashes();
    const params: Record<string, string> = {};
    for (const row of rows) {
      params[row.key] = row.value;
    }

    try {
      this.result = await this.transport!.get(join(this.testDir, location), params);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When(
  "transport set {string} with content {string}",
  async function (this: TransportWorld, location: string, content: string) {
    try {
      await this.transport!.set(join(this.testDir, location), Buffer.from(content));
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When("transport exists {string}", async function (this: TransportWorld, location: string) {
  try {
    const exists = await this.transport!.exists(join(this.testDir, location));
    this.result = { content: Buffer.from(exists ? "true" : "false") };
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When("transport delete {string}", async function (this: TransportWorld, location: string) {
  try {
    await this.transport!.delete(join(this.testDir, location));
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

Then("result content should be {string}", async function (this: TransportWorld, expected: string) {
  assert.ok(this.result, "Result should exist");
  assert.equal(this.result!.content.toString(), expected);
});

Then(
  "result metadata type should be {string}",
  async function (this: TransportWorld, expected: string) {
    assert.ok(this.result, "Result should exist");
    assert.equal(this.result!.metadata?.type, expected);
  }
);

Then(
  "result content should be a list containing {string}, {string}, {string}",
  async function (this: TransportWorld, a: string, b: string, c: string) {
    assert.ok(this.result, "Result should exist");
    const list = JSON.parse(this.result!.content.toString()) as string[];
    assert.ok(list.includes(a), `List should contain "${a}"`);
    assert.ok(list.includes(b), `List should contain "${b}"`);
    assert.ok(list.includes(c), `List should contain "${c}"`);
  }
);

Then(
  "result content should be a list containing {string}, {string}",
  async function (this: TransportWorld, a: string, b: string) {
    assert.ok(this.result, "Result should exist");
    const list = JSON.parse(this.result!.content.toString()) as string[];
    assert.ok(list.includes(a), `List should contain "${a}"`);
    assert.ok(list.includes(b), `List should contain "${b}"`);
  }
);

Then("result content should contain {string}", async function (this: TransportWorld, item: string) {
  assert.ok(this.result, "Result should exist");
  const list = JSON.parse(this.result!.content.toString()) as string[];
  assert.ok(list.includes(item), `List should contain "${item}"`);
});

Then(
  "result content should not contain {string}",
  async function (this: TransportWorld, item: string) {
    assert.ok(this.result, "Result should exist");
    const list = JSON.parse(this.result!.content.toString()) as string[];
    assert.ok(!list.includes(item), `List should not contain "${item}"`);
  }
);

Then("file {string} should exist", async function (this: TransportWorld, filename: string) {
  const filePath = join(this.testDir, filename);
  try {
    await access(filePath);
    assert.ok(true);
  } catch {
    assert.fail(`File "${filename}" should exist`);
  }
});

Then("file {string} should not exist", async function (this: TransportWorld, filename: string) {
  const filePath = join(this.testDir, filename);
  try {
    await access(filePath);
    assert.fail(`File "${filename}" should not exist`);
  } catch {
    assert.ok(true);
  }
});

Then(
  "transport file {string} should have content {string}",
  async function (this: TransportWorld, filename: string, expected: string) {
    const { readFile } = await import("node:fs/promises");
    const filePath = join(this.testDir, filename);
    const content = await readFile(filePath, "utf-8");
    assert.equal(content, expected);
  }
);

Then("it should throw a TransportError", async function (this: TransportWorld) {
  const { TransportError } = await import("resourcexjs/arp");
  assert.ok(this.error, "Error should have been thrown");
  assert.ok(
    this.error instanceof TransportError,
    `Expected TransportError but got ${this.error?.name}`
  );
});

Then(
  /error message should contain "(.+)" or "(.+)"/,
  async function (this: TransportWorld, msg1: string, msg2: string) {
    assert.ok(this.error, "Error should have been thrown");
    const message = this.error!.message.toLowerCase();
    assert.ok(
      message.includes(msg1.toLowerCase()) || message.includes(msg2.toLowerCase()),
      `Error message should contain "${msg1}" or "${msg2}"`
    );
  }
);

// "it should return true/false" defined in registry.steps.ts
// Use specific step names for transport tests

Then("transport exists should return true", async function (this: TransportWorld) {
  assert.ok(this.result, "Result should exist");
  assert.equal(this.result!.content.toString(), "true");
});

Then("transport exists should return false", async function (this: TransportWorld) {
  assert.ok(this.result, "Result should exist");
  assert.equal(this.result!.content.toString(), "false");
});

Then("path {string} should not exist", async function (this: TransportWorld, path: string) {
  const fullPath = join(this.testDir, path);
  try {
    await access(fullPath);
    assert.fail(`Path "${path}" should not exist`);
  } catch {
    assert.ok(true);
  }
});

Then("transport should not throw an error", async function (this: TransportWorld) {
  assert.ok(!this.error, `Should not throw an error but got: ${this.error?.message}`);
});
