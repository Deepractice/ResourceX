# @resourcexjs/type

Type system for ResourceX with global singleton TypeHandlerChain.

## Installation

```bash
bun add @resourcexjs/type
```

## Overview

The `@resourcexjs/type` package provides the type system for ResourceX, managing how different resource types are serialized, deserialized, and resolved.

### Key Concepts

- **ResourceType**: Defines how a resource type is handled (serialization, deserialization, resolution)
- **TypeHandlerChain**: Global singleton managing all registered types
- **Builtin Types**: Text, JSON, and Binary types are automatically registered

## Usage

### Using Builtin Types

Builtin types are automatically available:

```typescript
import { globalTypeHandlerChain } from "@resourcexjs/type";

// Check if type is supported
globalTypeHandlerChain.canHandle("text"); // true
globalTypeHandlerChain.canHandle("json"); // true
globalTypeHandlerChain.canHandle("binary"); // true

// Builtin aliases
globalTypeHandlerChain.canHandle("txt"); // true (alias for text)
globalTypeHandlerChain.canHandle("config"); // true (alias for json)
```

### Registering Custom Types

```typescript
import { globalTypeHandlerChain } from "@resourcexjs/type";
import type { ResourceType } from "@resourcexjs/type";

// Define custom type - resolver returns a callable function
const promptType: ResourceType<void, string> = {
  name: "prompt",
  aliases: ["deepractice-prompt"],
  description: "AI Prompt template",
  serializer: {
    async serialize(rxr) {
      return rxr.content.buffer();
    },
    async deserialize(data, manifest) {
      // ... implementation
    },
  },
  resolver: {
    async resolve(rxr) {
      // Return a callable function (lazy loading)
      return async () => {
        const buffer = await rxr.content.file("content");
        return buffer.toString("utf-8");
      };
    },
  },
};

// Register globally
globalTypeHandlerChain.register(promptType);
```

### Query Supported Types

```typescript
import { globalTypeHandlerChain } from "@resourcexjs/type";

// Get all supported types (including aliases)
const types = globalTypeHandlerChain.getSupportedTypes();
// ["text", "txt", "plaintext", "json", "config", "manifest", "binary", "bin", "blob", "raw"]

// Get handler for specific type
const handler = globalTypeHandlerChain.getHandler("text");
console.log(handler?.name); // "text"
```

### Serialize/Deserialize

```typescript
import { globalTypeHandlerChain } from "@resourcexjs/type";
import { createRXM, createRXA, parseRXL } from "@resourcexjs/core";

// Serialize RXR to Buffer
const manifest = createRXM({
  domain: "localhost",
  name: "test",
  type: "text",
  version: "1.0.0",
});

const rxr = {
  locator: parseRXL(manifest.toLocator()),
  manifest,
  archive: await createRXA({ content: "Hello, World!" }),
};

const buffer = await globalTypeHandlerChain.serialize(rxr);
// Buffer containing tar.gz archive

// Deserialize Buffer to RXR
const restored = await globalTypeHandlerChain.deserialize(buffer, manifest);
const pkg = await restored.archive.extract();
console.log((await pkg.file("content")).toString()); // "Hello, World!"
```

### Resolve Content

```typescript
import { globalTypeHandlerChain } from "@resourcexjs/type";

// Resolve RXR to structured result (lazy loading)
const result = await globalTypeHandlerChain.resolve<void, string>(rxr);

// Check schema (undefined for builtin types)
console.log(result.schema); // undefined

// Execute to get the actual content
const text = await result.execute();
console.log(text); // "Hello, World!"
```

## API Reference

### `globalTypeHandlerChain`

Global singleton instance of TypeHandlerChain.

#### Methods

##### `register(type: ResourceType): void`

Register an extension type.

**Throws**: `ResourceTypeError` if type name or alias already exists.

```typescript
globalTypeHandlerChain.register(customType);
```

##### `canHandle(typeName: string): boolean`

Check if a type is supported.

```typescript
globalTypeHandlerChain.canHandle("text"); // true
```

##### `getHandler(typeName: string): ResourceType | undefined`

Get handler for a type.

```typescript
const handler = globalTypeHandlerChain.getHandler("text");
```

##### `getSupportedTypes(): string[]`

Get all supported type names (including aliases).

```typescript
const types = globalTypeHandlerChain.getSupportedTypes();
```

##### `serialize(rxr: RXR): Promise<Buffer>`

Serialize RXR to Buffer using appropriate type handler.

**Throws**: `ResourceTypeError` if type not supported.

