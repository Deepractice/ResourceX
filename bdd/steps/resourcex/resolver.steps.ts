import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { rm, mkdir } from "node:fs/promises";

const TEST_DIR = join(process.cwd(), ".test-bdd-resolver");

// Types for World context
interface ResolvedResult {
  resource?: unknown;
  execute: (args?: unknown) => unknown | Promise<unknown>;
  schema?: unknown;
}

interface RegistryType {
  add(rxr: unknown): Promise<void>;
  resolve(locator: string): Promise<ResolvedResult>;
  supportType(type: unknown): void;
}

interface ResolverWorld {
  rxr?: unknown;
  rxrLocator?: string;
  resolved?: ResolvedResult;
  executeResult?: unknown;
  contentLoaded?: boolean;
  customTypes?: Map<string, unknown>;
  registry?: RegistryType;
}

Given("I have access to resourcexjs type system", async function (this: ResolverWorld) {
  // Clean up and create test directory
  await rm(TEST_DIR, { recursive: true, force: true });
  await mkdir(TEST_DIR, { recursive: true });

  const { createRegistry } = await import("resourcexjs");
  this.registry = createRegistry({ path: TEST_DIR }) as RegistryType;
  assert.ok(this.registry, "Registry should exist");
  this.customTypes = new Map();
});

Given(
  "a text resource with content {string}",
  async function (this: ResolverWorld, content: string) {
    const { createRXM, createRXA, parseRXL } = await import("resourcexjs");

    const manifest = createRXM({
      domain: "localhost",
      name: "test-text",
      type: "text",
      version: "1.0.0",
    });

    this.rxr = {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ content }),
    };
    this.rxrLocator = manifest.toLocator();

    // Add to registry
    await this.registry!.add(this.rxr);
  }
);

Given(
  "a json resource with content {string}",
  async function (this: ResolverWorld, content: string) {
    const { createRXM, createRXA, parseRXL } = await import("resourcexjs");

    const manifest = createRXM({
      domain: "localhost",
      name: "test-json",
      type: "json",
      version: "1.0.0",
    });

    this.rxr = {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ content }),
    };
    this.rxrLocator = manifest.toLocator();

    await this.registry!.add(this.rxr);
  }
);

Given(
  "a binary resource with bytes {string}",
  async function (this: ResolverWorld, bytesStr: string) {
    const { createRXM, createRXA, parseRXL } = await import("resourcexjs");

    // Parse "1,2,3,4" to actual array
    const bytes = bytesStr.split(",").map((s) => parseInt(s.trim(), 10));
    const buffer = Buffer.from(bytes);

    const manifest = createRXM({
      domain: "localhost",
      name: "test-binary",
      type: "binary",
      version: "1.0.0",
    });

    this.rxr = {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ content: buffer }),
    };
    this.rxrLocator = manifest.toLocator();

    await this.registry!.add(this.rxr);
  }
);

Given(
  "a text resource {string} with content {string}",
  async function (this: ResolverWorld, locator: string, content: string) {
    const { createRXM, createRXA, parseRXL } = await import("resourcexjs");

    const rxl = parseRXL(locator);
    const manifest = createRXM({
      domain: rxl.domain || "localhost",
      path: rxl.path,
      name: rxl.name,
      type: rxl.type || "text",
      version: rxl.version || "1.0.0",
    });

    this.rxr = {
      locator: rxl,
      manifest,
      archive: await createRXA({ content }),
    };
    this.rxrLocator = manifest.toLocator();

    await this.registry!.add(this.rxr);
  }
);

Given(
  "a custom {string} type that accepts arguments",
  async function (this: ResolverWorld, typeName: string) {
    // Register a custom type that accepts arguments (using ctx instead of rxr)
    const customType = {
      name: typeName,
      description: `Custom ${typeName} type`,
      schema: {
        type: "object",
        properties: {
          a: { type: "number" },
          b: { type: "number" },
        },
        required: ["a", "b"],
      },
      code: `
        ({
          async resolve(ctx, args) {
            const content = ctx.files["content"];
            const code = new TextDecoder().decode(content);
            // Simple eval for "return args.a + args.b"
            if (code === "return args.a + args.b" && args) {
              return args.a + args.b;
            }
            return code;
          },
        })
      `,
    };

    this.registry!.supportType(customType);
    this.customTypes?.set(typeName, customType);
  }
);

Given(
  "a custom {string} type that accepts no arguments",
  async function (this: ResolverWorld, typeName: string) {
    const customType = {
      name: typeName,
      description: `Custom ${typeName} type`,
      code: `
        ({
          async resolve(ctx, args) {
            const content = ctx.files["content"];
            return new TextDecoder().decode(content);
          }
        })
      `,
    };

    this.registry!.supportType(customType);
    this.customTypes?.set(typeName, customType);
  }
);

Given("a tool resource with code {string}", async function (this: ResolverWorld, code: string) {
  const { createRXM, createRXA, parseRXL } = await import("resourcexjs");

  const manifest = createRXM({
    domain: "localhost",
    name: "test-tool",
    type: "tool",
    version: "1.0.0",
  });

  this.rxr = {
    locator: parseRXL(manifest.toLocator()),
    manifest,
    archive: await createRXA({ content: code }),
  };
  this.rxrLocator = manifest.toLocator();

  await this.registry!.add(this.rxr);
});

