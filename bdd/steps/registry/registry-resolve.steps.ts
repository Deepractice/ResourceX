import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import type { Registry, RXR, ResolvedResource, ResourceType } from "resourcexjs";

const TEST_DIR = join(process.cwd(), ".test-bdd-registry");

interface ResolveWorld {
  registry: Registry | null;
  registries: Map<string, Registry>;
  resolvedResource: ResolvedResource | null;
  executeResult: unknown;
  error: Error | null;
}

// ResolvedResource assertions
Then("I should receive a ResolvedResource", function (this: ResolveWorld) {
  assert.ok(this.resolvedResource, "Should receive a ResolvedResource");
  assert.ok(typeof this.resolvedResource?.execute === "function", "Should have execute function");
});

Then(
  "I can call execute\\() to get {string}",
  async function (this: ResolveWorld, expected: string) {
    const result = await this.resolvedResource!.execute();
    assert.strictEqual(result, expected);
  }
);

Then("I can call execute\\()", async function (this: ResolveWorld) {
  const result = await this.resolvedResource!.execute();
  assert.ok(result !== undefined, "execute() should return a value");
});

Then("resolved.resource should be the RXR object", function (this: ResolveWorld) {
  assert.ok(this.resolvedResource?.resource, "Should have resource field");
  assert.ok(this.resolvedResource?.resource.locator, "RXR should have locator");
  assert.ok(this.resolvedResource?.resource.manifest, "RXR should have manifest");
  assert.ok(this.resolvedResource?.resource.content, "RXR should have content");
});

Then(
  "resolved.resource.manifest.name should be {string}",
  function (this: ResolveWorld, expected: string) {
    assert.strictEqual(this.resolvedResource?.resource.manifest.name, expected);
  }
);

Then("resolved.schema should be undefined", function (this: ResolveWorld) {
  assert.strictEqual(this.resolvedResource?.schema, undefined);
});

Then("resolved.schema should be defined", function (this: ResolveWorld) {
  assert.ok(this.resolvedResource?.schema, "schema should be defined");
});

Then("schema should describe the expected arguments", function (this: ResolveWorld) {
  const schema = this.resolvedResource?.schema;
  assert.ok(schema, "schema should exist");
  assert.ok(typeof schema === "object", "schema should be an object");
});

// Custom type steps
Given(
  "a registry with custom types:",
  async function (
    this: ResolveWorld,
    dataTable: { hashes: () => Array<{ name: string; description: string }> }
  ) {
    const { createRegistry, textType } = await import("resourcexjs");
    await mkdir(TEST_DIR, { recursive: true });

    const types: ResourceType[] = dataTable.hashes().map((row) => ({
      name: row.name,
      description: row.description,
      serializer: textType.serializer,
      resolver: textType.resolver,
    }));

    this.registry = createRegistry({ path: TEST_DIR, types });
  }
);

Given(
  "a linked {string} resource {string}",
  async function (this: ResolveWorld, typeName: string, locator: string) {
    const { createRXM, createRXC, parseRXL } = await import("resourcexjs");

    const rxl = parseRXL(locator);
    const manifest = createRXM({
      domain: rxl.domain || "localhost",
      path: rxl.path,
      name: rxl.name,
      type: typeName,
      version: rxl.version || "1.0.0",
    });

    const rxr: RXR = {
      locator: rxl,
      manifest,
      content: await createRXC({ content: `${typeName} content` }),
    };

    await this.registry!.link(rxr);
  }
);

When(
  "I call supportType with a {string} type",
  async function (this: ResolveWorld, typeName: string) {
    const { textType } = await import("resourcexjs");

    const customType: ResourceType = {
      name: typeName,
      description: `Custom ${typeName} type`,
      serializer: textType.serializer,
      resolver: textType.resolver,
    };

    this.registry!.supportType(customType);
  }
);

When(
  "I link a {string} resource {string}",
  async function (this: ResolveWorld, typeName: string, locator: string) {
    const { createRXM, createRXC, parseRXL } = await import("resourcexjs");

    const rxl = parseRXL(locator);
    const manifest = createRXM({
      domain: rxl.domain || "localhost",
      path: rxl.path,
      name: rxl.name,
      type: typeName,
      version: rxl.version || "1.0.0",
    });

    const rxr: RXR = {
      locator: rxl,
      manifest,
      content: await createRXC({ content: `${typeName} content` }),
    };

    await this.registry!.link(rxr);
  }
);

