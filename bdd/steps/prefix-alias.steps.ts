/**
 * Prefix alias step definitions
 */
import { Given, Before, After } from "@cucumber/cucumber";
import { rm } from "node:fs/promises";
import { join } from "node:path";

interface AliasWorld {
  alias?: string;
  resources?: import("resourcexjs").ResourceDefinition[];
  rx: import("resourcexjs").ResourceX | null;
  result: { type: string; content: unknown; meta?: Record<string, unknown> } | null;
  error: Error | null;
  content: unknown;
}

Before({ tags: "@prefix-alias" }, async function (this: AliasWorld) {
  this.alias = undefined;
  this.resources = [];
  this.rx = null;
  this.result = null;
  this.error = null;
  this.content = null;
});

After({ tags: "@prefix-alias" }, async function () {
  // Clean up test files
  try {
    await rm(join(process.cwd(), "bdd/test-data"), { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

Given("ResourceX with alias {string}", async function (this: AliasWorld, alias: string) {
  const { createResourceX } = await import("resourcexjs");
  this.alias = alias;
  this.rx = createResourceX({ alias, resources: this.resources });
});

Given("ResourceX with default config", async function (this: AliasWorld) {
  const { createResourceX } = await import("resourcexjs");
  this.rx = createResourceX();
});

Given(
  "ResourceX has resource {string} with semantic {string}, transport {string}, basePath {string}",
  async function (
    this: AliasWorld,
    name: string,
    semantic: string,
    transport: string,
    basePath: string
  ) {
    const adjustedBasePath = basePath.startsWith("./")
      ? join(process.cwd(), "bdd", basePath.slice(2))
      : basePath;

    this.resources = this.resources || [];
    this.resources.push({
      name,
      semantic,
      transport,
      basePath: adjustedBasePath,
    });

    // Recreate rx with accumulated config
    const { createResourceX } = await import("resourcexjs");
    this.rx = createResourceX({ alias: this.alias, resources: this.resources });
  }
);

Given(
  "ResourceX has resource {string} with semantic {string}, transport {string}",
  async function (this: AliasWorld, name: string, semantic: string, transport: string) {
    this.resources = this.resources || [];
    this.resources.push({
      name,
      semantic,
      transport,
    });

    // Recreate rx with accumulated config
    const { createResourceX } = await import("resourcexjs");
    this.rx = createResourceX({ alias: this.alias, resources: this.resources });
  }
);
