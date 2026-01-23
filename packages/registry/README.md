# @resourcexjs/registry

Resource registry for ResourceX - storage and retrieval of resources.

## Installation

```bash
bun add @resourcexjs/registry
```

## Overview

The `@resourcexjs/registry` package provides a Maven-style registry for storing and resolving resources (local or remote).

### Key Concepts

- **Registry**: Interface for resource storage and retrieval
- **LocalRegistry**: Filesystem-based implementation for local storage
- **RemoteRegistry**: HTTP API-based implementation for remote access
- **Well-known discovery**: Auto-discover registry endpoint via `/.well-known/resourcex`
- **Maven-style**: Organized by `domain/path/name.type/version`

## Usage

### Create Registry

```typescript
import { createRegistry, discoverRegistry } from "@resourcexjs/registry";

// Local registry (default)
const registry = createRegistry();

// Local registry with custom path
const registry2 = createRegistry({
  path: "./my-registry",
});

// Local registry with extension types
import { promptType } from "@my-org/types";

const registry3 = createRegistry({
  path: "~/.resourcex",
  types: [promptType],
});

// Remote registry
const registry4 = createRegistry({
  endpoint: "https://registry.deepractice.ai/v1",
});

// Remote registry with well-known discovery
const endpoint = await discoverRegistry("deepractice.ai");
const registry5 = createRegistry({ endpoint });
```

### Link Resource

Link a resource to local registry for development or caching:

```typescript
import { loadResource } from "@resourcexjs/loader";
import { createRegistry } from "@resourcexjs/registry";

// Load resource from folder
const rxr = await loadResource("./my-prompt");

// Link to registry
const registry = createRegistry();
await registry.link(rxr);

// Now available at: ~/.resourcex/localhost/my-prompt.text@1.0.0/
```

### Resolve Resource

Retrieve a resource by its locator:

```typescript
const registry = createRegistry();

// Resolve by full locator
const rxr = await registry.resolve("localhost/my-prompt.text@1.0.0");

console.log(rxr.manifest.name); // "my-prompt"
console.log(await rxr.content.text()); // Content
```

### Check Existence

```typescript
const registry = createRegistry();

if (await registry.exists("localhost/my-prompt.text@1.0.0")) {
  console.log("Resource exists");
}
```

### Delete Resource

```typescript
const registry = createRegistry();

await registry.delete("localhost/my-prompt.text@1.0.0");
```

## API Reference

### `createRegistry(config?)`

Create a new registry instance.

**Parameters:**

- `config?: RegistryConfig`
  - `path?: string` - Storage path (default: `~/.resourcex`)
  - `types?: ResourceType[]` - Extension types to register globally

**Returns**: `Registry`

```typescript
const registry = createRegistry({
  path: "./custom-registry",
  types: [promptType, toolType],
});
```

### Registry Interface

#### `link(resource: RXR): Promise<void>`

Link a resource to local registry.

**Parameters:**

- `resource: RXR` - Complete resource object

```typescript
await registry.link(rxr);
```

#### `resolve(locator: string): Promise<RXR>`

Resolve a resource by locator.

**Parameters:**

- `locator: string` - Full resource locator

**Returns**: `Promise<RXR>`

**Throws**: `RegistryError` if resource not found

```typescript
const rxr = await registry.resolve("localhost/my-prompt.text@1.0.0");
```

#### `exists(locator: string): Promise<boolean>`

Check if resource exists in registry.

**Parameters:**

- `locator: string` - Full resource locator

**Returns**: `Promise<boolean>`

```typescript
if (await registry.exists("localhost/my-prompt.text@1.0.0")) {
  // Resource exists
}
```

#### `delete(locator: string): Promise<void>`

Delete resource from local registry.

**Parameters:**

- `locator: string` - Full resource locator

```typescript
await registry.delete("localhost/my-prompt.text@1.0.0");
```

#### `publish(resource: RXR): Promise<void>`

Publish resource to remote registry (TODO: not yet implemented).

#### `search(options?): Promise<RXL[]>`

Search for resources in local registry.

**Parameters:**

- `options?: SearchOptions`
  - `query?: string` - Filter by locator substring
  - `limit?: number` - Max results to return
  - `offset?: number` - Skip first N results

**Returns**: `Promise<RXL[]>` - Array of matching locators

```typescript
// Search by name
const results = await registry.search({ query: "assistant" });

// With pagination
const page = await registry.search({ query: "prompt", limit: 10, offset: 20 });

// List all resources
const all = await registry.search();
```

## Storage Structure

