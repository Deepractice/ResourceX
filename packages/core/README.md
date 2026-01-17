# @resourcexjs/core

Core types and implementations for ResourceX.

> **Note**: For most use cases, use the main [`resourcexjs`](https://www.npmjs.com/package/resourcexjs) package. This package is for advanced usage.

## Installation

```bash
npm install @resourcexjs/core
# or
bun add @resourcexjs/core
```

## What's Inside

Core building blocks for ResourceX:

- **RXL** (Locator) - Parse locator strings
- **RXM** (Manifest) - Create resource metadata
- **RXC** (Content) - Stream-based content
- **RXR** (Resource) - Complete resource type
- **ResourceType** - Type system with serializer & resolver
- **TypeHandlerChain** - Responsibility chain for type handling
- **Errors** - Error hierarchy

## API

### RXL - Resource Locator

Parse resource locator strings. Format: `[domain/path/]name[.type][@version]`

```typescript
import { parseRXL } from "@resourcexjs/core";

const rxl = parseRXL("deepractice.ai/sean/assistant.prompt@1.0.0");

rxl.domain; // "deepractice.ai"
rxl.path; // "sean"
rxl.name; // "assistant"
rxl.type; // "prompt"
rxl.version; // "1.0.0"
rxl.toString(); // "deepractice.ai/sean/assistant.prompt@1.0.0"
```

### RXM - Resource Manifest

Create and validate resource metadata:

```typescript
import { createRXM } from "@resourcexjs/core";

const manifest = createRXM({
  domain: "deepractice.ai",
  path: "sean", // optional
  name: "assistant",
  type: "prompt",
  version: "1.0.0",
});

manifest.toLocator(); // → "deepractice.ai/sean/assistant.prompt@1.0.0"
manifest.toJSON(); // → plain object
```

Required fields: domain, name, type, version

### RXC - Resource Content

Stream-based content (can only be consumed once, like fetch Response):

```typescript
import { createRXC, loadRXC } from "@resourcexjs/core";

// Create from memory
const content = createRXC("Hello, World!");
const content = createRXC(Buffer.from([1, 2, 3]));
const content = createRXC(readableStream);

// Load from file or URL (async)
const content = await loadRXC("./file.txt");
const content = await loadRXC("https://example.com/data.txt");

// Consume (choose one, can only use once)
const text = await content.text(); // → string
const buffer = await content.buffer(); // → Buffer
const json = await content.json<T>(); // → T
const stream = content.stream; // → ReadableStream<Uint8Array>
```

### RXR - Resource

Complete resource object (pure interface, no factory):

```typescript
import type { RXR } from "@resourcexjs/core";

interface RXR {
  locator: RXL;
  manifest: RXM;
  content: RXC;
}

// Create from literals
const rxr: RXR = {
  locator: parseRXL("localhost/test.text@1.0.0"),
  manifest: createRXM({ domain: "localhost", name: "test", type: "text", version: "1.0.0" }),
  content: createRXC("content"),
};
```

### Resource Types

Built-in types:

```typescript
import { textType, jsonType, binaryType, builtinTypes } from "@resourcexjs/core";

console.log(textType.name); // "text"
console.log(textType.aliases); // ["txt", "plaintext"]
console.log(jsonType.aliases); // ["config", "manifest"]
console.log(binaryType.aliases); // ["bin", "blob", "raw"]
```

Define custom types:

```typescript
import { defineResourceType } from "@resourcexjs/core";

defineResourceType({
  name: "prompt",
  aliases: ["deepractice-prompt"],
  description: "AI Prompt template",
  serializer: {
    async serialize(rxr: RXR): Promise<Buffer> {
      // Convert RXR to Buffer for storage
      const text = await rxr.content.text();
      return Buffer.from(JSON.stringify({ template: text }));
    },
    async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
      // Convert Buffer back to RXR
      const obj = JSON.parse(data.toString());
      return {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        content: createRXC(obj.template),
      };
    },
  },
  resolver: {
    async resolve(rxr: RXR): Promise<PromptTemplate> {
      // Convert RXR to usable object
      return {
        template: await rxr.content.text(),
        compile: (vars) => {
          /* ... */
        },
      };
    },
  },
});
```

Query registered types:

```typescript
import { getResourceType, clearResourceTypes } from "@resourcexjs/core";

const type = getResourceType("text");
const type = getResourceType("txt"); // Works with aliases

clearResourceTypes(); // For testing
```

### TypeHandlerChain

Responsibility chain for type handling (used internally by Registry):

```typescript
import { createTypeHandlerChain, builtinTypes } from "@resourcexjs/core";

// Create with initial types
const chain = createTypeHandlerChain(builtinTypes);

// Or start empty
const chain = createTypeHandlerChain();
chain.register(customType);
chain.registerAll([type1, type2]);

// Use the chain
chain.canHandle("text"); // → boolean
chain.getHandler("txt"); // → ResourceType (via alias)

await chain.serialize(rxr); // → Buffer
await chain.deserialize(buffer, manifest); // → RXR
await chain.resolve<T>(rxr); // → T (usable object)
```

## Error Handling

```typescript
import {
  ResourceXError,
  LocatorError,
  ManifestError,
  ContentError,
  ResourceTypeError,
} from "@resourcexjs/core";

try {
  const rxl = parseRXL("invalid");
} catch (error) {
  if (error instanceof LocatorError) {
    console.error("Invalid locator:", error.message);
  }
}
```

Error hierarchy:

```
Error
└── ResourceXError
    ├── LocatorError (RXL parsing)
    ├── ManifestError (RXM validation)
    ├── ContentError (RXC consumption)
    └── ResourceTypeError (Type not found/duplicate)
```

## Complete Exports

```typescript
// Errors
export { ResourceXError, LocatorError, ManifestError, ContentError, ResourceTypeError };

// RXL (Locator)
export { parseRXL };
export type { RXL };

// RXM (Manifest)
export { createRXM };
export type { RXM, ManifestData };

// RXC (Content)
export { createRXC, loadRXC };
export type { RXC };

// RXR (Resource)
export type { RXR, ResourceType, ResourceSerializer, ResourceResolver };

// ResourceType
export { defineResourceType, getResourceType, clearResourceTypes };
export { textType, jsonType, binaryType, builtinTypes };
export { TypeHandlerChain, createTypeHandlerChain };
```

## License

MIT
