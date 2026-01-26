# Type System

The ResourceX Type System defines how different types of resources are resolved for execution. It uses a **BundledType** architecture that supports sandbox-isolated execution for security and portability.

## Core Concepts

### BundledType

A BundledType contains pre-bundled resolver code ready for sandbox execution:

```typescript
interface BundledType {
  name: string; // Type name (e.g., "text", "json")
  aliases?: string[]; // Alternative names (e.g., ["txt", "plaintext"])
  description: string; // Human-readable description
  schema?: JSONSchema; // JSON Schema for resolver arguments
  code: string; // Bundled resolver code (executable in sandbox)
}
```

### ResolveContext

The data structure passed to resolvers in the sandbox:

```typescript
interface ResolveContext {
  manifest: {
    domain: string;
    path?: string;
    name: string;
    type: string;
    version: string;
  };
  files: Record<string, Uint8Array>; // Extracted files from archive
}
```

### ResolvedResource

The executable wrapper returned by resolution:

```typescript
interface ResolvedResource<TArgs = void, TResult = unknown> {
  resource: unknown; // Original RXR resource
  execute: (args?: TArgs) => TResult | Promise<TResult>; // Callable
  schema: TArgs extends void ? undefined : JSONSchema; // For UI rendering
}
```

### IsolatorType

Sandbox isolation levels for resolver execution:

```typescript
type IsolatorType = "none" | "srt" | "cloudflare" | "e2b";
```

| Level        | Description         | Latency | Use Case             |
| ------------ | ------------------- | ------- | -------------------- |
| `none`       | No isolation        | ~10ms   | Development          |
| `srt`        | OS-level isolation  | ~50ms   | Secure local dev     |
| `cloudflare` | Container isolation | ~100ms  | Edge/Docker          |
| `e2b`        | MicroVM isolation   | ~150ms  | Production (planned) |

## Built-in Types

Built-in types are pre-bundled and registered automatically. They expect a file named "content" in the archive.

### text

Plain text content.

```typescript
const textType: BundledType = {
  name: "text",
  aliases: ["txt", "plaintext"],
  description: "Plain text content",
  code: `...`, // Bundled resolver code
};
```

**Resolver logic:**

```typescript
async resolve(ctx) {
  const content = ctx.files["content"];
  return new TextDecoder().decode(content);
}
```

**Usage:**

```typescript
// Create
const archive = await createRXA({ content: "Hello World" });

// Resolve
const resolved = await registry.resolve("greeting.text@1.0.0");
const text = await resolved.execute(); // "Hello World"
```

### json

JSON content, parsed to objects.

```typescript
const jsonType: BundledType = {
  name: "json",
  aliases: ["config", "manifest"],
  description: "JSON content",
  code: `...`, // Bundled resolver code
};
```

**Resolver logic:**

```typescript
async resolve(ctx) {
  const content = ctx.files["content"];
  return JSON.parse(new TextDecoder().decode(content));
}
```

**Usage:**

```typescript
// Create
const archive = await createRXA({ content: '{"key": "value"}' });

// Resolve
const resolved = await registry.resolve("config.json@1.0.0");
const obj = await resolved.execute(); // { key: "value" }
```

### binary

Raw binary data.

```typescript
const binaryType: BundledType = {
  name: "binary",
  aliases: ["bin", "blob", "raw"],
  description: "Binary content",
  code: `...`, // Bundled resolver code
};
```

**Resolver logic:**

```typescript
async resolve(ctx) {
  return ctx.files["content"];
}
```

**Usage:**

```typescript
// Create
const archive = await createRXA({ content: Buffer.from([0x00, 0x01, 0x02]) });

// Resolve
const resolved = await registry.resolve("data.binary@1.0.0");
const buffer = await resolved.execute(); // Uint8Array
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

The TypeHandlerChain manages type registration and lookup:

```typescript
import { TypeHandlerChain } from "@resourcexjs/type";

// Create chain (includes all built-in types)
const chain = TypeHandlerChain.create();

// Check type support
chain.canHandle("text"); // true
chain.canHandle("txt"); // true (alias)
chain.canHandle("unknown"); // false

// Get handler for a type
const handler = chain.getHandler("text"); // BundledType
console.log(handler.name); // "text"
console.log(handler.code); // Bundled resolver code

