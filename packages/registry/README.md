# @resourcexjs/registry

Resource registry for ResourceX - storage and retrieval of resources.

## Installation

```bash
bun add @resourcexjs/registry
```

## Overview

The `@resourcexjs/registry` package provides a Maven-style registry for storing and resolving resources.

### Key Concepts

- **Registry**: Interface for resource storage and retrieval
- **DefaultRegistry**: Main implementation combining Storage with type handling
- **LocalStorage**: Filesystem-based storage for local resources
- **Storage**: Abstract interface for different storage backends
- **Well-known discovery**: Auto-discover registry endpoints via `/.well-known/resourcex`
- **Isolator**: Sandbox execution for resolver code

## Usage

### Create Registry

```typescript
import { createRegistry } from "@resourcexjs/registry";

// Default registry (uses LocalStorage at ~/.resourcex)
const registry = createRegistry();

// Custom local path
const registry2 = createRegistry({
  path: "./my-registry",
});

// With custom resource types
import { bundleResourceType } from "@resourcexjs/type";
const promptType = await bundleResourceType("./prompt.type.ts");

const registry3 = createRegistry({
  types: [promptType],
});

// With sandbox isolation
const registry4 = createRegistry({
  isolator: "srt", // "none" | "srt" | "cloudflare" | "e2b"
});

// With remote mirror
const registry5 = createRegistry({
  mirror: "https://registry.deepractice.ai/v1",
});

// Server mode with custom storage
import { LocalStorage } from "@resourcexjs/registry";

const registry6 = createRegistry({
  storage: new LocalStorage({ path: "./data" }),
});
```

### Add Resource

Add a resource to the registry:

```typescript
import { loadResource } from "@resourcexjs/loader";
import { createRegistry } from "@resourcexjs/registry";

// Load resource from folder
const rxr = await loadResource("./my-prompt");

// Add to registry
const registry = createRegistry();
await registry.add(rxr);

// Or add directly from path
await registry.add("./my-prompt");

// Now stored at: ~/.resourcex/local/my-prompt.text/1.0.0/
```

### Link Resource (Development)

Link creates a symlink for live development changes:

```typescript
const registry = createRegistry();

// Link directory - changes reflect immediately
await registry.link("./my-prompts/assistant");
```

### Resolve Resource

Retrieve and execute a resource:

```typescript
const registry = createRegistry();

// Resolve returns ResolvedResource with execute()
const resolved = await registry.resolve("localhost/my-prompt.text@1.0.0");

// Execute to get content
const text = await resolved.execute();
console.log(text);

// Check schema (for types with arguments)
console.log(resolved.schema); // undefined for text type
```

### Get Raw Resource

Get the RXR without resolving:

```typescript
const rxr = await registry.get("localhost/my-prompt.text@1.0.0");

console.log(rxr.manifest.name); // "my-prompt"
console.log(rxr.manifest.type); // "text"
```

### Check Existence

```typescript
if (await registry.exists("localhost/my-prompt.text@1.0.0")) {
  console.log("Resource exists");
}
```

### Delete Resource

```typescript
await registry.delete("localhost/my-prompt.text@1.0.0");
```

### Search Resources

```typescript
// List all resources
const all = await registry.search();

// Search by name
const results = await registry.search({ query: "assistant" });

// With pagination
const page = await registry.search({
  query: "prompt",
  limit: 10,
  offset: 20,
});
```

### Support Custom Types

```typescript
import { bundleResourceType } from "@resourcexjs/type";

const registry = createRegistry();

// Bundle and add type at runtime
const promptType = await bundleResourceType("./prompt.type.ts");
registry.supportType(promptType);

// Now can resolve prompt resources
const resolved = await registry.resolve("localhost/assistant.prompt@1.0.0");
```

## API Reference

### `createRegistry(config?)`

Create a new registry instance.

**Parameters:**

- `config?: ClientRegistryConfig | ServerRegistryConfig`

**Client mode (default):**

- `path?: string` - Local cache path (default: `~/.resourcex`)
- `mirror?: string` - Mirror URL for remote fetch
- `types?: BundledType[]` - Custom resource types
- `isolator?: IsolatorType` - Sandbox isolation level

**Server mode:**

- `storage: Storage` - Custom storage implementation
- `types?: BundledType[]` - Custom resource types
- `isolator?: IsolatorType` - Sandbox isolation level

**Returns**: `Registry`

```typescript
// Client mode
const registry = createRegistry({
  path: "~/.resourcex",
  mirror: "https://registry.deepractice.ai/v1",
  types: [promptType],
  isolator: "srt",
});

// Server mode
const registry = createRegistry({
  storage: new LocalStorage({ path: "./data" }),
  types: [promptType],
});
```

### `discoverRegistry(domain)`

Discover registry endpoints for a domain via well-known.

**Parameters:**

- `domain: string` - Domain to discover (e.g., "deepractice.ai")