Resources are stored in Maven-style structure:

```
~/.resourcex/
└── {domain}/
    └── {path}/
        └── {name}.{type}/
            └── {version}/
                ├── manifest.json    # RXM metadata
                └── content.tar.gz   # RXC archive
```

### Example

For resource `deepractice.ai/prompts/assistant.prompt@1.0.0`:

```
~/.resourcex/
└── deepractice.ai/
    └── prompts/
        └── assistant.prompt/
            └── 1.0.0/
                ├── manifest.json
                └── content.tar.gz
```

**manifest.json:**

```json
{
  "domain": "deepractice.ai",
  "path": "prompts",
  "name": "assistant",
  "type": "prompt",
  "version": "1.0.0"
}
```

**content.tar.gz:** Archive containing resource files (managed by TypeHandlerChain)

## Extension Types

Register extension types globally when creating registry:

```typescript
import { createRegistry } from "@resourcexjs/registry";
import type { ResourceType } from "@resourcexjs/type";

const promptType: ResourceType<string> = {
  name: "prompt",
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

// Register when creating registry
const registry = createRegistry({
  types: [promptType],
});

// Now can link/resolve prompt resources
```

## Error Handling

```typescript
import { RegistryError } from "@resourcexjs/registry";

try {
  const rxr = await registry.resolve("localhost/not-exist.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.error("Registry error:", error.message);
    // "Resource not found: localhost/not-exist.text@1.0.0"
  }
}
```

### Common Errors

**Resource not found:**

```
RegistryError: Resource not found: localhost/my-prompt.text@1.0.0
```

**Unsupported type:**

```
RegistryError: Unsupported resource type 'unknown'
```

## Examples

### Complete Workflow

```typescript
import { loadResource } from "@resourcexjs/loader";
import { createRegistry } from "@resourcexjs/registry";

// 1. Load resource from folder
const rxr = await loadResource("./my-prompts/assistant");

// 2. Create registry
const registry = createRegistry();

// 3. Link to local registry
await registry.link(rxr);

// 4. Resolve later
const resolved = await registry.resolve("localhost/assistant.prompt@1.0.0");

// 5. Use content
const text = await resolved.content.text();
console.log(text);
```

### Versioning

```typescript
const registry = createRegistry();

// Link multiple versions
await registry.link(promptV1); // v1.0.0
await registry.link(promptV2); // v2.0.0
await registry.link(promptV3); // v3.0.0

// Resolve specific version
const v1 = await registry.resolve("localhost/prompt.text@1.0.0");
const v2 = await registry.resolve("localhost/prompt.text@2.0.0");
const latest = await registry.resolve("localhost/prompt.text@3.0.0");
```

### Custom Storage Path

```typescript
// Project-local registry
const registry = createRegistry({
  path: "./project-registry",
});

await registry.link(rxr);
// Stored at: ./project-registry/localhost/...
```

### With Custom Types

```typescript
import { promptType, toolType, agentType } from "@my-org/ai-types";

const registry = createRegistry({
  types: [promptType, toolType, agentType],
});

// Now can handle these custom types
await registry.link(promptResource);
await registry.link(toolResource);
await registry.link(agentResource);
```

## Resolution Strategy

### LocalRegistry

1. **Check local filesystem** (`~/.resourcex` or custom path)
2. **If not found**: Throw RegistryError
3. **Return** RXR

### RemoteRegistry

1. **Fetch from HTTP API** (`GET /resource` + `GET /content`)
2. **Return** RXR (no local caching)

### Future: Hybrid Strategy (TODO)

1. Check local cache first
2. If not found, fetch from remote based on domain
3. Cache locally
4. Return RXR

## Architecture

```
┌─────────────────────────────────────────┐
│         Registry Interface              │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼──────────┐  ┌──▼──────────────┐
│LocalRegistry │  │RemoteRegistry   │
│(filesystem)  │  │(HTTP API)       │
└───┬──────────┘  └──┬──────────────┘
    │                │
┌───▼───────┐    ┌──▼──────┐
│ Node.js   │    │ fetch   │
│ fs module │    │         │
└───────────┘    └─────────┘
     │                │
┌────▼────────────────▼─────┐
│   TypeHandlerChain        │
│  (serialization logic)    │
└───────────────────────────┘
```

## Type Safety

All operations are fully typed:

```typescript
import type { RXR, Registry } from "@resourcexjs/registry";

const registry: Registry = createRegistry();
const rxr: RXR = await registry.resolve("localhost/test.text@1.0.0");
```

## License

MIT