// Get all supported types
const types = chain.getSupportedTypes();
// ["text", "txt", "plaintext", "json", "config", "manifest", "binary", "bin", "blob", "raw"]
```

### Registering Custom Types

```typescript
const chain = TypeHandlerChain.create();

chain.register({
  name: "prompt",
  aliases: ["tpl", "template"],
  description: "AI prompt template",
  schema: { type: "object", properties: { name: { type: "string" } } },
  code: `// Bundled resolver code...`,
});

// Now can handle prompt type
chain.canHandle("prompt"); // true
```

## Custom Types

Custom types are created as `.type.ts` files and bundled using `bundleResourceType()`.

### Creating a Custom Type Source File

Create a `.type.ts` file with a default export:

```typescript
// greeting.type.ts
export default {
  name: "greeting",
  aliases: ["greet"],
  description: "A greeting message",

  async resolve(ctx: any) {
    const content = ctx.files["content"];
    const text = new TextDecoder().decode(content);
    return `Greeting: ${text}`;
  },
};
```

### Bundling the Type

```typescript
import { bundleResourceType } from "@resourcexjs/type";

const greetingType = await bundleResourceType("./greeting.type.ts");
// Returns BundledType with bundled code
```

### Custom Type with Arguments

Types that accept arguments must define a JSON Schema:

```typescript
// calculator.type.ts
export default {
  name: "calculator",
  description: "A simple calculator",

  // Schema required for typed args
  schema: {
    type: "object",
    properties: {
      a: { type: "number", description: "First number" },
      b: { type: "number", description: "Second number" },
    },
    required: ["a", "b"],
  },

  async resolve(ctx: any, args: any) {
    // args contains { a: number, b: number }
    return args.a + args.b;
  },
};

// Usage
const resolved = await registry.resolve<{ a: number; b: number }, number>("add.calculator@1.0.0");
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

Registry uses TypeHandlerChain internally and supports configurable isolation:

```typescript
import { createRegistry } from "resourcexjs";

// Default registry has built-in types (no isolation)
const registry = createRegistry();

// Add custom types at creation
const registry = createRegistry({
  types: [promptType, toolType],
});

// Or add dynamically
registry.supportType(calculatorType);

// With sandbox isolation
const secureRegistry = createRegistry({
  isolator: "srt", // OS-level isolation
  types: [promptType],
});

// Now can resolve custom types
const resolved = await registry.resolve("my-calc.calculator@1.0.0");
```

## Design Decisions

### Why Bundled Code?

The BundledType architecture uses pre-bundled code strings for several reasons:

1. **Sandbox compatibility**: Code can be executed in isolated environments
2. **Security**: No closure access to host environment
3. **Portability**: Same code runs across different runtimes (Node, Bun, edge)
4. **Caching**: Bundled code is static and cacheable

### Why ResolveContext instead of RXR?

Resolvers receive `ResolveContext` (pure data) instead of RXR:

- **Serializable**: Can be passed to sandboxes
- **Pre-extracted**: Files are already extracted from archive
- **Simple**: No need to handle async archive operations

### Why Configurable Isolation?

Different use cases require different security levels:

```typescript
// Development: speed matters, trust local code
createRegistry({ isolator: "none" });

// Production: security matters
createRegistry({ isolator: "cloudflare" });
```

### Why Schema in BundledType?

Schema enables UI form generation without executing code:

```typescript
const resolved = await registry.resolve("tool.binary@1.0.0");

// Schema available before execution
if (resolved.schema) {
  renderForm(resolved.schema); // Generate UI form
}
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
  bundleResourceType,
} from "@resourcexjs/type";

// or from main package
import { TypeHandlerChain } from "resourcexjs";

// Create chain (built-in types included)
const chain = TypeHandlerChain.create();

// Methods
chain.register(type: BundledType): void
chain.canHandle(typeName: string): boolean
chain.getHandler(typeName: string): BundledType  // throws if not found
chain.getHandlerOrUndefined(typeName: string): BundledType | undefined
chain.getSupportedTypes(): string[]
chain.clear(): void  // For testing

// Bundle custom type from source file
const myType = await bundleResourceType("./my.type.ts");
```

## See Also

- [RXR - Complete Resource](./rxr-resource.md) - The input to serialization/resolution
- [Registry](./registry.md) - Where type handling is applied
- [RXA - Resource Archive](./rxa-archive.md) - The archive format types work with
- [RXP - Resource Package](./rxp-package.md) - Extracted files for runtime access
