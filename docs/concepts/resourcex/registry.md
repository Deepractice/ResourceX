# Registry

The Registry is the central hub for storing, retrieving, and managing resources. It provides a unified interface with multiple implementations for different storage backends.

## Registry Interface

```typescript
interface Registry {
  // Type support
  supportType(type: ResourceType): void;

  // Write operations
  link(resource: RXR): Promise<void>;
  pull(locator: string, options?: PullOptions): Promise<void>;
  publish(resource: RXR, options: PublishOptions): Promise<void>;

  // Read operations
  get(locator: string): Promise<RXR>;
  resolve<TArgs, TResult>(locator: string): Promise<ResolvedResource<TArgs, TResult>>;
  exists(locator: string): Promise<boolean>;
  search(options?: SearchOptions): Promise<RXL[]>;

  // Delete
  delete(locator: string): Promise<void>;
}
```

## Creating a Registry

### Local Registry (Default)

```typescript
import { createRegistry } from "resourcexjs";

// Default: uses ~/.resourcex
const registry = createRegistry();

// Custom path
const registry = createRegistry({ path: "./my-registry" });

// With custom types
const registry = createRegistry({
  types: [promptType, toolType],
});
```

### Git Registry

```typescript
const registry = createRegistry({
  type: "git",
  url: "git@github.com:Deepractice/Registry.git",
  domain: "deepractice.dev", // Required for security
});
```

### Remote Registry

```typescript
const registry = createRegistry({
  endpoint: "https://registry.deepractice.ai/v1",
});
```

## Operations

### link() - Store Resource Locally

Store a resource in the local registry for development or caching:

```typescript
const resource = {
  locator: parseRXL("localhost/my-tool.text@1.0.0"),
  manifest: createRXM({
    domain: "localhost",
    name: "my-tool",
    type: "text",
    version: "1.0.0",
  }),
  content: await createRXC({ content: "Tool content" }),
};

await registry.add(resource);
```

### get() - Retrieve Raw Resource

Get the raw RXR without resolving:

```typescript
const rxr = await registry.get("my-tool.text@1.0.0");

// Access raw data
console.log(rxr.manifest.version);
const files = await rxr.content.files();
```

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

### Local Registry

The local registry uses a two-directory structure:

```
~/.resourcex/
├── local/                              # Development resources
│   └── {name}.{type}/
│       └── {version}/
│           ├── manifest.json
│           └── content.tar.gz
│
└── cache/                              # Cached remote resources
    └── {domain}/
        └── {path}/
            └── {name}.{type}/
                └── {version}/
                    ├── manifest.json
                    └── content.tar.gz
```

**Example:**

```
~/.resourcex/
├── local/
│   ├── my-prompt.text/
│   │   └── 1.0.0/
│   │       ├── manifest.json
│   │       └── content.tar.gz
│   └── my-tool.binary/
│       └── 2.0.0/
│           ├── manifest.json
│           └── content.tar.gz
│
└── cache/
    └── deepractice.ai/
        └── prompts/
            └── nuwa.text/
                └── 1.0.0/
                    ├── manifest.json
                    └── content.tar.gz
```

### Git Registry

Git registries clone to a cache directory:

```
~/.resourcex/.git-cache/
└── github.com-Deepractice-Registry/
    └── .resourcex/
        └── {domain}/
            └── {path}/
                └── {name}.{type}/
                    └── {version}/
                        ├── manifest.json
                        └── content.tar.gz
```

## Resolution Flow

### Local Registry Resolution

```
registry.resolve("my-tool.text@1.0.0")
         │
         ├──► Check local/my-tool.text/1.0.0/
         │    Found? → Read and return
         │
         └──► Check cache/.../my-tool.text/1.0.0/
              Found? → Read and return
              Not found? → Throw RegistryError
```

### With Domain

