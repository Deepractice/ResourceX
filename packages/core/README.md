# @resourcexjs/core

Core data structures for ResourceX.

> **Note**: For most use cases, use the main [`resourcexjs`](https://www.npmjs.com/package/resourcexjs) package. This package is for advanced usage.

## Installation

```bash
npm install @resourcexjs/core
# or
bun add @resourcexjs/core
```

## What's Inside

Core building blocks - pure data structures:

- **RXL** (Locator) - Resource locator string parser
- **RXM** (Manifest) - Resource metadata
- **RXC** (Content) - Stream-based content
- **RXR** (Resource) - Complete resource type
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

**Minimal locator:**

```typescript
parseRXL("name.text@1.0.0");
// → domain: "localhost", path: undefined, name: "name", type: "text", version: "1.0.0"
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
  description: "Optional description", // optional
  tags: ["optional", "tags"], // optional
});

manifest.toLocator(); // → "deepractice.ai/sean/assistant.prompt@1.0.0"
manifest.toJSON(); // → plain object
```

**Required fields**: `name`, `type`, `version`

**Optional fields**: `domain` (default: "localhost"), `path`, `description`, `tags`

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

**Important**: Content can only be consumed once!

```typescript
const content = createRXC("Hello");
await content.text(); // ✅ "Hello"
await content.text(); // ❌ ContentError: already consumed
```

### RXR - Resource

Complete resource object (pure interface):

```typescript
import type { RXR } from "@resourcexjs/core";

interface RXR {
  locator: RXL;
  manifest: RXM;
  content: RXC;
}

// Create from literals
const rxr: RXR = { locator, manifest, content };
```

RXR is a pure DTO (Data Transfer Object) - no factory function needed.

## Error Handling

```typescript
import { ResourceXError, LocatorError, ManifestError, ContentError } from "@resourcexjs/core";

try {
  parseRXL("invalid-locator");
} catch (error) {
  if (error instanceof LocatorError) {
    console.error("Invalid locator format");
  }
}

try {
  createRXM({ name: "test" }); // Missing required fields
} catch (error) {
  if (error instanceof ManifestError) {
    console.error("Invalid manifest");
  }
}

try {
  await content.text();
  await content.text(); // Second consumption
} catch (error) {
  if (error instanceof ContentError) {
    console.error("Content already consumed");
  }
}
```

### Error Hierarchy

```
ResourceXError (base)
├── LocatorError
├── ManifestError
└── ContentError
```

## Examples

### Complete Resource Creation

```typescript
import { parseRXL, createRXM, createRXC } from "@resourcexjs/core";
import type { RXR } from "@resourcexjs/core";

// Create manifest
const manifest = createRXM({
  domain: "deepractice.ai",
  name: "assistant",
  type: "prompt",
  version: "1.0.0",
});

// Create locator from manifest
const locator = parseRXL(manifest.toLocator());

// Create content
const content = createRXC("You are a helpful assistant.");

// Assemble RXR
const rxr: RXR = {
  locator,
  manifest,
  content,
};
```

### Load Content from File

```typescript
import { loadRXC } from "@resourcexjs/core";

// Load from local file
const content = await loadRXC("./prompt.txt");
const text = await content.text();

// Load from URL
const remoteContent = await loadRXC("https://example.com/prompt.txt");
const remoteText = await remoteContent.text();
```

### Manifest Serialization

```typescript
const manifest = createRXM({
  name: "assistant",
  type: "prompt",
  version: "1.0.0",
});

// To JSON (for storage)
const json = manifest.toJSON();
/*
{
  "domain": "localhost",
  "name": "assistant",
  "type": "prompt",
  "version": "1.0.0"
}
*/

// To locator string
const locator = manifest.toLocator();
// "localhost/assistant.prompt@1.0.0"
```

## Related Packages

This package provides only data structures. For full functionality:

- **[@resourcexjs/type](../type)** - Type system and handlers
- **[@resourcexjs/loader](../loader)** - Resource loading
- **[@resourcexjs/registry](../registry)** - Storage and retrieval
- **[@resourcexjs/arp](../arp)** - Low-level I/O
- **[resourcexjs](../resourcex)** - Main package (all-in-one)

## Type Safety

All types are fully typed with TypeScript:

```typescript
import type { RXL, RXM, RXC, RXR } from "@resourcexjs/core";

const locator: RXL = parseRXL("...");
const manifest: RXM = createRXM({ ... });
const content: RXC = createRXC("...");
const resource: RXR = { locator, manifest, content };
```

## License

MIT
