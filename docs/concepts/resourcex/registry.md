# Registry

The Registry is the central hub for storing, retrieving, and managing resources. It provides a unified interface that combines storage operations with type resolution.

## Registry Interface

```typescript
interface Registry {
  // Type support
  supportType(type: BundledType): void;

  // Write operations
  link(path: string): Promise<void>; // Symlink dev directory
  add(source: string | RXR): Promise<void>; // Copy to local storage

  // Read operations
  get(locator: string): Promise<RXR>; // Raw resource
  resolve<TArgs, TResult>(locator: string): Promise<ResolvedResource<TArgs, TResult>>;
  exists(locator: string): Promise<boolean>;
  search(options?: SearchOptions): Promise<RXL[]>;

  // Delete
  delete(locator: string): Promise<void>;
}
```

## Creating a Registry

### Client Mode (Default)

Uses local filesystem storage with optional remote fetch:

```typescript
import { createRegistry } from "resourcexjs";

// Default: uses ~/.resourcex
const registry = createRegistry();

// Custom local path
const registry = createRegistry({ path: "./my-registry" });

// With custom types
const registry = createRegistry({
  types: [promptType, toolType],
});

// With mirror for remote fetch
const registry = createRegistry({
  mirror: "https://registry.deepractice.ai/v1",
});

// With sandbox isolation
const registry = createRegistry({
  isolator: "srt", // or "none", "cloudflare", "e2b"
});
```

### Server Mode

Uses custom storage implementation:

```typescript
import { createRegistry, LocalStorage } from "resourcexjs";

const registry = createRegistry({
  storage: new LocalStorage({ path: "./data" }),
  types: [promptType],
  isolator: "cloudflare",
});
```

## Operations

### link() - Symlink Development Directory

Create a symlink to a development directory so changes are reflected immediately:

```typescript
// Directory must contain resource.json with manifest info
await registry.link("./my-resource");
```

### add() - Copy Resource to Storage

Copy a resource to local storage:

```typescript
// From directory path
await registry.add("./my-resource");

// From RXR object
const resource = {
  locator: parseRXL("localhost/my-tool.text@1.0.0"),
  manifest: createRXM({
    domain: "localhost",
    name: "my-tool",
    type: "text",
    version: "1.0.0",
  }),
  archive: await createRXA({ content: "Tool content" }),
};

await registry.add(resource);
```

### get() - Retrieve Raw Resource

Get the raw RXR without resolving. For non-localhost domains, fetches from remote if not cached locally:

```typescript
const rxr = await registry.get("my-tool.text@1.0.0");

// Access raw data
console.log(rxr.manifest.version);
const pkg = await rxr.archive.extract();
const files = await pkg.files();
```

**Resolution flow:**

1. Check local storage first
2. For `localhost` domain: local only, never fetch remote
3. For other domains: try mirror (if configured) -> well-known discovery

### resolve() - Get Executable Resource

Get a resolved resource ready for execution:

```typescript
const resolved = await registry.resolve("my-tool.text@1.0.0");

// Execute
const result = await resolved.execute();

// Access schema (for custom types with args)
if (resolved.schema) {
  console.log(resolved.schema);
}

// Access original resource
console.log(resolved.resource.manifest.name);
```

### exists() - Check Existence

```typescript
const exists = await registry.exists("my-tool.text@1.0.0");
console.log(exists); // true or false
```

### delete() - Remove Resource

```typescript
await registry.delete("my-tool.text@1.0.0");
```

### search() - Find Resources

```typescript
// All resources
const all = await registry.search();

// With query
const results = await registry.search({ query: "prompt" });

// With pagination
const page = await registry.search({
  query: "tool",
  limit: 10,
  offset: 20,
});
```

### supportType() - Add Custom Type

```typescript
registry.supportType({
  name: "prompt",
  description: "AI prompt template",
  serializer: promptSerializer,
  resolver: promptResolver,
});
```

## Storage Structure

LocalStorage uses a flat structure based on domain, path, name, type, and version:

```
~/.resourcex/
└── {domain}/
    └── {path}/
        └── {name}.{type}/
            └── {version}/
                ├── manifest.json
                └── archive.tar.gz
```

**Examples:**

```
~/.resourcex/
├── localhost/
│   ├── my-prompt.text/
│   │   └── 1.0.0/
│   │       ├── manifest.json
│   │       └── archive.tar.gz
│   └── my-tool.binary/
│       └── 2.0.0/
│           ├── manifest.json
│           └── archive.tar.gz
│
└── deepractice.ai/
    └── prompts/
        └── nuwa.text/
            └── 1.0.0/
                ├── manifest.json
                └── archive.tar.gz
```

For linked development directories, a symlink is created instead of the version directory.

## Resolution Flow

```
registry.get("deepractice.ai/prompts/nuwa.text@1.0.0")
         │
         ├──► Check local storage
         │    Found? → Return RXR
         │
         ├──► localhost domain?
         │    Yes → Throw "Resource not found"
         │
         ├──► Try mirror (if configured)
         │    Found? → Cache locally → Return RXR
         │
         └──► Discover via well-known
              GET https://deepractice.ai/.well-known/resourcex
              → Get registry endpoint
              → Fetch from endpoint
              → Cache locally → Return RXR
```

**Key behavior:**