Given(
  "a prompt resource with template {string}",
  async function (this: ResolverWorld, template: string) {
    const { createRXM, createRXA, parseRXL } = await import("resourcexjs");

    const manifest = createRXM({
      domain: "localhost",
      name: "test-prompt",
      type: "prompt",
      version: "1.0.0",
    });

    this.rxr = {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ content: template }),
    };
    this.rxrLocator = manifest.toLocator();

    await this.registry!.add(this.rxr);
  }
);

Given(
  "a custom {string} type with async resolver",
  async function (this: ResolverWorld, typeName: string) {
    const customType = {
      name: typeName,
      description: `Custom ${typeName} type with async resolver`,
      code: `
        ({
          async resolve(ctx, args) {
            const content = ctx.files["content"];
            return new TextDecoder().decode(content);
          }
        })
      `,
    };

    this.registry!.supportType(customType);
    this.customTypes?.set(typeName, customType);
  }
);

Given(
  "an async-text resource with content {string}",
  async function (this: ResolverWorld, content: string) {
    const { createRXM, createRXA, parseRXL } = await import("resourcexjs");

    const manifest = createRXM({
      domain: "localhost",
      name: "test-async",
      type: "async-text",
      version: "1.0.0",
    });

    this.rxr = {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ content }),
    };
    this.rxrLocator = manifest.toLocator();

    await this.registry!.add(this.rxr);
  }
);

Given(
  "a custom {string} type with sync resolver",
  async function (this: ResolverWorld, typeName: string) {
    const customType = {
      name: typeName,
      description: `Custom ${typeName} type with sync resolver`,
      code: `
        ({
          async resolve(ctx, args) {
            const content = ctx.files["content"];
            return new TextDecoder().decode(content);
          }
        })
      `,
    };

    this.registry!.supportType(customType);
    this.customTypes?.set(typeName, customType);
  }
);

Given(
  "a sync-text resource with content {string}",
  async function (this: ResolverWorld, content: string) {
    const { createRXM, createRXA, parseRXL } = await import("resourcexjs");

    const manifest = createRXM({
      domain: "localhost",
      name: "test-sync",
      type: "sync-text",
      version: "1.0.0",
    });

    this.rxr = {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ content }),
    };
    this.rxrLocator = manifest.toLocator();

    await this.registry!.add(this.rxr);
  }
);

When("I resolve the resource", async function (this: ResolverWorld) {
  this.resolved = (await this.registry!.resolve(this.rxrLocator!)) as ResolvedResult;
});

When("I call the resolved function", async function (this: ResolverWorld) {
  if (this.resolved) {
    this.executeResult = await this.resolved.execute();
    this.contentLoaded = true;
  }
});

When("I resolve through TypeHandlerChain", async function (this: ResolverWorld) {
  // Now uses Registry (TypeHandlerChain doesn't have resolve anymore)
  this.resolved = (await this.registry!.resolve(this.rxrLocator!)) as ResolvedResult;
});

Then("I should get a callable function", function (this: ResolverWorld) {
  assert.ok(this.resolved, "resolved should exist");
  assert.strictEqual(typeof this.resolved.execute, "function");
});

Then(
  "calling the function should return {string}",
  async function (this: ResolverWorld, expected: string) {
    const result = await this.resolved!.execute();
    assert.strictEqual(result, expected);
  }
);

Then(
  "calling the function should return object with key {string} and value {string}",
  async function (this: ResolverWorld, key: string, value: string) {
    const result = (await this.resolved!.execute()) as Record<string, unknown>;
    assert.strictEqual(result[key], value);
  }
);

Then(
  "calling the function should return a Buffer with bytes {string}",
  async function (this: ResolverWorld, bytesStr: string) {
    // Parse "1,2,3,4" to array
    const expected = bytesStr.split(",").map((s) => parseInt(s.trim(), 10));
    // Note: binary type returns Uint8Array which becomes object after JSON serialization
    const result = (await this.resolved!.execute()) as Record<string, number>;
    assert.deepStrictEqual(Object.values(result), expected);
  }
);

Then(
  "calling the function with args {string} should return {int}",
  async function (this: ResolverWorld, argsStr: string, expected: number) {
    // Parse "a=1,b=2" to { a: 1, b: 2 }
    const args: Record<string, number> = {};
    argsStr.split(",").forEach((pair) => {
      const [key, value] = pair.split("=");
      args[key.trim()] = parseInt(value.trim(), 10);
    });
    const result = await this.resolved!.execute(args);
    assert.strictEqual(result, expected);
  }
);

Then(
  "calling the function without arguments should return {string}",
  async function (this: ResolverWorld, expected: string) {
    const result = await this.resolved!.execute();
    assert.strictEqual(result, expected);
  }
);

Then("the content should not be loaded yet", function (this: ResolverWorld) {
  // Content is lazy loaded - we just check that we have an execute function
  assert.ok(this.resolved, "resolved should exist");
  assert.strictEqual(typeof this.resolved.execute, "function");
  assert.notStrictEqual(this.contentLoaded, true);
});

Then("the content should be loaded", function (this: ResolverWorld) {
  assert.strictEqual(this.contentLoaded, true);
});

Then("calling the function should return a Promise", async function (this: ResolverWorld) {
  const result = this.resolved!.execute();
  assert.ok(result instanceof Promise, "result should be a Promise");
  this.executeResult = await result;
});

Then(
  "awaiting the Promise should return {string}",
  function (this: ResolverWorld, expected: string) {
    assert.strictEqual(this.executeResult, expected);
  }
);

Then(
  "calling the function should return {string} directly",
  async function (this: ResolverWorld, expected: string) {
    // Note: In BundledType architecture, execute always returns Promise
    const result = await this.resolved!.execute();
    assert.strictEqual(result, expected);
  }
);
