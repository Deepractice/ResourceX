# resourcexjs

ResourceX - Resource management protocol for AI Agents. Like npm for AI resources.

## Installation

```bash
npm install resourcexjs @resourcexjs/registry
# or
bun add resourcexjs @resourcexjs/registry
```

## Quick Start

```typescript
import { createRegistry } from "@resourcexjs/registry";
import { createRXM, createRXA, parseRXL } from "resourcexjs";

// Create registry
const registry = createRegistry();

// Prepare a resource
const manifest = createRXM({
  domain: "localhost",
  name: "my-prompt",
  type: "text",
  version: "1.0.0",
});

const rxr = {
  locator: parseRXL(manifest.toLocator()),
  manifest,
  archive: createRXA("You are a helpful assistant."),
};

// Link to local registry
await registry.link(rxr);

// Resolve resource
const resource = await registry.resolve("localhost/my-prompt.text@1.0.0");
console.log(await resource.content.text());
```

## API

### RXL - Resource Locator

Parse resource locator strings. Format: `[domain/path/]name[.type][@version]`

```typescript
import { parseRXL } from "resourcexjs";

const rxl = parseRXL("deepractice.ai/sean/assistant.prompt@1.0.0");

rxl.domain; // "deepractice.ai"
rxl.path; // "sean"
rxl.name; // "assistant"
rxl.type; // "prompt"
rxl.version; // "1.0.0"
rxl.toString(); // reconstructs the locator
```

### RXM - Resource Manifest

Create resource metadata:

```typescript
import { createRXM } from "resourcexjs";

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

### RXA - Resource Archive

Archive container (tar.gz) for storage/transfer, extract to RXP for file access:

```typescript
import { createRXA } from "resourcexjs";

// Single file
const content = await createRXA({ content: "Hello, World!" });

// Multiple files
const content = await createRXA({
  "index.ts": "export default 1",
  "styles.css": "body {}",
});

// Nested directories
const content = await createRXA({
  "src/index.ts": "main code",
  "src/utils/helper.ts": "helper code",
});

// Extract to package for file access
const pkg = await content.extract();
const buffer = await pkg.file("content"); // single file → Buffer
const files = await pkg.files(); // all files → Map<string, Buffer>

// Archive methods
const archiveBuffer = await content.buffer(); // raw tar.gz
const stream = content.stream; // tar.gz ReadableStream
```

### RXR - Resource

Complete resource object (pure interface):

```typescript
interface RXR {
  locator: RXL;
  manifest: RXM;
  archive: RXA;
}

// Create from literals
const rxr: RXR = { locator, manifest, content };
```

### Registry

Resource storage and retrieval (from `@resourcexjs/registry`):

```typescript
import { createRegistry } from "@resourcexjs/registry";

const registry = createRegistry({
  path: "~/.resourcex", // optional
  types: [customType], // optional, defaults to built-in types
});

// Link (local development/cache)
await registry.link(rxr);

// Resolve (local-first, then remote)
const rxr = await registry.resolve("deepractice.ai/assistant.prompt@1.0.0");

// Check existence
const exists = await registry.exists("localhost/test.text@1.0.0");

// Delete
await registry.delete("localhost/test.text@1.0.0");

// Search
const results = await registry.search({ query: "assistant", limit: 10 });
```

### Resource Types

Built-in types:

| Type     | Aliases          | Description    |
| -------- | ---------------- | -------------- |
| `text`   | txt, plaintext   | Plain text     |
| `json`   | config, manifest | JSON content   |
| `binary` | bin, blob, raw   | Binary content |

Define custom types:

```typescript
import { defineResourceType } from "resourcexjs";

defineResourceType({
  name: "prompt",
  aliases: ["deepractice-prompt"],
  description: "AI Prompt template",
  serializer: {
    serialize: async (rxr) => Buffer.from(await rxr.content.text()),
    deserialize: async (data, manifest) => ({
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: createRXA(data.toString()),
    }),
  },
  resolver: {
    resolve: async (rxr) => ({
      template: await rxr.content.text(),
      // ... custom methods
    }),
  },
});
```

### TypeHandlerChain

Responsibility chain for type handling (used internally):

```typescript
import { createTypeHandlerChain, builtinTypes } from "resourcexjs";

const chain = createTypeHandlerChain(builtinTypes);

chain.serialize(rxr); // → Buffer
chain.deserialize(buffer, manifest); // → RXR
chain.resolve<T>(rxr); // → T (usable object)
```

## ARP - Low-level I/O

For direct file/network operations:

```typescript
import { createARP } from "resourcexjs/arp";

const arp = createARP(); // Defaults include file, http, https, text, binary

// Parse URL
const arl = arp.parse("arp:text:file://./config.txt");

// Read
const resource = await arl.resolve();
console.log(resource.content); // string

// Read with params (e.g., directory listing)
const dirArl = arp.parse("arp:text:file://./data");
const dir = await dirArl.resolve({ recursive: "true", pattern: "*.json" });

// Write
await arl.deposit("hello world");

// Operations
await arl.exists(); // → boolean
await arl.delete();
```

## Exports

### Main Package (`resourcexjs`)

```typescript
// Errors
export { ResourceXError, LocatorError, ManifestError, ContentError, ResourceTypeError };

// RXL (Locator)
export { parseRXL };
export type { RXL };

// RXM (Manifest)
export { createRXM };
export type { RXM, ManifestData };

// RXA (Archive) and RXP (Package)
export { createRXA };
export type { RXA, RXP, PathNode };

// RXR (Resource)
export type { RXR, ResourceType, ResourceSerializer, ResourceResolver };

// ResourceType
export { defineResourceType, getResourceType, clearResourceTypes };
export { textType, jsonType, binaryType, builtinTypes };
export { TypeHandlerChain, createTypeHandlerChain };
```

### Registry Package (`@resourcexjs/registry`)

```typescript
export { createRegistry, ARPRegistry };
export { RegistryError };
export type { Registry, RegistryConfig };
```

### ARP Package (`resourcexjs/arp`)

```typescript
export { createARP, ARP, type ARPConfig };
export { ARPError, ParseError, TransportError, SemanticError };
export type { ARI, ARL };
export { fileTransport, httpTransport, httpsTransport };
export { textSemantic, binarySemantic };
```

## Error Hierarchy

```
Error
└── ResourceXError
    ├── LocatorError (RXL parsing)
    ├── ManifestError (RXM validation)
    ├── ContentError (RXA/RXP operations)
    └── ResourceTypeError (Type registration)

└── RegistryError (Registry operations)

└── ARPError
    ├── ParseError (URL parsing)
    ├── TransportError (Transport not found)
    └── SemanticError (Semantic not found)
```

## License

MIT
