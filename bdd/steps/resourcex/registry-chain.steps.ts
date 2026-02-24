import { strict as assert } from "node:assert";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { After, Before, Given, Then, When } from "@cucumber/cucumber";
import { NodeProvider } from "@resourcexjs/node-provider";
import type { ResourceX } from "resourcexjs";
import { createResourceX, setProvider } from "resourcexjs";

setProvider(new NodeProvider());

const TEST_DIR = join(process.cwd(), ".test-bdd-registry-chain");

interface RegistryChainWorld {
  rx: ResourceX;
  result: unknown;
  error: Error | null;
}

Before({ tags: "@registry-chain" }, async function (this: RegistryChainWorld) {
  await mkdir(TEST_DIR, { recursive: true });
  this.result = null;
  this.error = null;
});

After({ tags: "@registry-chain" }, async () => {
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

// ============================================
// Given steps
// ============================================

Given("no registries are configured", async function (this: RegistryChainWorld) {
  // Create ResourceX with no registry config — should fallback to built-in default
  this.rx = createResourceX({ path: TEST_DIR });
});

Given(
  "a configured registry {string} at {string}",
  async function (this: RegistryChainWorld, _name: string, url: string) {
    this.rx = createResourceX({ path: TEST_DIR, registry: url });
  }
);

// ============================================
// When steps
// ============================================

When("I resolve via chain {string}", async function (this: RegistryChainWorld, locator: string) {
  this.result = await this.rx.ingest(locator);
});

When(
  "I try to resolve via chain {string}",
  async function (this: RegistryChainWorld, locator: string) {
    try {
      this.result = await this.rx.ingest(locator);
    } catch (e) {
      this.error = e as Error;
    }
  }
);

// ============================================
// Then steps
// ============================================

Then("execute should return a non-empty string", function (this: RegistryChainWorld) {
  assert.ok(typeof this.result === "string", `Expected string, got ${typeof this.result}`);
  assert.ok((this.result as string).length > 0, "Expected non-empty string");
});

Then(
  "the resource {string} should be cached locally",
  async function (this: RegistryChainWorld, locator: string) {
    const exists = await this.rx.has(locator);
    assert.ok(exists, `Resource ${locator} should be cached locally after resolve`);
  }
);

Then("it should fail with an error", function (this: RegistryChainWorld) {
  assert.ok(this.error !== null, "Expected an error but none was thrown");
});