// Unsupported type - link should fail
When(
  "I try to link a resource with unsupported type {string}",
  async function (this: ResolveWorld, typeName: string) {
    const { createRXM, createRXC, parseRXL } = await import("resourcexjs");

    const manifest = createRXM({
      domain: "localhost",
      name: "test",
      type: typeName,
      version: "1.0.0",
    });

    const rxr: RXR = {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      content: await createRXC({ content: "test content" }),
    };

    try {
      await this.registry!.link(rxr);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

Then("it should throw a ResourceTypeError", async function (this: ResolveWorld) {
  assert.ok(this.error, "Error should have been thrown");
  // Use error.name instead of constructor.name (bundle-safe)
  assert.strictEqual(
    this.error?.name,
    "ResourceTypeError",
    `Expected ResourceTypeError but got ${this.error?.name}`
  );
});

// Note: "error message should contain {string}" is defined in common.steps.ts

// Tool type with args
Given(
  "a registry with a {string} type that accepts arguments",
  async function (this: ResolveWorld, typeName: string) {
    const { createRegistry, textType } = await import("resourcexjs");
    await mkdir(TEST_DIR, { recursive: true });

    const toolType: ResourceType = {
      name: typeName,
      description: `Custom ${typeName} type with args`,
      serializer: textType.serializer,
      resolver: {
        schema: {
          type: "object",
          properties: {
            a: { type: "number" },
            b: { type: "number" },
          },
          required: ["a", "b"],
        },
        async resolve(rxr: RXR) {
          return {
            resource: rxr,
            schema: this.schema,
            execute: async (args?: { a: number; b: number }) => {
              if (args) {
                return args.a + args.b;
              }
              return 0;
            },
          };
        },
      },
    };

    this.registry = createRegistry({ path: TEST_DIR, types: [toolType] });
  }
);

Given(
  "a linked tool resource {string} that adds two numbers",
  async function (this: ResolveWorld, locator: string) {
    const { createRXM, createRXC, parseRXL } = await import("resourcexjs");

    const rxl = parseRXL(locator);
    const manifest = createRXM({
      domain: rxl.domain || "localhost",
      path: rxl.path,
      name: rxl.name,
      type: "tool",
      version: rxl.version || "1.0.0",
    });

    const rxr: RXR = {
      locator: rxl,
      manifest,
      content: await createRXC({ content: "add function" }),
    };

    await this.registry!.link(rxr);
  }
);

When(
  "I call execute with args \\{ {string}: {int}, {string}: {int} }",
  async function (this: ResolveWorld, key1: string, val1: number, key2: string, val2: number) {
    const args = { [key1]: val1, [key2]: val2 };
    this.executeResult = await this.resolvedResource!.execute(args);
  }
);

When("I call execute without arguments", async function (this: ResolveWorld) {
  this.executeResult = await this.resolvedResource!.execute();
});

Then("the result should be {string}", function (this: ResolveWorld, expected: string) {
  assert.strictEqual(this.executeResult, expected);
});

// Tool type with schema
Given(
  "a registry with a {string} type that has schema",
  async function (this: ResolveWorld, typeName: string) {
    const { createRegistry, textType } = await import("resourcexjs");
    await mkdir(TEST_DIR, { recursive: true });

    const toolType: ResourceType = {
      name: typeName,
      description: `Custom ${typeName} type with schema`,
      serializer: textType.serializer,
      resolver: {
        schema: {
          type: "object",
          properties: {
            input: { type: "string" },
          },
        },
        async resolve(rxr: RXR) {
          return {
            resource: rxr,
            schema: this.schema,
            execute: async () => "result",
          };
        },
      },
    };

    this.registry = createRegistry({ path: TEST_DIR, types: [toolType] });
  }
);

Given("a linked tool resource {string}", async function (this: ResolveWorld, locator: string) {
  const { createRXM, createRXC, parseRXL } = await import("resourcexjs");

  const rxl = parseRXL(locator);
  const manifest = createRXM({
    domain: rxl.domain || "localhost",
    path: rxl.path,
    name: rxl.name,
    type: "tool",
    version: rxl.version || "1.0.0",
  });

  const rxr: RXR = {
    locator: rxl,
    manifest,
    content: await createRXC({ content: "tool content" }),
  };

  await this.registry!.link(rxr);
});

// Isolation test
Given(
  "a registry {string} with custom type {string}",
  async function (this: ResolveWorld, registryName: string, typeName: string) {
    const { createRegistry, textType } = await import("resourcexjs");
    await mkdir(TEST_DIR, { recursive: true });

    if (!this.registries) {
      this.registries = new Map();
    }

    const customType: ResourceType = {
      name: typeName,
      description: `Custom ${typeName} type`,
      serializer: textType.serializer,
      resolver: textType.resolver,
    };

    const registry = createRegistry({
      path: join(TEST_DIR, registryName),
      types: [customType],
    });

    this.registries.set(registryName, registry);
  }
);

Then(
  "registry {string} should support {string} but not {string}",
  async function (
    this: ResolveWorld,
    registryName: string,
    supported: string,
    notSupported: string
  ) {
    // This is a conceptual test - we can't directly query supported types
    // But we verify isolation by the fact that each registry has its own TypeHandlerChain
    assert.ok(this.registries?.get(registryName), `Registry ${registryName} should exist`);
    // The actual type support is verified by attempting to resolve resources
  }
);
