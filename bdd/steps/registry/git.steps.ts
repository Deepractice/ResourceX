import { Given, When, Then, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { execSync } from "node:child_process";
import type { Registry, RXR, RXL, ResolvedResource } from "resourcexjs";

const TEST_GIT_REPO = join(process.cwd(), ".test-git-repo");
const GIT_CACHE_DIR = join(process.cwd(), ".test-git-cache");

interface DiscoveryResult {
  domain: string;
  registries: string[];
}

interface GitRegistryWorld {
  gitRegistry: Registry | null;
  rxr: RXR | null;
  resolvedResource: ResolvedResource | null;
  existsResult: boolean | null;
  searchResults: RXL[] | null;
  error: Error | null;
  discoveryResult: DiscoveryResult | null;
}

// Helper to create resource in git repo
async function createResourceInGitRepo(repoPath: string, locator: string, content: string) {
  const { parseRXL, createRXM, createRXC, TypeHandlerChain } = await import("resourcexjs");

  const rxl = parseRXL(locator);
  const domain = rxl.domain ?? "localhost";
  const resourceName = rxl.type ? `${rxl.name}.${rxl.type}` : rxl.name;
  const version = rxl.version ?? "latest";

  let resourcePath = join(repoPath, ".resourcex", domain);
  if (rxl.path) {
    resourcePath = join(resourcePath, rxl.path);
  }
  resourcePath = join(resourcePath, resourceName, version);

  await mkdir(resourcePath, { recursive: true });

  // Write manifest
  const manifest = createRXM({
    domain,
    path: rxl.path,
    name: rxl.name,
    type: rxl.type ?? "text",
    version,
  });
  await writeFile(join(resourcePath, "manifest.json"), JSON.stringify(manifest.toJSON(), null, 2));

  // Write content
  const rxc = await createRXC({ content });
  const typeHandler = TypeHandlerChain.create();
  const rxr: RXR = {
    locator: rxl,
    manifest,
    content: rxc,
  };
  const serialized = await typeHandler.serialize(rxr);
  await writeFile(join(resourcePath, "content.tar.gz"), serialized);

  // Git commit
  execSync(`git -C ${repoPath} add -A`, { stdio: "pipe" });
  execSync(`git -C ${repoPath} commit -m "Add ${locator}" --allow-empty`, {
    stdio: "pipe",
  });
}

After({ tags: "@git" }, async function () {
  // Clean up test directories
  try {
    await rm(TEST_GIT_REPO, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
  try {
    await rm(GIT_CACHE_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

Given(
  "a local git registry at {string}",
  async function (this: GitRegistryWorld, _repoPath: string) {
    // Initialize a local git repo
    await rm(TEST_GIT_REPO, { recursive: true, force: true }).catch(() => {});
    await mkdir(TEST_GIT_REPO, { recursive: true });

    execSync(`git -C ${TEST_GIT_REPO} init`, { stdio: "pipe" });
    execSync(`git -C ${TEST_GIT_REPO} config user.email "test@test.com"`, {
      stdio: "pipe",
    });
    execSync(`git -C ${TEST_GIT_REPO} config user.name "Test"`, { stdio: "pipe" });

    // Create initial commit
    await mkdir(join(TEST_GIT_REPO, ".resourcex"), { recursive: true });
    await writeFile(join(TEST_GIT_REPO, ".resourcex", ".gitkeep"), "");
    execSync(`git -C ${TEST_GIT_REPO} add -A`, { stdio: "pipe" });
    execSync(`git -C ${TEST_GIT_REPO} commit -m "Initial commit"`, { stdio: "pipe" });

    // Create GitRegistry pointing to local repo
    const { createRegistry } = await import("resourcexjs");

    // Override the git cache dir for testing
    this.gitRegistry = createRegistry({
      type: "git",
      url: TEST_GIT_REPO,
    });

    this.error = null;
  }
);

Given(
  "the git repo has resource {string} with content {string}",
  async function (this: GitRegistryWorld, locator: string, content: string) {
    await createResourceInGitRepo(TEST_GIT_REPO, locator, content);
  }
);

When("I get {string} from git registry", async function (this: GitRegistryWorld, locator: string) {
  try {
    this.rxr = await this.gitRegistry!.get(locator);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
    this.rxr = null;
  }
});

When(
  "I resolve {string} from git registry",
  async function (this: GitRegistryWorld, locator: string) {
    try {
      this.resolvedResource = await this.gitRegistry!.resolve(locator);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
      this.resolvedResource = null;
    }
  }
);

When(
  "I check if {string} exists in git registry",
  async function (this: GitRegistryWorld, locator: string) {
    this.existsResult = await this.gitRegistry!.exists(locator);
  }
);

When("I search in git registry without options", async function (this: GitRegistryWorld) {
  try {
    this.searchResults = await this.gitRegistry!.search();
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When(
  "I search in git registry with query {string}",
  async function (this: GitRegistryWorld, query: string) {
    try {
      this.searchResults = await this.gitRegistry!.search({ query });
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When("I try to link a resource to git registry", async function (this: GitRegistryWorld) {
  const { createRXM, createRXC, parseRXL } = await import("resourcexjs");
  const manifest = createRXM({
    domain: "test.com",
    name: "test",
    type: "text",
    version: "1.0.0",
  });
  const rxr: RXR = {
    locator: parseRXL("test.com/test.text@1.0.0"),
    manifest,
    content: await createRXC({ content: "test" }),
  };

  try {
    await this.gitRegistry!.add(rxr);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When(
  "I try to delete {string} from git registry",
  async function (this: GitRegistryWorld, locator: string) {
    try {
      await this.gitRegistry!.delete(locator);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

Then("I should receive a git RXR object", async function (this: GitRegistryWorld) {
  assert.ok(!this.error, `Should not throw error: ${this.error?.message}`);
  assert.ok(this.rxr, "Should receive an RXR");
  assert.ok(this.rxr?.locator, "RXR should have locator");
  assert.ok(this.rxr?.manifest, "RXR should have manifest");
  assert.ok(this.rxr?.content, "RXR should have content");
});

Then(
  "the git manifest name should be {string}",
  async function (this: GitRegistryWorld, name: string) {
    assert.equal(this.rxr?.manifest.name, name);
  }
);

Then(
  "the git manifest type should be {string}",
  async function (this: GitRegistryWorld, type: string) {
    assert.equal(this.rxr?.manifest.type, type);
  }
);

Then(
  "the git manifest domain should be {string}",
  async function (this: GitRegistryWorld, domain: string) {
    assert.equal(this.rxr?.manifest.domain, domain);
  }
);

// Domain validation steps
Given(
  "a git registry with trusted domain {string}",
  async function (this: GitRegistryWorld, trustedDomain: string) {
    // Initialize a local git repo
    await rm(TEST_GIT_REPO, { recursive: true, force: true }).catch(() => {});
    await mkdir(TEST_GIT_REPO, { recursive: true });

    execSync(`git -C ${TEST_GIT_REPO} init`, { stdio: "pipe" });
    execSync(`git -C ${TEST_GIT_REPO} config user.email "test@test.com"`, {
      stdio: "pipe",
    });
    execSync(`git -C ${TEST_GIT_REPO} config user.name "Test"`, { stdio: "pipe" });

    // Create initial commit
    await mkdir(join(TEST_GIT_REPO, ".resourcex"), { recursive: true });
    await writeFile(join(TEST_GIT_REPO, ".resourcex", ".gitkeep"), "");
    execSync(`git -C ${TEST_GIT_REPO} add -A`, { stdio: "pipe" });
    execSync(`git -C ${TEST_GIT_REPO} commit -m "Initial commit"`, { stdio: "pipe" });

    // Create GitRegistry with trusted domain
    const { createRegistry } = await import("resourcexjs");

    this.gitRegistry = createRegistry({
      type: "git",
      url: TEST_GIT_REPO,
      domain: trustedDomain,
    });

    this.error = null;
  }
);

// Discovery steps
When(
  "I discover registry for {string}",
  { timeout: 30000 }, // 30s for network
  async function (this: GitRegistryWorld, domain: string) {
    const { discoverRegistry } = await import("resourcexjs");
    try {
      this.discoveryResult = await discoverRegistry(domain);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
      this.discoveryResult = null;
    }
  }
);

Then(
  "discovery should return domain {string}",
  function (this: GitRegistryWorld, expectedDomain: string) {
    assert.ok(!this.error, `Should not throw error: ${this.error?.message}`);
    assert.ok(this.discoveryResult, "Should have discovery result");
    assert.equal(this.discoveryResult?.domain, expectedDomain);
  }
);

Then(
  "discovery should return registry URL containing {string}",
  function (this: GitRegistryWorld, urlPart: string) {
    assert.ok(this.discoveryResult, "Should have discovery result");
    assert.ok(this.discoveryResult?.registries.length > 0, "Should have at least one registry");
    const hasMatch = this.discoveryResult?.registries.some((r) => r.includes(urlPart));
    assert.ok(hasMatch, `Registry URL should contain "${urlPart}"`);
  }
);

// End-to-end discovery + domain validation
Given(
  "I discover and create registry for {string}",
  { timeout: 60000 }, // 60s for git clone
  async function (this: GitRegistryWorld, domain: string) {
    const { discoverRegistry, createRegistry } = await import("resourcexjs");
    try {
      const discovery = await discoverRegistry(domain);
      const registryUrl = discovery.registries[0];

      // Create GitRegistry with domain binding (same as RxrTransport does)
      this.gitRegistry = createRegistry({
        type: "git",
        url: registryUrl,
        domain: discovery.domain, // This binds the trusted domain
      });

      this.discoveryResult = discovery;
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When(
  "I get {string} from discovered registry",
  { timeout: 60000 }, // 60s for git operations
  async function (this: GitRegistryWorld, locator: string) {
    try {
      this.rxr = await this.gitRegistry!.get(locator);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
      this.rxr = null;
    }
  }
);

// Security: Remote URL requires domain
When(
  "I create a git registry with remote URL {string} without domain",
  async function (this: GitRegistryWorld, url: string) {
    const { createRegistry } = await import("resourcexjs");
    try {
      this.gitRegistry = createRegistry({
        type: "git",
        url,
        // No domain - should throw for remote URL
      });
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When(
  "I create a git registry with remote URL {string} and domain {string}",
  async function (this: GitRegistryWorld, url: string, domain: string) {
    const { createRegistry } = await import("resourcexjs");
    try {
      this.gitRegistry = createRegistry({
        type: "git",
        url,
        domain,
      });
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When(
  "I create a git registry with local path {string} without domain",
  async function (this: GitRegistryWorld, path: string) {
    const { createRegistry } = await import("resourcexjs");
    try {
      this.gitRegistry = createRegistry({
        type: "git",
        url: path,
        // No domain - should be allowed for local path
      });
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

Given(
  "I create a git registry for local path {string} with domain {string}",
  async function (this: GitRegistryWorld, _path: string, domain: string) {
    const { createRegistry } = await import("resourcexjs");
    // Always use TEST_GIT_REPO (ignore the path parameter, it's just for readability)
    try {
      this.gitRegistry = createRegistry({
        type: "git",
        url: TEST_GIT_REPO,
        domain,
      });
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

// Note: "it should not throw an error" is defined in registry.steps.ts
