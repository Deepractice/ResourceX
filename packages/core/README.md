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

Archive-based content (internally tar.gz), supports single or multi-file resources:

```typescript
import { createRXC } from "@resourcexjs/core";

// Single file
const content = await createRXC({ content: "Hello, World!" });

// Multiple files
const content = await createRXC({
  "index.ts": "export default 1",
  "styles.css": "body {}",
});

// Nested directories
const content = await createRXC({
  "src/index.ts": "main code",
  "src/utils/helper.ts": "helper code",
});

// From existing tar.gz archive (for deserialization)
const content = await createRXC({ archive: tarGzBuffer });

// Read files
const buffer = await content.file("content"); // → Buffer
const buffer = await content.file("src/index.ts"); // → Buffer
const files = await content.files(); // → Map<string, Buffer>
const archiveBuffer = await content.buffer(); // → raw tar.gz Buffer
const stream = content.stream; // → ReadableStream (tar.gz)
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

// Create content (single file)
const content = await createRXC({ content: "You are a helpful assistant." });

// Assemble RXR
const rxr: RXR = {
  locator,
  manifest,
  content,
};
```

### Multi-file Resource

```typescript
import { createRXC } from "@resourcexjs/core";

// Create multi-file content
const content = await createRXC({
  "prompt.md": "# System Prompt\nYou are...",
  "config.json": '{"temperature": 0.7}',
});

// Read individual files
const promptBuffer = await content.file("prompt.md");
const configBuffer = await content.file("config.json");

// Read all files
const allFiles = await content.files();
for (const [path, buffer] of allFiles) {
  console.log(path, buffer.toString());
}
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
