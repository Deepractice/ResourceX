import { Given, When, Then, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { rm } from "node:fs/promises";
import type { Registry, RXR, RXL, ResolvedResource } from "resourcexjs";

const GITHUB_CACHE_DIR = join(process.cwd(), ".test-github-cache");

interface DiscoveryResult {
  domain: string;
  registries: string[];
}

interface GitHubWorld {
  registry: Registry | null;
  rxr: RXR | null;
  resolvedResource: ResolvedResource | null;
  existsResult: boolean | null;
  searchResults: RXL[] | null;
  error: Error | null;
  discoveryResult: DiscoveryResult | null;
}

After({ tags: "@github" }, async function () {
  // Clean up test cache directory
  try {
    await rm(GITHUB_CACHE_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

// ============================================
// Configuration steps
// ============================================

When(
  "I create a registry with URL {string} and domain {string}",
  async function (this: GitHubWorld, url: string, domain: string) {
    const { createRegistry } = await import("resourcexjs");
    try {
      this.registry = createRegistry({ url, domain });
      this.error = null;
    } catch (e) {
      this.error = e as Error;
      this.registry = null;
    }
  }
);

When(
  "I create a registry with URL {string} without domain",
  async function (this: GitHubWorld, url: string) {
    const { createRegistry } = await import("resourcexjs");
    try {
      this.registry = createRegistry({ url });
      this.error = null;
    } catch (e) {
      this.error = e as Error;
      this.registry = null;
    }
  }
);

// ============================================
// Given steps
// ============================================

Given(
  "a registry with URL {string} and domain {string}",
  { timeout: 60000 },
  async function (this: GitHubWorld, url: string, domain: string) {
    const { createRegistry } = await import("resourcexjs");
    this.registry = createRegistry({ url, domain });
    this.error = null;
  }
);

// ============================================
// Resolve steps (URL registry specific)
// ============================================

When(
  "I resolve {string} using the URL registry",
  { timeout: 60000 },
  async function (this: GitHubWorld, locator: string) {
    try {
      this.resolvedResource = await this.registry!.resolve(locator);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
      this.resolvedResource = null;
    }
  }
);

Then("the resolve should succeed", function (this: GitHubWorld) {
  assert.ok(!this.error, `Should not throw error: ${this.error?.message}`);
  assert.ok(this.resolvedResource, "Should have resolved resource");
});

Then(
  "the resolve should fail with {string}",
  function (this: GitHubWorld, expectedMessage: string) {
    assert.ok(this.error, "Should throw an error");
    assert.ok(
      this.error!.message.toLowerCase().includes(expectedMessage.toLowerCase()),
      `Error should contain "${expectedMessage}", got: ${this.error!.message}`
    );
  }
);

// ============================================
// Exists steps (URL registry specific)
// ============================================

When(
  "I check if {string} exists using the URL registry",
  { timeout: 60000 },
  async function (this: GitHubWorld, locator: string) {
    this.existsResult = await this.registry!.exists(locator);
  }
);

Then("the exists check should return true", function (this: GitHubWorld) {
  assert.strictEqual(this.existsResult, true);
});

Then("the exists check should return false", function (this: GitHubWorld) {
  assert.strictEqual(this.existsResult, false);
});

// ============================================
// Search steps (URL registry specific)
// ============================================

When(
  "I search in the URL registry without options",
  { timeout: 60000 },
  async function (this: GitHubWorld) {
    try {
      this.searchResults = await this.registry!.search();
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When(
  "I search in the URL registry with query {string}",
  { timeout: 60000 },
  async function (this: GitHubWorld, query: string) {
    try {
      this.searchResults = await this.registry!.search({ query });
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

Then("the search should find at least {int} resource", function (this: GitHubWorld, count: number) {
  assert.ok(!this.error, `Should not throw error: ${this.error?.message}`);
  assert.ok(this.searchResults, "Should have search results");
  assert.ok(
    this.searchResults!.length >= count,
    `Expected at least ${count} results, got ${this.searchResults!.length}`
  );
});

Then("the search results should contain {string}", function (this: GitHubWorld, name: string) {
  assert.ok(this.searchResults, "Should have search results");
  const found = this.searchResults!.some((rxl) => rxl.name.includes(name));
  assert.ok(found, `Results should contain "${name}"`);
});

// ============================================
// Read-only operation steps (URL registry specific)
// ============================================

When("I try to link a resource using the URL registry", async function (this: GitHubWorld) {
  try {
    await this.registry!.link("/some/path");
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When("I try to add a resource using the URL registry", async function (this: GitHubWorld) {
  const { createRXM, createRXA, parseRXL } = await import("resourcexjs");
  const manifest = createRXM({
    domain: "test.com",
    name: "test",
    type: "text",
    version: "1.0.0",
  });
  const rxr: RXR = {
    locator: parseRXL("test.com/test.text@1.0.0"),
    manifest,
    archive: await createRXA({ content: "test" }),
  };

  try {
    await this.registry!.add(rxr);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When(
  "I try to delete {string} using the URL registry",
  async function (this: GitHubWorld, locator: string) {
    try {
      await this.registry!.delete(locator);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

Then(
  "the operation should fail with {string}",
  function (this: GitHubWorld, expectedMessage: string) {
    assert.ok(this.error, "Should throw an error");
    assert.ok(
      this.error!.message.toLowerCase().includes(expectedMessage.toLowerCase()),
      `Error should contain "${expectedMessage}", got: ${this.error!.message}`
    );
  }
);

// ============================================
// Discovery steps
// ============================================

// Note: "I discover registry for {string}" is defined in git.steps.ts

Then(
  "the first registry URL should start with {string}",
  function (this: GitHubWorld, prefix: string) {
    assert.ok(this.discoveryResult, "Should have discovery result");
    assert.ok(this.discoveryResult!.registries.length > 0, "Should have at least one registry");
    const url = this.discoveryResult!.registries[0];
    assert.ok(url.startsWith(prefix), `First registry should start with ${prefix}, got: ${url}`);
  }
);

When(
  "I create registry from discovery for {string}",
  { timeout: 60000 },
  async function (this: GitHubWorld, domain: string) {
    const { discoverRegistry, createRegistry } = await import("resourcexjs");
    try {
      const discovery = await discoverRegistry(domain);
      this.discoveryResult = discovery;
      const registryUrl = discovery.registries[0];

      // Use URL-based auto-detection
      this.registry = createRegistry({
        url: registryUrl,
        domain: discovery.domain,
      });
      this.error = null;
    } catch (e) {
      this.error = e as Error;
      this.registry = null;
    }
  }
);

Then("the registry should be created", function (this: GitHubWorld) {
  assert.ok(!this.error, `Should not throw error: ${this.error?.message}`);
  assert.ok(this.registry, "Registry should be created");
});

Then(
  "I can resolve {string} from the registry",
  { timeout: 60000 },
  async function (this: GitHubWorld, locator: string) {
    assert.ok(this.registry, "Registry should exist");
    try {
      this.resolvedResource = await this.registry!.resolve(locator);
      assert.ok(this.resolvedResource, "Should resolve resource");
    } catch (e) {
      assert.fail(`Failed to resolve ${locator}: ${(e as Error).message}`);
    }
  }
);
