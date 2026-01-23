# RXR - Complete Resource

RXR (ResourceX Resource) is the complete resource object that combines a locator, manifest, and content. It's designed as a pure DTO (Data Transfer Object) - a simple data structure with no behavior.

## Interface

```typescript
interface RXR {
  locator: RXL; // Where to find it
  manifest: RXM; // What it is
  content: RXC; // What it contains
}
```

## Creating Resources

RXR is a plain interface, not a class. Create it by assembling the three components:

```typescript
import { parseRXL, createRXM, createRXC } from "resourcexjs";

// 1. Create manifest (the source of truth)
const manifest = createRXM({
  domain: "deepractice.ai",
  name: "greeting",
  type: "text",
  version: "1.0.0",
});

// 2. Create content
const content = await createRXC({ content: "Hello, World!" });

// 3. Parse locator from manifest
const locator = parseRXL(manifest.toLocator());

// 4. Assemble RXR
const rxr: RXR = { locator, manifest, content };
```

### Helper Pattern

A common pattern is to create a helper function:

```typescript
async function createResource(
  data: {
    domain: string;
    path?: string;
    name: string;
    type: string;
    version: string;
  },
  files: Record<string, string | Buffer>
): Promise<RXR> {
  const manifest = createRXM(data);
  const content = await createRXC(files);
  const locator = parseRXL(manifest.toLocator());

  return { locator, manifest, content };
}

// Usage
const rxr = await createResource(
  {
    domain: "localhost",
    name: "my-tool",
    type: "text",
    version: "1.0.0",
  },
  { content: "Tool content here" }
);
```

## Using Resources

### Storing in Registry

```typescript
import { createRegistry } from "resourcexjs";

const registry = createRegistry();

// Store the resource
await registry.link(rxr);
```

### Retrieving from Registry

```typescript
// Get raw RXR (without resolving)
const rxr = await registry.get("localhost/my-tool.text@1.0.0");

// Access components
console.log(rxr.manifest.name); // "my-tool"
console.log(rxr.manifest.version); // "1.0.0"

// Read content directly
const files = await rxr.content.files();
```

### Resolving for Execution

```typescript
// Resolve to get executable result
const resolved = await registry.resolve("localhost/my-tool.text@1.0.0");

// Execute to get content
const text = await resolved.execute();
```

## Design Decisions

### Why a Pure DTO?

RXR is intentionally a simple interface, not a class:

1. **No hidden state**: What you see is what you get
2. **Easy to serialize**: Can be JSON.stringify'd (except content buffer)
3. **Framework agnostic**: No dependencies on specific implementations
4. **Easy to test**: Create test RXRs with object literals

```typescript
// Test doubles are trivial
const mockRXR: RXR = {
  locator: parseRXL("test.text@1.0.0"),
  manifest: createRXM({
    domain: "localhost",
    name: "test",
    type: "text",
    version: "1.0.0",
  }),
  content: await createRXC({ content: "test content" }),
};
```

### Why Three Separate Components?

Each component serves a distinct purpose:

| Component    | Purpose    | Lifecycle                         |
| ------------ | ---------- | --------------------------------- |
| **Locator**  | Addressing | Parse from string, use in queries |
| **Manifest** | Identity   | Created once, stored as JSON      |
| **Content**  | Data       | Created once, stored as tar.gz    |

This separation allows:

- Resolving resources without loading content
- Caching manifests separately from content
- Querying by locator without full data

### Why Locator and Manifest Redundancy?

You might notice that RXL and RXM contain similar fields. This is intentional:

- **Locator**: May be partial (query: "find any version")
- **Manifest**: Always complete (identity: "this exact resource")

```typescript
// Query with partial locator
const rxl = parseRXL("my-prompt.text"); // No version

// Manifest is always complete
const manifest = rxr.manifest;
console.log(manifest.version); // "1.0.0" - always present
```

## Component Relationships

```
RXR
├── locator: RXL
│   └── toString() → "domain/path/name.type@version"
│
├── manifest: RXM
│   ├── toLocator() → same as locator.toString()
│   └── toJSON() → { domain, path, name, type, version }
│
└── content: RXC
    ├── file(path) → Buffer
    ├── files() → Map<string, Buffer>
    ├── buffer() → tar.gz Buffer
    └── stream → ReadableStream
```

## Common Patterns

### Creating for Local Development

```typescript
const devResource = {
  locator: parseRXL("my-prompt.text@0.1.0"),
  manifest: createRXM({
    domain: "localhost",
    name: "my-prompt",
    type: "text",
    version: "0.1.0",
  }),
  content: await createRXC({ content: "Development prompt" }),
};

await registry.link(devResource);
```

### Creating Multi-File Resource

```typescript
const multiFileResource = {
  locator: parseRXL("localhost/my-app.binary@1.0.0"),
  manifest: createRXM({
    domain: "localhost",
    name: "my-app",
    type: "binary",
    version: "1.0.0",
  }),
  content: await createRXC({
    "main.js": "console.log('Hello');",
    "config.json": '{"debug": true}',
    "assets/logo.png": logoPngBuffer,
  }),
};
```

### Cloning with Different Version

```typescript
const v1 = await registry.get("my-tool.text@1.0.0");

// Create v2 with same content but new version
const v2: RXR = {
  locator: parseRXL("my-tool.text@2.0.0"),
  manifest: createRXM({
    ...v1.manifest.toJSON(),
    version: "2.0.0",
  }),
  content: v1.content, // Reuse content
};

await registry.link(v2);
```

## RXR vs ResolvedResource

Don't confuse RXR with ResolvedResource:

| Aspect   | RXR              | ResolvedResource     |
| -------- | ---------------- | -------------------- |
| Purpose  | Store/transfer   | Execute              |
| Content  | Raw archive      | Callable function    |
| Creation | Manual assembly  | `registry.resolve()` |
| Use case | Storage, caching | Running resources    |

```typescript
// RXR: Data container
const rxr = await registry.get("my-tool.text@1.0.0");
// Access raw content
const buffer = await rxr.content.file("content");

// ResolvedResource: Executable wrapper
const resolved = await registry.resolve("my-tool.text@1.0.0");
// Execute to get processed content
const result = await resolved.execute();
```

## API Reference

```typescript
import type { RXR } from "@resourcexjs/core";
// or
import type { RXR } from "resourcexjs";

// RXR is just an interface - create by assembling components
const rxr: RXR = {
  locator: RXL,
  manifest: RXM,
  content: RXC,
};
```

## See Also

- [RXL - Resource Locator](./rxl-locator.md) - The addressing component
- [RXM - Resource Manifest](./rxm-manifest.md) - The metadata component
- [RXC - Resource Content](./rxc-content.md) - The content component
- [Registry](./registry.md) - Where resources are stored and retrieved
- [Type System](./type-system.md) - How RXR is resolved to executable form
