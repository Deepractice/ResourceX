# Type System

The ResourceX Type System defines how different types of resources are serialized (for storage) and resolved (for execution). It provides built-in types for common use cases and allows custom types for specialized needs.

## Core Concepts

### ResourceType

A ResourceType defines the complete behavior for a type:

```typescript
interface ResourceType<TArgs = void, TResult = unknown> {
  name: string; // Primary type name
  aliases?: string[]; // Alternative names
  description: string; // Human-readable description
  serializer: ResourceSerializer; // RXR <-> Buffer
  resolver: ResourceResolver<TArgs, TResult>; // RXR -> executable
}
```

### ResourceSerializer

Handles conversion between RXR and storage format:

```typescript
interface ResourceSerializer {
  serialize(rxr: RXR): Promise<Buffer>;
  deserialize(data: Buffer, manifest: RXM): Promise<RXR>;
}
```

### ResourceResolver

Transforms RXR into an executable result:

```typescript
interface ResourceResolver<TArgs = void, TResult = unknown> {
  schema: TArgs extends void ? undefined : JSONSchema;
  resolve(rxr: RXR): Promise<ResolvedResource<TArgs, TResult>>;
}
```

### ResolvedResource

The executable wrapper returned by resolution:

```typescript
interface ResolvedResource<TArgs = void, TResult = unknown> {
  resource: RXR; // Original resource
  execute: (args?: TArgs) => TResult | Promise<TResult>; // Callable
  schema: TArgs extends void ? undefined : JSONSchema; // For UI rendering
}
```

## Built-in Types

### text

Plain text content.

```typescript
const textType: ResourceType<void, string> = {
  name: "text",
  aliases: ["txt", "plaintext"],
  description: "Plain text content",
  // ...
};
```

**Usage:**

```typescript
// Create
const content = await createRXA({ content: "Hello World" });

// Resolve
const resolved = await registry.resolve("greeting.text@1.0.0");
const text = await resolved.execute(); // "Hello World"
```

### json

JSON content, parsed to objects.

```typescript
const jsonType: ResourceType<void, unknown> = {
  name: "json",
  aliases: ["config", "manifest"],
  description: "JSON content",
  // ...
};
```

**Usage:**

```typescript
// Create
const content = await createRXA({ content: '{"key": "value"}' });

// Resolve
const resolved = await registry.resolve("config.json@1.0.0");
const obj = await resolved.execute(); // { key: "value" }
```

### binary

Raw binary data.

```typescript
const binaryType: ResourceType<void, Buffer> = {
  name: "binary",
  aliases: ["bin", "blob", "raw"],
  description: "Binary content",
  // ...
};
```

**Usage:**

```typescript
// Create
const content = await createRXA({ content: Buffer.from([0x00, 0x01, 0x02]) });

// Resolve
const resolved = await registry.resolve("data.binary@1.0.0");
const buffer = await resolved.execute(); // Buffer
```

## Type Aliases

Types can be referenced by their name or any alias:

```typescript
// All equivalent - these all use the text type
registry.resolve("doc.text@1.0.0");
registry.resolve("doc.txt@1.0.0");
registry.resolve("doc.plaintext@1.0.0");
```

| Type     | Aliases              |
| -------- | -------------------- |
| `text`   | `txt`, `plaintext`   |
| `json`   | `config`, `manifest` |
| `binary` | `bin`, `blob`, `raw` |

## TypeHandlerChain

The TypeHandlerChain manages type registration and delegates operations:

```typescript
import { TypeHandlerChain } from "@resourcexjs/type";

// Create chain (includes all built-in types)
const chain = TypeHandlerChain.create();

// Check type support
chain.canHandle("text"); // true
chain.canHandle("txt"); // true (alias)
chain.canHandle("unknown"); // false

// Serialize/deserialize
const buffer = await chain.serialize(rxr);
const rxr = await chain.deserialize(buffer, manifest);

// Resolve
const resolved = await chain.resolve<void, string>(rxr);
const result = await resolved.execute();
```

### Registering Custom Types

```typescript
const chain = TypeHandlerChain.create();

chain.register({
  name: "prompt",
  aliases: ["tpl", "template"],
  description: "AI prompt template",
  serializer: promptSerializer,
  resolver: promptResolver,
});

// Now can handle prompt type
chain.canHandle("prompt"); // true
```

## Custom Types

### Basic Custom Type (No Arguments)

```typescript
const greetingType: ResourceType<void, string> = {
  name: "greeting",
  description: "A greeting message",
  serializer: {
    async serialize(rxr) {
      return rxr.archive.buffer();
    },
    async deserialize(data, manifest) {
      return {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        archive: await createRXA({ buffer: data }),
      };
    },
  },
  resolver: {
    schema: undefined, // No arguments
    async resolve(rxr) {
      return {
        resource: rxr,
        schema: undefined,
        execute: async () => {
          const buffer = await rxr.archive.extract().then(pkg => pkg.file("content");
          return `Greeting: ${buffer.toString()}`;
        },
      };
    },
  },
};
```