##### `deserialize(data: Buffer, manifest: RXM): Promise<RXR>`

Deserialize Buffer to RXR using appropriate type handler.

**Throws**: `ResourceTypeError` if type not supported.

##### `resolve<TArgs, TResult>(rxr: RXR): Promise<ResolvedResource<TArgs, TResult>>`

Resolve RXR content to structured result using appropriate type handler.

**Returns**: A structured object with `execute` function and optional `schema`.

**Throws**: `ResourceTypeError` if type not supported.

```typescript
const result = await globalTypeHandlerChain.resolve<void, string>(rxr);
result.schema; // undefined for builtin types
await result.execute(); // Lazy load content

// For types with args
const toolResult = await globalTypeHandlerChain.resolve<{ query: string }, unknown>(rxr);
toolResult.schema; // JSONSchema for UI form rendering
await toolResult.execute({ query: "test" });
```

##### `clearExtensions(): void`

Clear all extension types (for testing). Builtin types remain.

```typescript
globalTypeHandlerChain.clearExtensions();
```

## Builtin Types

All builtin types return structured results with `schema: undefined` (no args):

### Text Type

- **Name**: `text`
- **Aliases**: `txt`, `plaintext`
- **Storage**: tar.gz archive
- **Resolves to**: `{ execute: () => Promise<string>, schema: undefined }`

### JSON Type

- **Name**: `json`
- **Aliases**: `config`, `manifest`
- **Storage**: tar.gz archive
- **Resolves to**: `{ execute: () => Promise<unknown>, schema: undefined }`

### Binary Type

- **Name**: `binary`
- **Aliases**: `bin`, `blob`, `raw`
- **Storage**: tar.gz archive
- **Resolves to**: `{ execute: () => Promise<Buffer>, schema: undefined }`

## Type System Architecture

```
┌─────────────────────────────────────────┐
│   globalTypeHandlerChain (Singleton)    │
│                                         │
│   Builtin: text, json, binary          │
│   Extensions: custom types...           │
└─────────────────────────────────────────┘
              ↑
              │
         All packages use
         global singleton
```

## Creating Custom Types

### Example: Prompt Type (No Arguments)

```typescript
import type { ResourceType } from "@resourcexjs/type";
import { createRXA, parseRXL } from "@resourcexjs/core";

export const promptType: ResourceType<void, string> = {
  name: "prompt",
  aliases: ["deepractice-prompt"],
  description: "AI Prompt template",

  serializer: {
    async serialize(rxr) {
      return rxr.content.buffer();
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
    schema: undefined, // No args, schema is undefined
    async resolve(rxr) {
      return {
        schema: undefined,
        execute: async () => {
          const buffer = await rxr.content.file("content");
          return buffer.toString("utf-8");
        },
      };
    },
  },
};
```

### Example: Tool Type (With Arguments and Schema)

```typescript
import type { ResourceType, JSONSchema } from "@resourcexjs/type";

interface ToolArgs {
  query: string;
  limit?: number;
}

const toolSchema: JSONSchema = {
  type: "object",
  properties: {
    query: { type: "string", description: "Search keyword" },
    limit: { type: "number", description: "Max results", default: 10 },
  },
  required: ["query"],
};

export const toolType: ResourceType<ToolArgs, unknown> = {
  name: "tool",
  description: "Executable tool with arguments",

  serializer: {
    async serialize(rxr) {
      return rxr.content.buffer();
    },
    async deserialize(data, manifest) {
      // ... implementation
    },
  },

  resolver: {
    schema: toolSchema, // Required for types with args
    async resolve(rxr) {
      return {
        schema: toolSchema,
        execute: async (args) => {
          // Execute with args
          return { query: args?.query, limit: args?.limit ?? 10 };
        },
      };
    },
  },
};

// Usage
const result = await globalTypeHandlerChain.resolve<ToolArgs, unknown>(rxr);
result.schema; // JSONSchema for UI form rendering
await result.execute({ query: "test", limit: 5 });
```

## Error Handling

```typescript
import { ResourceTypeError } from "@resourcexjs/type";

try {
  await globalTypeHandlerChain.serialize(rxr);
} catch (error) {
  if (error instanceof ResourceTypeError) {
    console.error("Type error:", error.message);
  }
}
```

## Testing

When testing, use `clearExtensions()` to reset extension types:

```typescript
import { afterEach } from "bun:test";
import { globalTypeHandlerChain } from "@resourcexjs/type";

afterEach(() => {
  globalTypeHandlerChain.clearExtensions();
});
```

## License

MIT
