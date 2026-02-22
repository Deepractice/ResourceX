# @resourcexjs/core

Core primitives and types for ResourceX - the resource management protocol for AI Agents.

> **Note**: For most use cases, use the main [`resourcexjs`](https://www.npmjs.com/package/resourcexjs) package. This package is for low-level operations.

## Installation

```bash
npm install @resourcexjs/core
# or
bun add @resourcexjs/core
```

## Core Concepts

ResourceX uses a layered architecture with six core primitives:

| Primitive | Description                                              |
| --------- | -------------------------------------------------------- |
| **RXD**   | Resource Definition - content of `resource.json`         |
| **RXI**   | Resource Identifier - structured identifier `{ registry?, path?, name, tag }` |
| **RXL**   | Resource Locator - unified locator string (RXI string, directory path, or URL) |
| **RXM**   | Resource Manifest - metadata stored within the resource  |
| **RXA**   | Resource Archive - tar.gz container for storage/transfer |
| **RXR**   | Resource - complete resource (RXI + RXM + RXA)           |

### Locator Format

Docker-style format: `[registry/][path/]name[:tag]`

```
hello                           -> name=hello, tag=latest
hello:1.0.0                     -> name=hello, tag=1.0.0
prompts/hello:stable            -> path=prompts, name=hello, tag=stable
localhost:3098/hello:1.0.0      -> registry=localhost:3098, name=hello, tag=1.0.0
registry.example.com/org/hello  -> registry=registry.example.com, path=org, name=hello, tag=latest
```

## API

### `parse(locator: string): RXI`

Parse a locator string into an RXI object.

```typescript
import { parse } from "@resourcexjs/core";

const rxi = parse("registry.example.com/prompts/hello:1.0.0");
// {
//   registry: "registry.example.com",
//   path: "prompts",
//   name: "hello",
//   tag: "1.0.0"
// }

const simple = parse("hello");
// { registry: undefined, path: undefined, name: "hello", tag: "latest" }
```

### `format(rxi: RXI): string`

Format an RXI object back to a locator string.

```typescript
import { format } from "@resourcexjs/core";

format({ name: "hello", tag: "latest" });
// "hello"

format({ name: "hello", tag: "1.0.0" });
// "hello:1.0.0"

format({ registry: "localhost:3098", name: "hello", tag: "1.0.0" });
// "localhost:3098/hello:1.0.0"
```

### `define(input: unknown): RXD`

Parse and validate a resource definition (from `resource.json`).

```typescript
import { define } from "@resourcexjs/core";

const rxd = define({
  name: "my-prompt",
  type: "text",
  tag: "1.0.0",
  description: "A helpful prompt",
  author: "Alice",
});
// {
//   name: "my-prompt",
//   type: "text",
//   tag: "1.0.0",
//   description: "A helpful prompt",
//   author: "Alice"
// }
```

**Required fields**: `name`, `type`

**Optional fields**: `tag` (defaults to "latest"), `registry`, `path`, `description`, `author`, `license`, `keywords`, `repository`

> Note: `version` is accepted as an alias for `tag` for backward compatibility.

### `manifest(rxd: RXD): RXM`

Create a manifest from a definition. Extracts core metadata fields.

```typescript
import { define, manifest } from "@resourcexjs/core";

const rxd = define({
  name: "my-prompt",
  type: "text",
  tag: "1.0.0",
  description: "A helpful prompt", // not included in manifest
});

const rxm = manifest(rxd);
// { name: "my-prompt", type: "text", tag: "1.0.0" }
```

### `locate(rxm: RXM): RXI`

Create an identifier from a manifest.

```typescript
import { locate } from "@resourcexjs/core";

const rxi = locate({
  registry: "example.com",
  path: "prompts",
  name: "hello",
  type: "text",
  tag: "1.0.0",
});
// { registry: "example.com", path: "prompts", name: "hello", tag: "1.0.0" }
```

### `archive(files: Record<string, Buffer>): Promise<RXA>`

Create an archive from files. Output is in tar.gz format.

```typescript
import { archive } from "@resourcexjs/core";

// Single file
const rxa = await archive({
  content: Buffer.from("Hello, World!"),
});

// Multiple files
const rxa = await archive({
  "prompt.md": Buffer.from("# System Prompt\nYou are..."),
  "config.json": Buffer.from('{"temperature": 0.7}'),
});

// Nested directories
const rxa = await archive({
  "src/index.ts": Buffer.from("main code"),
  "src/utils/helper.ts": Buffer.from("helper code"),
});

// Access raw archive data
const buffer = await rxa.buffer(); // tar.gz Buffer
const stream = rxa.stream; // ReadableStream<Uint8Array>
```

### `extract(rxa: RXA): Promise<Record<string, Buffer>>`

Extract files from an archive.

```typescript
import { archive, extract } from "@resourcexjs/core";

const rxa = await archive({
  "hello.txt": Buffer.from("Hello!"),
  "world.txt": Buffer.from("World!"),
});

const files = await extract(rxa);
// {
//   "hello.txt": Buffer<...>,
//   "world.txt": Buffer<...>
// }
```

### `wrap(buffer: Buffer): RXA`

Wrap an existing tar.gz buffer as an RXA. Useful for deserializing archives.

```typescript
import { wrap, extract } from "@resourcexjs/core";

// From storage or network
const tarGzBuffer = await fetchFromStorage();

const rxa = wrap(tarGzBuffer);
const files = await extract(rxa);
```

### `resource(rxm: RXM, rxa: RXA): RXR`

Create a complete resource from manifest and archive.

```typescript
import { define, manifest, archive, resource } from "@resourcexjs/core";

const rxd = define({ name: "hello", type: "text", tag: "1.0.0" });
const rxm = manifest(rxd);
const rxa = await archive({ content: Buffer.from("Hello!") });
const rxr = resource(rxm, rxa);
// {
//   identifier: { name: "hello", tag: "1.0.0" },
//   manifest: { name: "hello", type: "text", tag: "1.0.0" },
//   archive: RXA
// }
```

## Types

### RXD - Resource Definition

The content of `resource.json` file. Contains all metadata for a resource in development.

```typescript
interface RXD {
  readonly name: string; // Required
  readonly type: string; // Required
  readonly tag?: string; // Optional (defaults to "latest")
  readonly registry?: string;
  readonly path?: string;
  readonly description?: string;
  readonly author?: string;
  readonly license?: string;
  readonly keywords?: string[];
  readonly repository?: string;
  readonly [key: string]: unknown; // Additional fields allowed
}
```

### RXI - Resource Identifier

Structured identifier for a resource.

```typescript
interface RXI {
  readonly registry?: string; // e.g., "localhost:3098", "registry.example.com"
  readonly path?: string; // e.g., "org", "prompts"
  readonly name: string; // Resource name
  readonly tag: string; // Tag (defaults to "latest")
}
```

### RXL - Resource Locator

Unified locator string. Can be an RXI string, directory path, or URL.

```typescript
type RXL = string;
```

### RXM - Resource Manifest

Resource metadata stored within the resource.

```typescript
interface RXM {
  readonly registry?: string;
  readonly path?: string;
  readonly name: string;
  readonly type: string;
  readonly tag: string;
  readonly files?: string[]; // Package file structure
}
```

### RXA - Resource Archive

Archive container (tar.gz format) for storage and transfer.

```typescript
interface RXA {
  readonly stream: ReadableStream<Uint8Array>;
  buffer(): Promise<Buffer>;
}
```

### RXR - Resource

Complete resource object combining identifier, manifest, and archive.

```typescript
interface RXR {
  readonly identifier: RXI;
  readonly manifest: RXM;
  readonly archive: RXA;
}
```

## Error Handling

```typescript
import {
  ResourceXError,
  LocatorError,
  ManifestError,
  ContentError,
  DefinitionError,
} from "@resourcexjs/core";

try {
  parse("invalid@locator");
} catch (error) {
  if (error instanceof LocatorError) {
    console.error("Invalid locator format:", error.message);
    console.error("Locator:", error.locator);
  }
}

try {
  define({ name: "test" }); // Missing required 'type' field
} catch (error) {
  if (error instanceof DefinitionError) {
    console.error("Invalid definition:", error.message);
  }
}
```

### Error Hierarchy

```
ResourceXError (base)
├── LocatorError     - RXI parsing errors
├── ManifestError    - RXM validation errors
├── ContentError     - RXA operations errors
└── DefinitionError  - RXD validation errors
```

## Complete Example

```typescript
import { define, manifest, archive, resource, extract, format, parse } from "@resourcexjs/core";
import type { RXR } from "@resourcexjs/core";

// 1. Define resource metadata
const rxd = define({
  name: "assistant-prompt",
  type: "text",
  tag: "1.0.0",
  description: "A helpful AI assistant prompt",
  author: "Example Team",
});

// 2. Create manifest from definition
const rxm = manifest(rxd);

// 3. Create archive from files
const rxa = await archive({
  content: Buffer.from("You are a helpful AI assistant."),
});

// 4. Combine into complete resource
const rxr: RXR = resource(rxm, rxa);

// 5. Access locator string
const locatorStr = format(rxr.identifier);
console.log(locatorStr); // "assistant-prompt:1.0.0"

// 6. Extract files when needed
const files = await extract(rxr.archive);
console.log(files.content.toString()); // "You are a helpful AI assistant."
```

## Registry Layer

### CASRegistry

Content-addressable storage registry for managing resources.

```typescript
import { CASRegistry, MemoryRXAStore, MemoryRXMStore } from "@resourcexjs/core";

// Create with memory stores (for testing)
const cas = new CASRegistry(new MemoryRXAStore(), new MemoryRXMStore());

// Store a resource
await cas.put(rxr);

// Get a resource
const rxr = await cas.get(rxi);

// Check existence
const exists = await cas.has(rxi);

// Remove a resource
await cas.remove(rxi);

// List resources
const results = await cas.list({ query: "prompt", limit: 10 });

// Garbage collect orphaned blobs
await cas.gc();

// Clear cache by registry
await cas.clearCache("registry.example.com");
```

### Store Interfaces (SPI)

For implementing custom storage backends:

```typescript
import type { RXAStore, RXMStore, StoredRXM } from "@resourcexjs/core";

// Blob storage interface
interface RXAStore {
  get(digest: string): Promise<Buffer>;
  put(data: Buffer): Promise<string>; // Returns digest
  has(digest: string): Promise<boolean>;
  delete(digest: string): Promise<void>;
  list(): Promise<string[]>;
}

// Manifest storage interface
interface RXMStore {
  get(name: string, tag: string, registry?: string): Promise<StoredRXM | null>;
  put(manifest: StoredRXM): Promise<void>;
  has(name: string, tag: string, registry?: string): Promise<boolean>;
  delete(name: string, tag: string, registry?: string): Promise<void>;
  listTags(name: string, registry?: string): Promise<string[]>;
  search(options?: RXMSearchOptions): Promise<StoredRXM[]>;
  deleteByRegistry(registry: string): Promise<void>;
}
```

### Provider Interface (SPI)

For implementing platform-specific providers:

```typescript
import type { ResourceXProvider, ProviderConfig, ProviderStores } from "@resourcexjs/core";

interface ResourceXProvider {
  readonly platform: string;
  createStores(config: ProviderConfig): ProviderStores;
  createLoader?(config: ProviderConfig): ResourceLoader;
}

interface ProviderStores {
  rxaStore: RXAStore;
  rxmStore: RXMStore;
}
```

## Related Packages

| Package                                                                                | Description                   |
| -------------------------------------------------------------------------------------- | ----------------------------- |
| [resourcexjs](https://www.npmjs.com/package/resourcexjs)                               | Main client package           |
| [@resourcexjs/node-provider](https://www.npmjs.com/package/@resourcexjs/node-provider) | Node.js/Bun platform provider |
| [@resourcexjs/server](https://www.npmjs.com/package/@resourcexjs/server)               | Registry server               |
| [@resourcexjs/arp](https://www.npmjs.com/package/@resourcexjs/arp)                     | Low-level I/O protocol        |

## License

Apache-2.0