**Returns**: `Promise<DiscoveryResult>`

```typescript
const result = await discoverRegistry("deepractice.ai");
// { domain: "deepractice.ai", registries: ["https://..."] }
```

### Registry Interface

#### `supportType(type: BundledType): void`

Add support for a custom resource type at runtime.

#### `link(path: string): Promise<void>`

Create a symlink for development. Changes in the source directory are immediately reflected.

#### `add(source: string | RXR): Promise<void>`

Add resource to storage. Accepts a folder path or RXR object.

#### `get(locator: string): Promise<RXR>`

Get raw RXR by locator without resolving.

#### `resolve<TArgs, TResult>(locator: string): Promise<ResolvedResource<TArgs, TResult>>`

Resolve resource and return structured result with execute function.

#### `exists(locator: string): Promise<boolean>`

Check if resource exists.

#### `delete(locator: string): Promise<void>`

Delete resource from storage.

#### `search(options?: SearchOptions): Promise<RXL[]>`

Search for resources.

- `query?: string` - Filter by locator substring
- `limit?: number` - Max results
- `offset?: number` - Skip first N results

### Storage Interface

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

Filesystem-based storage implementation.

```typescript
import { LocalStorage } from "@resourcexjs/registry";

const storage = new LocalStorage({
  path: "~/.resourcex", // optional, defaults to ~/.resourcex
});
```

## Storage Structure

Resources are stored in two areas:

```
~/.resourcex/
├── local/                              # Development resources
│   └── {name}.{type}/
│       └── {version}/
│           ├── manifest.json
│           └── archive.tar.gz
│
└── cache/                              # Remote cached resources
    └── {domain}/
        └── {path}/
            └── {name}.{type}/
                └── {version}/
                    ├── manifest.json
                    └── archive.tar.gz
```

### Resolution Order

1. **local/** is checked first (development resources)
2. **cache/** is checked second (remote cached resources)
3. If not found and domain is not localhost, fetches from remote

## Remote Fetch Flow

For non-localhost domains:

1. Check local storage (cache)
2. If mirror configured, try mirror first
3. Discover source via `https://{domain}/.well-known/resourcex`
4. Fetch from discovered endpoint
5. Cache to local storage

**Well-known format:**

```json
{
  "version": "1.0",
  "registries": ["https://registry.example.com/v1"]
}
```

## Middleware

### RegistryMiddleware

Base class for creating custom middleware:

```typescript
import { RegistryMiddleware } from "@resourcexjs/registry";

class LoggingMiddleware extends RegistryMiddleware {
  async get(locator: string) {
    console.log("Getting:", locator);
    return this.inner.get(locator);
  }
}
```

### DomainValidation

Built-in middleware for validating resource domains:

```typescript
import { withDomainValidation } from "@resourcexjs/registry";

const validatedRegistry = withDomainValidation(registry, "deepractice.ai");

// Throws if resource.manifest.domain !== "deepractice.ai"
await validatedRegistry.get("deepractice.ai/assistant.text@1.0.0");
```

## Isolator Types

Sandbox isolation for resolver execution:

| Type           | Description                | Latency |
| -------------- | -------------------------- | ------- |
| `"none"`       | No isolation (development) | ~10ms   |
| `"srt"`        | OS-level isolation         | ~50ms   |
| `"cloudflare"` | Container isolation        | ~100ms  |
| `"e2b"`        | MicroVM isolation          | ~150ms  |

```typescript
const registry = createRegistry({
  isolator: "srt",
});
```

## Error Handling

```typescript
import { RegistryError } from "@resourcexjs/registry";

try {
  const rxr = await registry.get("localhost/not-exist.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.error("Registry error:", error.message);
  }
}
```

### Common Errors

- `Resource not found: {locator}`
- `Unsupported resource type: {type}`
- `Well-known discovery failed for {domain}: {status}`
- `{storage} is read-only: {operation} not supported`

## Examples

### Complete Workflow

```typescript
import { loadResource } from "@resourcexjs/loader";
import { createRegistry } from "@resourcexjs/registry";

// 1. Create registry
const registry = createRegistry();

// 2. Load and add resource
const rxr = await loadResource("./my-prompts/assistant");
await registry.add(rxr);

// 3. Resolve and execute
const resolved = await registry.resolve("localhost/assistant.text@1.0.0");
const text = await resolved.execute();
console.log(text);
```

### With Custom Types

```typescript
import { createRegistry } from "@resourcexjs/registry";
import { bundleResourceType } from "@resourcexjs/type";

// Bundle custom type
const promptType = await bundleResourceType("./prompt.type.ts");

// Create registry with type
const registry = createRegistry({
  types: [promptType],
});

// Add and resolve
await registry.add("./my-prompt");
const resolved = await registry.resolve<void, string>("localhost/my-prompt.prompt@1.0.0");
const text = await resolved.execute();
```

## License

MIT