### Custom Type with Arguments

Types that accept arguments must define a JSON Schema:

```typescript
interface CalculatorArgs {
  a: number;
  b: number;
}

const calculatorType: ResourceType<CalculatorArgs, number> = {
  name: "calculator",
  description: "A simple calculator",
  serializer: {
    async serialize(rxr) {
      return rxr.archive.buffer();
    },
    async deserialize(data, manifest) {
      return {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        archive: await createRXA({ buffer: data }),
      };
    },
  },
  resolver: {
    // Schema required for typed args!
    schema: {
      type: "object",
      properties: {
        a: { type: "number", description: "First number" },
        b: { type: "number", description: "Second number" },
      },
      required: ["a", "b"],
    },
    async resolve(rxr) {
      return {
        resource: rxr,
        schema: this.schema,
        execute: async (args) => {
          return args!.a + args!.b;
        },
      };
    },
  },
};

// Usage
const resolved = await registry.resolve<CalculatorArgs, number>("add.calculator@1.0.0");
const result = await resolved.execute({ a: 5, b: 3 }); // 8
```

## Schema for UI Rendering

The schema in ResolvedResource enables UI form generation:

```typescript
const resolved = await registry.resolve("search.tool@1.0.0");

if (resolved.schema) {
  // Render a form based on schema
  console.log(resolved.schema);
  // {
  //   type: "object",
  //   properties: {
  //     query: { type: "string", description: "Search keyword" },
  //     limit: { type: "number", description: "Max results", default: 10 }
  //   },
  //   required: ["query"]
  // }
}

// Execute with user input
const result = await resolved.execute({ query: "hello", limit: 5 });
```

## Lazy Loading

Resolvers are lazy - content isn't loaded until `execute()` is called:

```typescript
const resolved = await registry.resolve("large-file.binary@1.0.0");
// Content NOT loaded yet

// Only now is content actually read
const data = await resolved.execute();
```

This is important for:

- Listing resources without loading all content
- Conditional execution
- Memory efficiency

## Registry Integration

Registry uses TypeHandlerChain internally:

```typescript
import { createRegistry } from "resourcexjs";

// Default registry has built-in types
const registry = createRegistry();

// Add custom type at creation
const registry = createRegistry({
  types: [promptType, toolType],
});

// Or add dynamically
registry.supportType(calculatorType);

// Now can resolve custom types
const resolved = await registry.resolve("my-calc.calculator@1.0.0");
```

## Design Decisions

### Why Separate Serializer and Resolver?

Different concerns, different implementations:

- **Serializer**: How to store (format, compression)
- **Resolver**: How to use (parsing, execution)

This separation allows:

- Same serialization, different resolution strategies
- Caching serialized form independently
- Swapping implementations without affecting the other

### Why Require Schema for Args?

Type safety at definition time:

```typescript
// This should fail - args expected but no schema!
const badType: ResourceType<{ name: string }, string> = {
  name: "bad",
  resolver: {
    schema: undefined, // TypeScript error!
    // ...
  },
};
```

### Why ResolvedResource Contains Original RXR?

Access to metadata after resolution:

```typescript
const resolved = await registry.resolve("tool.binary@1.0.0");

// Can still access original resource
console.log(resolved.resource.manifest.version);
console.log(resolved.resource.manifest.domain);
```

## Error Handling

### Unsupported Type

```typescript
import { ResourceTypeError } from "@resourcexjs/type";

try {
  await registry.resolve("file.unknown@1.0.0");
} catch (error) {
  if (error instanceof ResourceTypeError) {
    console.log(error.message); // "Unsupported resource type: unknown"
  }
}
```

### Type Already Registered

```typescript
const chain = TypeHandlerChain.create();

chain.register(customType);

try {
  chain.register(customType); // Same name
} catch (error) {
  console.log(error.message); // "Type 'custom' is already registered"
}
```

## API Reference

```typescript
import {
  TypeHandlerChain,
  ResourceTypeError,
  textType,
  jsonType,
  binaryType,
  builtinTypes,
} from "@resourcexjs/type";

// or from main package
import { TypeHandlerChain } from "resourcexjs";

// Create chain
const chain = TypeHandlerChain.create();

// Methods
chain.register(type: ResourceType): void
chain.canHandle(typeName: string): boolean
chain.getHandler(typeName: string): ResourceType | undefined
chain.getSupportedTypes(): string[]
chain.serialize(rxr: RXR): Promise<Buffer>
chain.deserialize(data: Buffer, manifest: RXM): Promise<RXR>
chain.resolve<TArgs, TResult>(rxr: RXR): Promise<ResolvedResource<TArgs, TResult>>
chain.clearExtensions(): void  // For testing
```

## See Also

- [RXR - Complete Resource](./rxr-resource.md) - The input to serialization/resolution
- [Registry](./registry.md) - Where type handling is applied
- [RXA - Resource Archive](./rxa-archive.md) - The archive format types work with
- [RXP - Resource Package](./rxp-package.md) - Extracted files for runtime access
