import { Given, When, Then, After, Before } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir, rm, writeFile, stat } from "node:fs/promises";
import type { ResourceX, RXR, RXL, ResolvedResource, RXD } from "resourcexjs";

const TEST_DIR = join(process.cwd(), ".test-bdd-resourcex");
const DEV_DIR = join(process.cwd(), ".test-bdd-dev");

interface ResourceXWorld {
  rx: ResourceX | null;
  rxr: RXR | null;
  resolvedResource: ResolvedResource | null;
  existsResult: boolean | null;
  searchResults: RXL[] | null;
  error: Error | null;
  customPath: string | null;
  devPath: string | null;
  loadedRxr: RXR | null;
}

Before({ tags: "@resourcex" }, async function (this: ResourceXWorld) {
  await mkdir(TEST_DIR, { recursive: true });
  await mkdir(DEV_DIR, { recursive: true });
  this.error = null;
  this.rxr = null;
  this.resolvedResource = null;
  this.existsResult = null;
  this.searchResults = null;
  this.customPath = null;
  this.devPath = null;
  this.loadedRxr = null;
});

After({ tags: "@resourcex" }, async function () {
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
    await rm(DEV_DIR, { recursive: true, force: true });
    // Also clean custom paths
    await rm(join(process.cwd(), "custom-rx"), { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

// ============================================
// Given steps
// ============================================

Given("a ResourceX client with default configuration", async function (this: ResourceXWorld) {
  const { createResourceX } = await import("resourcexjs");
  this.rx = createResourceX({ path: TEST_DIR });
});

Given("a ResourceX client with path {string}", async function (this: ResourceXWorld, path: string) {
  const { createResourceX } = await import("resourcexjs");
  this.customPath = join(process.cwd(), path);
  await mkdir(this.customPath, { recursive: true });
  this.rx = createResourceX({ path: this.customPath });
});

Given(
  "an RXR with:",
  async function (
    this: ResourceXWorld,
    dataTable: {
      hashes: () => Array<{ domain: string; name: string; type: string; version: string }>;
    }
  ) {
    const { manifest, archive, resource } = await import("resourcexjs");
    const row = dataTable.hashes()[0];

    const rxd: RXD = {
      domain: row.domain,
      name: row.name,
      type: row.type,
      version: row.version,
    };
    const rxm = manifest(rxd);
    const rxa = await archive({ content: Buffer.from("default content") });
    this.rxr = resource(rxm, rxa);
  }
);

Given("RXR content {string}", async function (this: ResourceXWorld, content: string) {
  const { archive, resource } = await import("resourcexjs");
  if (this.rxr) {
    const rxa = await archive({ content: Buffer.from(content) });
    this.rxr = resource(this.rxr.manifest, rxa);
  }
});

Given(
  "a saved RXR {string} with content {string}",
  async function (this: ResourceXWorld, locator: string, content: string) {
    const { parse, manifest, archive, resource } = await import("resourcexjs");
    const rxl = parse(locator);
    const rxd: RXD = {
      domain: rxl.domain ?? "localhost",
      name: rxl.name,
      type: rxl.type ?? "text",
      version: rxl.version ?? "1.0.0",
    };
    const rxm = manifest(rxd);
    const rxa = await archive({ content: Buffer.from(content) });
    const rxr = resource(rxm, rxa);
    await this.rx!.save(rxr);
  }
);

Given("a saved RXR {string}", async function (this: ResourceXWorld, locator: string) {
  const { parse, manifest, archive, resource } = await import("resourcexjs");
  const rxl = parse(locator);
  const rxd: RXD = {
    domain: rxl.domain ?? "localhost",
    name: rxl.name,
    type: rxl.type ?? "text",
    version: rxl.version ?? "1.0.0",
  };
  const rxm = manifest(rxd);
  const rxa = await archive({ content: Buffer.from("test content") });
  const rxr = resource(rxm, rxa);
  await this.rx!.save(rxr);
});

Given(
  "saved RXRs:",
  async function (this: ResourceXWorld, dataTable: { hashes: () => Array<{ locator: string }> }) {
    const { parse, manifest, archive, resource } = await import("resourcexjs");
    const rows = dataTable.hashes();

    for (const row of rows) {
      const rxl = parse(row.locator);
      const rxd: RXD = {
        domain: rxl.domain ?? "localhost",
        name: rxl.name,
        type: rxl.type ?? "text",
        version: rxl.version ?? "1.0.0",
      };
      const rxm = manifest(rxd);
      const rxa = await archive({ content: Buffer.from("test content") });
      const rxr = resource(rxm, rxa);
      await this.rx!.save(rxr);
    }
  }
);

Given(
  "a dev directory with resource:",
  async function (
    this: ResourceXWorld,
    dataTable: {
      hashes: () => Array<{ domain: string; name: string; type: string; version: string }>;
    }
  ) {
    const row = dataTable.hashes()[0];
    const resourceDir = join(DEV_DIR, row.name);
    await mkdir(resourceDir, { recursive: true });

    const resourceJson = {
      domain: row.domain,
      name: row.name,
      type: row.type,
      version: row.version,
    };
    await writeFile(join(resourceDir, "resource.json"), JSON.stringify(resourceJson, null, 2));
    await writeFile(join(resourceDir, "content"), "default content");

    this.devPath = resourceDir;
  }
);

Given("dev content {string}", async function (this: ResourceXWorld, content: string) {
  if (this.devPath) {
    await writeFile(join(this.devPath, "content"), content);
  }
});

Given(
  "a linked dev directory {string} with content {string}",
  async function (this: ResourceXWorld, locator: string, content: string) {
    const { parse } = await import("resourcexjs");
    const rxl = parse(locator);

    const resourceDir = join(DEV_DIR, `${rxl.name}-linked`);
    await mkdir(resourceDir, { recursive: true });

    const resourceJson = {
      domain: rxl.domain ?? "localhost",
      name: rxl.name,
      type: rxl.type ?? "text",
      version: rxl.version ?? "1.0.0",
    };
    await writeFile(join(resourceDir, "resource.json"), JSON.stringify(resourceJson, null, 2));
    await writeFile(join(resourceDir, "content"), content);

    await this.rx!.link(resourceDir);
  }
);

Given("a custom uppercase type {string}", async function (this: ResourceXWorld, _typeName: string) {
  // Type will be registered in the When step
});

// ============================================
// When steps
// ============================================

When("I save the RXR", async function (this: ResourceXWorld) {
  try {
    await this.rx!.save(this.rxr!);
  } catch (e) {
    this.error = e as Error;
  }
});

When("I save an RXR {string}", async function (this: ResourceXWorld, locator: string) {
  const { parse, manifest, archive, resource } = await import("resourcexjs");
  try {
    const rxl = parse(locator);
    const rxd: RXD = {
      domain: rxl.domain ?? "localhost",
      name: rxl.name,
      type: rxl.type ?? "text",
      version: rxl.version ?? "1.0.0",
    };
    const rxm = manifest(rxd);
    const rxa = await archive({ content: Buffer.from("test content") });
    const rxr = resource(rxm, rxa);
    await this.rx!.save(rxr);
  } catch (e) {
    this.error = e as Error;
  }
});

When(
  "I save an RXR {string} with content {string}",
  async function (this: ResourceXWorld, locator: string, content: string) {
    const { parse, manifest, archive, resource } = await import("resourcexjs");
    try {
      const rxl = parse(locator);
      const rxd: RXD = {
        domain: rxl.domain ?? "localhost",
        name: rxl.name,
        type: rxl.type ?? "text",
        version: rxl.version ?? "1.0.0",
      };
      const rxm = manifest(rxd);
      const rxa = await archive({ content: Buffer.from(content) });
      const rxr = resource(rxm, rxa);
      await this.rx!.save(rxr);
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When("I get resource {string}", async function (this: ResourceXWorld, locator: string) {
  try {
    this.rxr = await this.rx!.get(locator);
  } catch (e) {
    this.error = e as Error;
  }
});

When("I resolve resource {string}", async function (this: ResourceXWorld, locator: string) {
  try {
    this.resolvedResource = await this.rx!.resolve(locator);
  } catch (e) {
    this.error = e as Error;
  }
});

When("I check has {string}", async function (this: ResourceXWorld, locator: string) {
  this.existsResult = await this.rx!.has(locator);
});

When("I remove resource {string}", async function (this: ResourceXWorld, locator: string) {
  try {
    await this.rx!.remove(locator);
  } catch (e) {
    this.error = e as Error;
  }
});

When("I link the dev directory", async function (this: ResourceXWorld) {
  try {
    await this.rx!.link(this.devPath!);
  } catch (e) {
    this.error = e as Error;
  }
});

When("I load the dev directory", async function (this: ResourceXWorld) {
  try {
    this.loadedRxr = await this.rx!.load(this.devPath!);
  } catch (e) {
    this.error = e as Error;
  }
});

When(
  "I search resources with query {string}",
  async function (this: ResourceXWorld, query: string) {
    try {
      this.searchResults = await this.rx!.search({ query });
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When("I search resources with limit {int}", async function (this: ResourceXWorld, limit: number) {
  try {
    this.searchResults = await this.rx!.search({ limit });
  } catch (e) {
    this.error = e as Error;
  }
});

When("I register the uppercase type", async function (this: ResourceXWorld) {
  this.rx!.supportType({
    name: "uppercase",
    description: "Custom uppercase type",
    code: `({
      async resolve(ctx) {
        const content = ctx.files["content"];
        return new TextDecoder().decode(content).toUpperCase();
      }
    })`,
  });
});

// ============================================
// Then steps
// ============================================

Then("I can get resource {string}", async function (this: ResourceXWorld, locator: string) {
  const rxr = await this.rx!.get(locator);
  assert.ok(rxr, "Should be able to get resource");
});

Then("I should receive an RXR", async function (this: ResourceXWorld) {
  const rxr = this.rxr || this.loadedRxr;
  assert.ok(rxr, "Should receive an RXR");
  assert.ok(rxr?.manifest, "RXR should have manifest");
  assert.ok(rxr?.archive, "RXR should have archive");
});

Then("manifest name should be {string}", async function (this: ResourceXWorld, name: string) {
  assert.equal(this.rxr?.manifest.name, name);
});

Then("manifest type should be {string}", async function (this: ResourceXWorld, type: string) {
  assert.equal(this.rxr?.manifest.type, type);
});

Then("it should throw RegistryError", async function (this: ResourceXWorld) {
  assert.ok(this.error, "Error should have been thrown");
  assert.strictEqual(
    this.error?.name,
    "RegistryError",
    `Expected RegistryError but got ${this.error?.name}`
  );
});

Then(
  "the error message should contain {string}",
  async function (this: ResourceXWorld, msg: string) {
    assert.ok(this.error?.message.includes(msg), `Error should contain "${msg}"`);
  }
);

Then("I should receive a ResolvedResource", async function (this: ResourceXWorld) {
  assert.ok(this.resolvedResource, "Should receive a ResolvedResource");
  assert.ok(this.resolvedResource?.execute, "ResolvedResource should have execute function");
});

Then(
  "executing should return text {string}",
  async function (this: ResourceXWorld, expected: string) {
    const result = await this.resolvedResource!.execute();
    assert.equal(result, expected);
  }
);

Then(
  "executing should return object with key {string} and value {string}",
  async function (this: ResourceXWorld, key: string, value: string) {
    const result = (await this.resolvedResource!.execute()) as Record<string, unknown>;
    assert.equal(result[key], value);
  }
);

Then("has should return true", async function (this: ResourceXWorld) {
  assert.equal(this.existsResult, true);
});

Then("has should return false", async function (this: ResourceXWorld) {
  assert.equal(this.existsResult, false);
});

Then(
  "has for {string} should return false",
  async function (this: ResourceXWorld, locator: string) {
    const exists = await this.rx!.has(locator);
    assert.equal(exists, false);
  }
);

Then(
  "resource content should be {string}",
  async function (this: ResourceXWorld, expected: string) {
    const resolved = await this.rx!.resolve(
      this.rxr!.manifest.domain +
        "/" +
        this.rxr!.manifest.name +
        "." +
        this.rxr!.manifest.type +
        "@" +
        this.rxr!.manifest.version
    );
    const result = await resolved.execute();
    assert.equal(result, expected);
  }
);

Then("loaded content should be {string}", async function (this: ResourceXWorld, expected: string) {
  const { extract } = await import("resourcexjs");
  const files = await extract(this.loadedRxr!.archive);
  const content = files["content"]?.toString("utf-8");
  assert.equal(content, expected);
});

Then("search should find {int} resources", async function (this: ResourceXWorld, count: number) {
  assert.equal(this.searchResults?.length ?? 0, count);
});

Then("resource should be stored in {string}", async function (this: ResourceXWorld, path: string) {
  const fullPath = join(process.cwd(), path, "hosted", "localhost", "test.text", "1.0.0");
  try {
    await stat(fullPath);
    assert.ok(true);
  } catch {
    assert.fail(`Resource should be stored in ${path}`);
  }
});

Then("resource should be in hosted storage", async function (this: ResourceXWorld) {
  const hostedPath = join(TEST_DIR, "hosted");
  try {
    await stat(hostedPath);
    assert.ok(true);
  } catch {
    assert.fail("Resource should be in hosted storage");
  }
});