- Local storage always checked first
- `localhost` domain: local only, never fetch remote
- Other domains: mirror (if configured) -> well-known discovery
- Remote resources are cached locally after first fetch

## Storage Interface

The Registry uses a Storage interface for persistence:

```typescript
interface Storage {
  readonly type: string;
  get(locator: string): Promise<RXR>;
  put(rxr: RXR): Promise<void>;
  exists(locator: string): Promise<boolean>;
  delete(locator: string): Promise<void>;
  search(options?: SearchOptions): Promise<RXL[]>;
}
```

### LocalStorage

Filesystem-based storage using ARP for I/O:

```typescript
import { LocalStorage } from "@resourcexjs/registry";

const storage = new LocalStorage({
  path: "~/.resourcex",
});
```

**Features:**

- Uses ARP file transport for I/O operations
- Supports symlinks for development directories
- Scans recursively for search operations

## Well-Known Discovery

Discover registry for a domain via well-known URL:

```typescript
import { discoverRegistry } from "@resourcexjs/registry";

const result = await discoverRegistry("deepractice.dev");
// {
//   domain: "deepractice.dev",
//   registries: ["git@github.com:Deepractice/Registry.git"]
// }
```

**Well-known format:**

```json
// https://deepractice.dev/.well-known/resourcex
{
  "version": "1.0",
  "registries": ["git@github.com:Deepractice/Registry.git"]
}
```

## Isolation Levels

Registry supports configurable sandbox isolation for resolver execution:

```typescript
// No isolation (fastest, for development)
const registry = createRegistry({ isolator: "none" });

// OS-level isolation (secure local dev)
const registry = createRegistry({ isolator: "srt" });

// Container isolation (edge/Docker)
const registry = createRegistry({ isolator: "cloudflare" });

// MicroVM isolation (production, planned)
const registry = createRegistry({ isolator: "e2b" });
```

## Error Handling

### Resource Not Found

```typescript
import { RegistryError } from "@resourcexjs/registry";

try {
  await registry.resolve("not-found.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.log(error.message); // "Resource not found: not-found.text@1.0.0"
  }
}
```

### Unsupported Type

```typescript
import { ResourceTypeError } from "@resourcexjs/type";

try {
  await registry.add(resourceWithUnknownType);
} catch (error) {
  if (error instanceof ResourceTypeError) {
    console.log(error.message); // "Unsupported resource type: unknown"
  }
}
```

### Storage Doesn't Support Operation

```typescript
// link() is only supported by LocalStorage
try {
  await registry.link("./my-resource");
} catch (error) {
  console.log(error.message); // "storage does not support link"
}
```

## Common Patterns

### Development Workflow

```typescript
// Create local registry
const registry = createRegistry();

// Create and link during development
const resource = {
  locator: parseRXL("my-prompt.text@1.0.0"),
  manifest: createRXM({
    domain: "localhost",
    name: "my-prompt",
    type: "text",
    version: "1.0.0",
  }),
  archive: await createRXA({ content: "Dev content" }),
};

await registry.add(resource);

// Test resolution
const resolved = await registry.resolve("my-prompt.text@1.0.0");
const text = await resolved.execute();
```

### Custom Types

```typescript
// Create registry with custom types
const registry = createRegistry({
  types: [promptType],
});

// Or add later
registry.supportType(toolType);

// Link resource of custom type
const promptResource = {
  locator: parseRXL("localhost/greeting.prompt@1.0.0"),
  manifest: createRXM({
    domain: "localhost",
    name: "greeting",
    type: "prompt",
    version: "1.0.0",
  }),
  archive: await createRXA({
    "template.txt": "Hello, {{name}}!",
    "schema.json": '{"type":"object","properties":{"name":{"type":"string"}}}',
  }),
};

await registry.add(promptResource);
```

### Search and Filter

```typescript
// Find all prompts
const prompts = await registry.search({ query: "prompt" });

// Paginate results
let offset = 0;
const pageSize = 10;

while (true) {
  const page = await registry.search({
    limit: pageSize,
    offset,
  });

  if (page.length === 0) break;

  for (const rxl of page) {
    console.log(rxl.toString());
  }

  offset += pageSize;
}
```

## API Reference

```typescript
import {
  createRegistry,
  LocalStorage,
  RegistryError,
} from "@resourcexjs/registry";
// or
import { createRegistry, RegistryError } from "resourcexjs";

// Create registry (client mode)
const registry = createRegistry({
  path?: string;              // Storage path (default: ~/.resourcex)
  mirror?: string;            // Mirror URL for remote fetch
  types?: BundledType[];      // Custom types
  isolator?: IsolatorType;    // Sandbox isolation level
});

// Create registry (server mode)
const registry = createRegistry({
  storage: Storage;           // Custom storage implementation
  types?: BundledType[];      // Custom types
  isolator?: IsolatorType;    // Sandbox isolation level
});

// Search options
interface SearchOptions {
  query?: string;             // Filter string
  limit?: number;             // Max results
  offset?: number;            // Skip count
}

// Isolator types
type IsolatorType = "none" | "srt" | "cloudflare" | "e2b";
```

## See Also

- [RXR - Complete Resource](./rxr-resource.md) - What gets stored in registry
- [Type System](./type-system.md) - How resources are serialized/resolved
- [Architecture Overview](../overview.md) - How registry fits in the system
