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

// Define custom type
const promptType: ResourceType<string> = {
  name: "prompt",
  aliases: ["deepractice-prompt"],
  description: "AI Prompt template",
  serializer: {
    async serialize(rxr) {
      const text = await rxr.content.text();
      return Buffer.from(text, "utf-8");
    },
    async deserialize(data, manifest) {
      // ... implementation
    },
  },
  resolver: {
    async resolve(rxr) {
      return rxr.content.text();
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
import { createRXM, createRXC, parseRXL } from "@resourcexjs/core";

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
  content: createRXC("Hello, World!"),
};

const buffer = await globalTypeHandlerChain.serialize(rxr);
// Buffer containing "Hello, World!"

// Deserialize Buffer to RXR
const restored = await globalTypeHandlerChain.deserialize(buffer, manifest);
console.log(await restored.content.text()); // "Hello, World!"
```

### Resolve Content

```typescript
import { globalTypeHandlerChain } from "@resourcexjs/type";

// Resolve RXR to usable object
const text = await globalTypeHandlerChain.resolve<string>(rxr);
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

##### `resolve<T>(rxr: RXR): Promise<T>`

Resolve RXR content to usable object using appropriate type handler.

**Throws**: `ResourceTypeError` if type not supported.

##### `clearExtensions(): void`

Clear all extension types (for testing). Builtin types remain.

```typescript
globalTypeHandlerChain.clearExtensions();
```

## Builtin Types

### Text Type

- **Name**: `text`
- **Aliases**: `txt`, `plaintext`
- **Storage**: UTF-8 encoded string
- **Resolves to**: `string`

### JSON Type

- **Name**: `json`
- **Aliases**: `config`, `manifest`
- **Storage**: Formatted JSON string
- **Resolves to**: `unknown` (parsed object)

### Binary Type

- **Name**: `binary`
- **Aliases**: `bin`, `blob`, `raw`
- **Storage**: Raw bytes
- **Resolves to**: `Buffer`

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

### Example: Prompt Type

```typescript
import type { ResourceType } from "@resourcexjs/type";
import { createRXC, parseRXL } from "@resourcexjs/core";

export const promptType: ResourceType<string> = {
  name: "prompt",
  aliases: ["deepractice-prompt"],
  description: "AI Prompt template with variable substitution",

  serializer: {
    async serialize(rxr) {
      const text = await rxr.content.text();
      return Buffer.from(text, "utf-8");
    },

    async deserialize(data, manifest) {
      const text = data.toString("utf-8");
      return {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        content: createRXC(text),
      };
    },
  },

  resolver: {
    async resolve(rxr) {
      // Custom resolution logic
      const template = await rxr.content.text();
      return template;
    },
  },
};
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
