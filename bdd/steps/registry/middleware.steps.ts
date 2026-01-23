import { Given, When, Then, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { rm } from "node:fs/promises";
import type { Registry, RXR, RXL, ResolvedResource } from "resourcexjs";

const TEST_DIR = join(process.cwd(), ".test-bdd-middleware");

interface MiddlewareWorld {
  registry: Registry | null;
  wrappedRegistry: Registry | null;
  testDir: string;
  rxr: RXR | null;
  resolvedResource: ResolvedResource | null;
  existsResult: boolean | null;
  searchResults: RXL[] | null;
  error: Error | null;
}

After({ tags: "@middleware" }, async function () {
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

Given("a test registry directory", async function (this: MiddlewareWorld) {
  this.testDir = TEST_DIR;
  this.error = null;
  this.rxr = null;
  this.resolvedResource = null;
  this.existsResult = null;
  this.searchResults = null;
});

Given(
  "a local registry with a resource {string} and content {string}",
  async function (this: MiddlewareWorld, locator: string, content: string) {
    const { createRegistry, createRXM, createRXC, parseRXL } = await import("resourcexjs");

    this.registry = createRegistry({ path: this.testDir });

    const rxl = parseRXL(locator);
    const manifest = createRXM({
      domain: rxl.domain ?? "localhost",
      path: rxl.path,
      name: rxl.name,
      type: rxl.type ?? "text",
      version: rxl.version ?? "1.0.0",
    });

    const rxc = await createRXC({ content });

    const rxr: RXR = {
      locator: rxl,
      manifest,
      content: rxc,
    };

    await this.registry.add(rxr);
  }
);

Given(
  "I wrap the registry with domain validation for {string}",
  async function (this: MiddlewareWorld, trustedDomain: string) {
    const { withDomainValidation } = await import("resourcexjs");

    assert.ok(this.registry, "Registry should exist");
    this.wrappedRegistry = withDomainValidation(this.registry, trustedDomain);
  }
);

When(
  "I get {string} from the wrapped registry",
  async function (this: MiddlewareWorld, locator: string) {
    assert.ok(this.wrappedRegistry, "Wrapped registry should exist");

    try {
      this.rxr = await this.wrappedRegistry.get(locator);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
      this.rxr = null;
    }
  }
);

When(
  "I resolve {string} from the wrapped registry",
  async function (this: MiddlewareWorld, locator: string) {
    assert.ok(this.wrappedRegistry, "Wrapped registry should exist");

    try {
      this.resolvedResource = await this.wrappedRegistry.resolve(locator);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
      this.resolvedResource = null;
    }
  }
);

When(
  "I check if {string} exists in the wrapped registry",
  async function (this: MiddlewareWorld, locator: string) {
    assert.ok(this.wrappedRegistry, "Wrapped registry should exist");

    try {
      this.existsResult = await this.wrappedRegistry.exists(locator);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When("I search the wrapped registry without options", async function (this: MiddlewareWorld) {
  assert.ok(this.wrappedRegistry, "Wrapped registry should exist");

  try {
    this.searchResults = await this.wrappedRegistry.search();
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

Then(
  "I should receive an RXR with content {string}",
  async function (this: MiddlewareWorld, expectedContent: string) {
    assert.ok(!this.error, `Should not throw error: ${this.error?.message}`);
    assert.ok(this.rxr, "Should receive an RXR");

    const content = await this.rxr.content.file("content");
    assert.equal(content.toString(), expectedContent);
  }
);

Then(
  "it should throw a RegistryError with message containing {string}",
  async function (this: MiddlewareWorld, expectedMsg: string) {
    const { RegistryError } = await import("resourcexjs");

    assert.ok(this.error, "Error should have been thrown");
    assert.ok(
      this.error instanceof RegistryError,
      `Expected RegistryError but got ${this.error?.name}: ${this.error?.message}`
    );
    assert.ok(
      this.error.message.includes(expectedMsg),
      `Error message should contain "${expectedMsg}", got: ${this.error.message}`
    );
  }
);

Then("it should succeed without error", async function (this: MiddlewareWorld) {
  assert.ok(!this.error, `Should not throw error: ${this.error?.message}`);
});

Then("the wrapped registry should return true", async function (this: MiddlewareWorld) {
  assert.ok(!this.error, `Should not throw error: ${this.error?.message}`);
  assert.strictEqual(this.existsResult, true);
});

Then(
  "the wrapped search results should include {string}",
  async function (this: MiddlewareWorld, partialLocator: string) {
    assert.ok(!this.error, `Should not throw error: ${this.error?.message}`);
    assert.ok(this.searchResults, "Search results should exist");

    const found = this.searchResults.some((rxl) => rxl.toString().includes(partialLocator));
    assert.ok(found, `Search results should include "${partialLocator}"`);
  }
);
