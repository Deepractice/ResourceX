# resourcexjs

ResourceX - Resource management protocol for AI Agents. Like npm for AI resources.

## Installation

```bash
npm install resourcexjs
# or
bun add resourcexjs
```

## Quick Start

```typescript
import { createRegistry, parseRXL, createRXM, createRXA } from "resourcexjs";

// Create registry
const registry = createRegistry();

// Prepare a resource
const manifest = createRXM({
  name: "my-prompt",
  type: "text",
  version: "1.0.0",
});

const rxr = {
  locator: parseRXL(manifest.toLocator()),
  manifest,
  archive: await createRXA({ content: "You are a helpful assistant." }),
};

// Add to registry
await registry.add(rxr);

// Resolve and execute
const resolved = await registry.resolve("localhost/my-prompt.text@1.0.0");
const text = await resolved.execute();
console.log(text); // "You are a helpful assistant."
```

## Core Concepts

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
  domain: "deepractice.ai", // optional, defaults to "localhost"
  path: "sean", // optional
  name: "assistant",
  type: "prompt",
  version: "1.0.0",
});

manifest.toLocator(); // "deepractice.ai/sean/assistant.prompt@1.0.0"
manifest.toJSON(); // plain object
```

### RXA - Resource Archive

Archive container (tar.gz) for storage/transfer:

```typescript
import { createRXA } from "resourcexjs";

// Single file
const archive = await createRXA({ content: "Hello, World!" });

// Multiple files
const archive = await createRXA({
  "index.ts": "export default 1",
  "styles.css": "body {}",
});

// Extract to package for file access
const pkg = await archive.extract();
const buffer = await pkg.file("content"); // Buffer
const files = await pkg.files(); // Map<string, Buffer>

// Archive methods
const tarGzBuffer = await archive.buffer();
const stream = archive.stream;
```

### RXR - Resource

Complete resource object (pure interface):

```typescript
import type { RXR } from "resourcexjs";

const rxr: RXR = {
  locator, // RXL
  manifest, // RXM
  archive, // RXA
};
```

### Registry

Resource storage and retrieval:

```typescript
import { createRegistry, loadResource } from "resourcexjs";

const registry = createRegistry({
  path: "~/.resourcex", // optional
  types: [customType], // optional, defaults to built-in types
  isolator: "srt", // optional sandbox isolation
});

// Add from folder or RXR
await registry.add("./my-prompt");
await registry.add(rxr);

// Link for development (symlink)
await registry.link("./my-prompt");

// Resolve and execute
const resolved = await registry.resolve("localhost/my-prompt.text@1.0.0");
const text = await resolved.execute();

// Get raw RXR
const rxr = await registry.get("localhost/my-prompt.text@1.0.0");

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

Custom types (requires bundling):

```typescript
import { bundleResourceType, createRegistry } from "resourcexjs";

// Bundle from source file
const promptType = await bundleResourceType("./prompt.type.ts");

// Create registry with type
const registry = createRegistry({
  types: [promptType],
});
```

### Load Resources

Load resources from folders:

```typescript
import { loadResource, FolderLoader } from "resourcexjs";

// Load from folder (uses FolderLoader by default)
const rxr = await loadResource("./my-prompt");

// Use custom loader
const rxr = await loadResource("./my-prompt", {
  loader: new CustomLoader(),
});
```

## ARP - Low-level I/O

For direct file/network operations:

```typescript
import { createARP } from "resourcexjs/arp";

// createARP() includes rxr transport for ResourceX resources
const arp = createARP();

// Parse URL
const arl = arp.parse("arp:text:file://./config.txt");

// Read
const resource = await arl.resolve();
console.log(resource.content); // string

// Write
await arl.deposit("hello world");

// Operations
await arl.exists(); // boolean
await arl.delete();

// Access files inside resources
const rxrArl = arp.parse("arp:text:rxr://localhost/my-prompt.text@1.0.0/content");
const { content } = await rxrArl.resolve();
```

## Exports

### Main Package (`resourcexjs`)

```typescript
// Errors
export { ResourceXError, LocatorError, ManifestError, ContentError };
export { ResourceTypeError };
export { RegistryError };

// RXL (Locator)
export { parseRXL };
export type { RXL };

// RXM (Manifest)
export { createRXM };
export type { RXM, ManifestData };

// RXA (Archive) and RXP (Package)
export { createRXA };
export type { RXA, RXP, RXAInput, PathNode };

// RXR (Resource)
export type { RXR };

// Type System
export type {
  ResourceType,
  ResourceResolver,
  ResolvedResource,
  JSONSchema,
  BundledType,
  IsolatorType,
};
export { TypeHandlerChain, bundleResourceType };
export { textType, jsonType, binaryType, builtinTypes };

// Resource Loading
export type { ResourceLoader, LoadResourceConfig };
export { loadResource, FolderLoader };

// Registry
export type {
  Registry,
  RegistryConfig,
  ClientRegistryConfig,
  ServerRegistryConfig,
  CreateRegistryConfig,
};
export type { Storage, SearchOptions, DiscoveryResult, WellKnownResponse };
export { DefaultRegistry, createRegistry, discoverRegistry, LocalStorage };

// Middleware
export { RegistryMiddleware, DomainValidation, withDomainValidation };

// Version
export const VERSION: string;
```

### ARP Package (`resourcexjs/arp`)

```typescript
// Enhanced createARP with RxrTransport
export { createARP, ARP, type ARPConfig };
export { VERSION };
export { ARPError, ParseError, TransportError, SemanticError };
export type { ARI, ARL };

// Transports
export type { TransportHandler, TransportResult, TransportParams };
export { FileTransportHandler, fileTransport };
export { HttpTransportHandler, httpTransport, httpsTransport };
export { RxrTransport, clearRegistryCache, type RxrTransportRegistry };

// Semantics
export type { Resource, SemanticHandler, ResourceMeta, SemanticContext };
export type { TextResource, BinaryResource, BinaryInput };
export { TextSemanticHandler, textSemantic };
export { BinarySemanticHandler, binarySemantic };
```

## Error Hierarchy

```
Error
├── ResourceXError
│   ├── LocatorError (RXL parsing)
│   ├── ManifestError (RXM validation)
│   └── ContentError (RXA/RXP operations)
├── ResourceTypeError (Type registration)
├── RegistryError (Registry operations)
└── ARPError
    ├── ParseError (URL parsing)
    ├── TransportError (Transport operations)
    └── SemanticError (Semantic operations)
```

## Packages

| Package                 | Description                   |
| ----------------------- | ----------------------------- |
| `resourcexjs`           | Main package (re-exports all) |
| `@resourcexjs/core`     | RXL, RXM, RXA, RXP, RXR       |
| `@resourcexjs/type`     | Type system, bundler          |
| `@resourcexjs/loader`   | Resource loading              |
| `@resourcexjs/registry` | Storage and retrieval         |
| `@resourcexjs/arp`      | Low-level I/O protocol        |

## License

MIT