```
registry.resolve("deepractice.ai/prompts/nuwa.text@1.0.0")
         │
         ├──► Check local/nuwa.text/1.0.0/
         │    Found? → Read and return
         │
         └──► Check cache/deepractice.ai/prompts/nuwa.text/1.0.0/
              Found? → Read and return
              Not found? → Throw RegistryError
```

**Key behavior:**

- Local always checked first (for development overrides)
- Domain in locator determines cache path
- No domain = local-only resource

## Registry Implementations

### LocalRegistry

File-system based, supports all operations:

```typescript
import { LocalRegistry } from "@resourcexjs/registry";

const registry = new LocalRegistry({
  path: "~/.resourcex",
});
```

**Capabilities:**

- link, get, resolve, exists, delete, search
- pull, publish (planned)

### GitRegistry

Git-based, read-only:

```typescript
import { GitRegistry } from "@resourcexjs/registry";

const registry = new GitRegistry({
  type: "git",
  url: "git@github.com:Deepractice/Registry.git",
  domain: "deepractice.dev",
});
```

**Capabilities:**

- get, resolve, exists, search
- Clones on first access
- `git fetch` on every access to stay current
- link, delete, pull, publish throw errors (read-only)

### RemoteRegistry

HTTP-based, read-only:

```typescript
import { RemoteRegistry } from "@resourcexjs/registry";

const registry = new RemoteRegistry({
  endpoint: "https://registry.deepractice.ai/v1",
});
```

**Capabilities:**

- get, resolve, exists, search (via HTTP API)
- link, delete, pull, publish throw errors (read-only)

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

## Security

### Domain Validation

Remote registries require domain binding to prevent impersonation:

```typescript
// Secure: domain explicitly bound
const registry = createRegistry({
  type: "git",
  url: "git@github.com:Deepractice/Registry.git",
  domain: "deepractice.dev", // Only resources with this domain allowed
});

// Local paths don't require domain (development use)
const devRegistry = createRegistry({
  type: "git",
  url: "./local-repo", // No domain needed
});
```

### Domain Middleware

Apply domain validation as middleware:

```typescript
import { withDomainValidation, GitRegistry } from "@resourcexjs/registry";

const baseRegistry = new GitRegistry({
  type: "git",
  url: "git@github.com:Deepractice/Registry.git",
});

const secureRegistry = withDomainValidation(baseRegistry, "deepractice.dev");
// Only resources with domain "deepractice.dev" will be returned
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

### Read-Only Registry

```typescript
const gitRegistry = createRegistry({
  type: "git",
  url: "...",
  domain: "example.com",
});

try {
  await gitRegistry.link(resource);
} catch (error) {
  console.log(error.message); // "GitRegistry is read-only"
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
  content: await createRXC({ content: "Dev content" }),
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
  content: await createRXC({
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
  LocalRegistry,
  RemoteRegistry,
  GitRegistry,
  discoverRegistry,
  RegistryError,
} from "@resourcexjs/registry";
// or
import { createRegistry, RegistryError } from "resourcexjs";

// Create registry
const registry: Registry = createRegistry(config?: RegistryConfig);

// Config types
interface LocalRegistryConfig {
  path?: string;              // Storage path
  types?: ResourceType[];     // Custom types
}

interface RemoteRegistryConfig {
  endpoint: string;           // HTTP endpoint
}

interface GitRegistryConfig {
  type: "git";
  url: string;                // Git URL
  ref?: string;               // Branch/tag (default: "main")
  basePath?: string;          // Path in repo (default: ".resourcex")
  domain?: string;            // Required for remote URLs
}

// Search options
interface SearchOptions {
  query?: string;             // Filter string
  limit?: number;             // Max results
  offset?: number;            // Skip count
}
```

## See Also

- [RXR - Complete Resource](./rxr-resource.md) - What gets stored in registry
- [Type System](./type-system.md) - How resources are serialized/resolved
- [Architecture Overview](../overview.md) - How registry fits in the system
