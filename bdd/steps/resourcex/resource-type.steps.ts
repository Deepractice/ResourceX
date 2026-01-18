import { Given, When, Then, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import type { ResourceType, ResourceSerializer, ResourceResolver, RXR, RXM } from "resourcexjs";

interface ResourceTypeWorld {
  typeDefinition: Partial<ResourceType> | null;
  registeredType: ResourceType | null;
  retrievedType: ResourceType | undefined;
  error: Error | null;
  serializerCalled: boolean;
  deserializerCalled: boolean;
  resolverCalled: boolean;
  resolvedValue: unknown;
}

// Mock serializer that tracks calls
function createMockSerializer(world: ResourceTypeWorld): ResourceSerializer {
  return {
    serialize: async (_rxr: RXR) => {
      world.serializerCalled = true;
      return Buffer.from("serialized");
    },
    deserialize: async (_data: Buffer, _manifest: RXM) => {
      world.deserializerCalled = true;
      return {} as RXR;
    },
  };
}

// Mock resolver that tracks calls
function createMockResolver(world: ResourceTypeWorld): ResourceResolver<string> {
  return {
    resolve: async (rxr: RXR) => {
      world.resolverCalled = true;
      return `resolved: ${rxr.manifest.name}`;
    },
  };
}

After({ tags: "@resource-type" }, async function () {
  // Clear resource types after each scenario
  const { clearResourceTypes } = await import("resourcexjs");
  clearResourceTypes();
});

Given(
  "a resource type definition:",
  async function (
    this: ResourceTypeWorld,
    dataTable: { hashes: () => Array<{ name: string; description: string }> }
  ) {
    const rows = dataTable.hashes();
    const row = rows[0];

    this.serializerCalled = false;
    this.deserializerCalled = false;
    this.resolverCalled = false;

    this.typeDefinition = {
      name: row.name,
      description: row.description,
      serializer: createMockSerializer(this),
      resolver: createMockResolver(this),
    };
  }
);

Given(
  "a resource type {string} with custom serializer",
  async function (this: ResourceTypeWorld, name: string) {
    this.serializerCalled = false;
    this.deserializerCalled = false;
    this.resolverCalled = false;

    this.typeDefinition = {
      name,
      description: `${name} type`,
      serializer: createMockSerializer(this),
      resolver: createMockResolver(this),
    };
  }
);

Given(
  "a resource type {string} with custom resolver",
  async function (this: ResourceTypeWorld, name: string) {
    this.serializerCalled = false;
    this.deserializerCalled = false;
    this.resolverCalled = false;

    this.typeDefinition = {
      name,
      description: `${name} type`,
      serializer: createMockSerializer(this),
      resolver: createMockResolver(this),
    };
  }
);

Given(
  "a resource type {string} is already registered",
  async function (this: ResourceTypeWorld, name: string) {
    const { defineResourceType } = await import("resourcexjs");

    this.serializerCalled = false;
    this.deserializerCalled = false;
    this.resolverCalled = false;

    defineResourceType({
      name,
      description: "Already registered",
      serializer: createMockSerializer(this),
      resolver: createMockResolver(this),
    });

    this.typeDefinition = {
      name,
      description: "Duplicate",
      serializer: createMockSerializer(this),
      resolver: createMockResolver(this),
    };
  }
);

Given(
  "resource types are registered:",
  async function (
    this: ResourceTypeWorld,
    dataTable: { hashes: () => Array<{ name: string; description: string }> }
  ) {
    const { defineResourceType } = await import("resourcexjs");
    const rows = dataTable.hashes();

    this.serializerCalled = false;
    this.deserializerCalled = false;
    this.resolverCalled = false;

    for (const row of rows) {
      defineResourceType({
        name: row.name,
        description: row.description,
        serializer: createMockSerializer(this),
        resolver: createMockResolver(this),
      });
    }
  }
);

When("I define the resource type", async function (this: ResourceTypeWorld) {
  const { defineResourceType } = await import("resourcexjs");

  try {
    this.registeredType = defineResourceType(this.typeDefinition as ResourceType);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When(
  "I try to define another type with name {string}",
  async function (this: ResourceTypeWorld, _name: string) {
    const { defineResourceType } = await import("resourcexjs");

    try {
      this.registeredType = defineResourceType(this.typeDefinition as ResourceType);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When("I get resource type {string}", async function (this: ResourceTypeWorld, name: string) {
  const { getResourceType } = await import("resourcexjs");
  this.retrievedType = getResourceType(name);
});

When(
  "I resolve a resource of type {string}",
  async function (this: ResourceTypeWorld, _type: string) {
    const { createRXM, createRXC, parseRXL } = await import("resourcexjs");

    const manifest = createRXM({
      domain: "localhost",
      name: "test",
      type: _type,
      version: "1.0.0",
    });

    const rxr: RXR = {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      content: createRXC("test content"),
    };

    if (this.registeredType?.resolver) {
      this.resolvedValue = await this.registeredType.resolver.resolve(rxr);
    }
  }
);

Then("the resource type should be registered", async function (this: ResourceTypeWorld) {
  assert.ok(this.registeredType, "Resource type should be registered");
  assert.ok(!this.error, "No error should have been thrown");
});

Then(
  "I can retrieve the type by name {string}",
  async function (this: ResourceTypeWorld, name: string) {
    const { getResourceType } = await import("resourcexjs");
    const type = getResourceType(name);
    assert.ok(type, `Should be able to retrieve type "${name}"`);
    assert.equal(type?.name, name);
  }
);

Then("the serializer should be used for serialization", async function (this: ResourceTypeWorld) {
  // Call serialize to verify it works
  if (this.registeredType?.serializer) {
    const { createRXM, createRXC, parseRXL } = await import("resourcexjs");
    const manifest = createRXM({
      domain: "localhost",
      name: "test",
      type: "json-config",
      version: "1.0.0",
    });
    const rxr: RXR = {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      content: createRXC("{}"),
    };
    await this.registeredType.serializer.serialize(rxr);
  }
  assert.ok(this.serializerCalled, "Serializer should have been called");
});

Then("the serializer should be used for deserialization", async function (this: ResourceTypeWorld) {
  // Call deserialize to verify it works
  if (this.registeredType?.serializer) {
    const { createRXM } = await import("resourcexjs");
    const manifest = createRXM({
      domain: "localhost",
      name: "test",
      type: "json-config",
      version: "1.0.0",
    });
    await this.registeredType.serializer.deserialize(Buffer.from("{}"), manifest);
  }
  assert.ok(this.deserializerCalled, "Deserializer should have been called");
});

Then(
  "the resolver should transform RXR to usable object",
  async function (this: ResourceTypeWorld) {
    assert.ok(this.resolverCalled, "Resolver should have been called");
    assert.ok(this.resolvedValue, "Resolved value should exist");
  }
);

Then("it should throw a ResourceTypeError", async function (this: ResourceTypeWorld) {
  const { ResourceTypeError } = await import("resourcexjs");
  assert.ok(this.error, "Error should have been thrown");
  assert.ok(
    this.error instanceof ResourceTypeError,
    `Expected ResourceTypeError but got ${this.error?.name}`
  );
});

Then("I should receive the type definition", async function (this: ResourceTypeWorld) {
  assert.ok(this.retrievedType, "Should receive type definition");
});

Then(
  "the description should be {string}",
  async function (this: ResourceTypeWorld, expected: string) {
    assert.ok(this.retrievedType, "Type should exist");
    assert.equal(this.retrievedType?.description, expected);
  }
);

Then("it should return undefined", async function (this: ResourceTypeWorld) {
  assert.equal(this.retrievedType, undefined);
});
