# @resourcexjs/type

Type system for ResourceX with sandbox-compatible execution.

## Installation

```bash
bun add @resourcexjs/type
```

## Overview

The `@resourcexjs/type` package provides the type system for ResourceX, managing how different resource types are resolved and executed.

### Key Concepts

- **BundledType**: Pre-bundled resource type ready for sandbox execution
- **TypeHandlerChain**: Type registry managing type lookup and registration
- **ResourceType**: Interface for defining custom types (before bundling)
- **ResolvedResource**: Result object with execute function and optional schema
- **Builtin Types**: Text, JSON, and Binary types are included by default

## Usage

### Using TypeHandlerChain

```typescript
import { TypeHandlerChain } from "@resourcexjs/type";

// Create a new chain (builtin types included)
const chain = TypeHandlerChain.create();

// Check if type is supported
chain.canHandle("text"); // true
chain.canHandle("json"); // true
chain.canHandle("binary"); // true

// Builtin aliases
chain.canHandle("txt"); // true (alias for text)
chain.canHandle("config"); // true (alias for json)

// Get handler
const handler = chain.getHandler("text");
console.log(handler.name); // "text"

// Get all supported types
const types = chain.getSupportedTypes();
// ["text", "txt", "plaintext", "json", "config", "manifest", "binary", "bin", "blob", "raw"]
```

### Registering Custom Types

```typescript
import { TypeHandlerChain, bundleResourceType } from "@resourcexjs/type";
import type { BundledType } from "@resourcexjs/type";

// Bundle a resource type from source file
const promptType = await bundleResourceType("./prompt.type.ts");

// Register with chain
const chain = TypeHandlerChain.create();
chain.register(promptType);
```

### Bundling Resource Types

Resource types must be bundled before registration. The bundler converts a `.type.ts` source file into a `BundledType` with executable code:

```typescript
import { bundleResourceType } from "@resourcexjs/type";

// Bundle from source file
const myType = await bundleResourceType("./my-resource.type.ts");
// → { name, aliases, description, schema, code }
```

**Source file format (`my-resource.type.ts`):**

```typescript
export default {
  name: "prompt",
  aliases: ["deepractice-prompt"],
  description: "AI Prompt template",
  schema: undefined, // or JSONSchema for types with args
  async resolve(ctx) {
    // ctx.manifest - resource metadata
    // ctx.files - extracted files as Record<string, Uint8Array>
    const content = new TextDecoder().decode(ctx.files["content"]);
    return content;
  },
};
```

## API Reference

### `TypeHandlerChain`

Type registry managing type lookup and registration.

#### Static Methods

##### `TypeHandlerChain.create(): TypeHandlerChain`

Create a new TypeHandlerChain instance with builtin types.

```typescript
const chain = TypeHandlerChain.create();
```

#### Instance Methods

##### `register(type: BundledType): void`

Register a custom type.

**Throws**: `ResourceTypeError` if type name or alias already exists.

```typescript
chain.register(promptType);
```

##### `canHandle(typeName: string): boolean`

Check if a type is supported.

```typescript
chain.canHandle("text"); // true
```

##### `getHandler(typeName: string): BundledType`

Get handler for a type.

**Throws**: `ResourceTypeError` if type not supported.

```typescript
const handler = chain.getHandler("text");
```

##### `getHandlerOrUndefined(typeName: string): BundledType | undefined`

Get handler or undefined if not found.

```typescript
const handler = chain.getHandlerOrUndefined("unknown"); // undefined
```

##### `getSupportedTypes(): string[]`

Get all supported type names (including aliases).

```typescript
const types = chain.getSupportedTypes();
```

##### `clear(): void`

Clear all registered types (for testing).

```typescript
chain.clear();
```

### `bundleResourceType(sourcePath, basePath?)`

Bundle a resource type from a source file.

**Parameters:**

- `sourcePath: string` - Path to the .type.ts file
- `basePath?: string` - Base path for resolving relative paths (defaults to cwd)

**Returns**: `Promise<BundledType>`

```typescript
const myType = await bundleResourceType("./my-resource.type.ts");
```

## Types

### BundledType

Pre-bundled resource type ready for execution:

```typescript
interface BundledType {
  name: string; // Type name (e.g., "text", "json")
  aliases?: string[]; // Alternative names
  description: string; // Human-readable description
  schema?: JSONSchema; // JSON Schema for resolver arguments
  code: string; // Bundled resolver code
}
```

### ResolvedResource

Result object returned after resolution:

```typescript
interface ResolvedResource<TArgs = void, TResult = unknown> {
  resource: unknown; // Original RXR object
  execute: (args?: TArgs) => TResult | Promise<TResult>;
  schema: TArgs extends void ? undefined : JSONSchema;
}
```

### ResolveContext

Context passed to resolver in sandbox:

```typescript
interface ResolveContext {
  manifest: {
    domain: string;
    path?: string;
    name: string;
    type: string;
    version: string;
  };
  files: Record<string, Uint8Array>;
}
```

### IsolatorType

Sandbox isolation levels (configured at Registry level):

```typescript
type IsolatorType = "none" | "srt" | "cloudflare" | "e2b";
```

- `"none"`: No isolation, fastest (~10ms), for development
- `"srt"`: OS-level isolation (~50ms), secure local dev
- `"cloudflare"`: Container isolation (~100ms), local Docker or edge
- `"e2b"`: MicroVM isolation (~150ms), production (planned)

## Builtin Types

All builtin types have `schema: undefined` (no arguments):

### Text Type

- **Name**: `text`
- **Aliases**: `txt`, `plaintext`
- **Resolves to**: `string`

### JSON Type

- **Name**: `json`
- **Aliases**: `config`, `manifest`
- **Resolves to**: `unknown`

### Binary Type

- **Name**: `binary`
- **Aliases**: `bin`, `blob`, `raw`
- **Resolves to**: `Uint8Array`

## Creating Custom Types

### Example: Prompt Type (No Arguments)

**prompt.type.ts:**

```typescript
export default {
  name: "prompt",
  aliases: ["deepractice-prompt"],
  description: "AI Prompt template",
  schema: undefined,
  async resolve(ctx) {
    const content = new TextDecoder().decode(ctx.files["content"]);
    return content;
  },
};
```

### Example: Tool Type (With Arguments)

**tool.type.ts:**

```typescript
export default {
  name: "tool",
  description: "Executable tool with arguments",
  schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search keyword" },
      limit: { type: "number", description: "Max results", default: 10 },
    },
    required: ["query"],
  },
  async resolve(ctx, args) {
    // Execute with args
    return { query: args?.query, limit: args?.limit ?? 10 };
  },
};
```

## Error Handling

```typescript
import { ResourceTypeError } from "@resourcexjs/type";

try {
  chain.getHandler("unknown");
} catch (error) {
  if (error instanceof ResourceTypeError) {
    console.error("Type error:", error.message);
  }
}
```

## License

MIT
