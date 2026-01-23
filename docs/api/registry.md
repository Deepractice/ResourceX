# @resourcexjs/registry API Reference

The registry package provides resource storage and retrieval with support for local, remote (HTTP), and git-based registries.

## Installation

```bash
bun add @resourcexjs/registry
```

## createRegistry

Factory function to create a registry instance.

```typescript
function createRegistry(config?: RegistryConfig): Registry;
```

**Parameters:**

| Name     | Type                          | Description            |
| -------- | ----------------------------- | ---------------------- |
| `config` | `RegistryConfig \| undefined` | Registry configuration |

**Returns:** `Registry` - Registry instance

**Throws:** `RegistryError` if remote git URL is provided without domain

**Example:**

```typescript
import { createRegistry } from "@resourcexjs/registry";

// Local registry (default path: ~/.resourcex)
const local = createRegistry();

// Local registry with custom path
const customPath = createRegistry({ path: "./my-registry" });

// Remote registry (HTTP API)
const remote = createRegistry({
  endpoint: "https://registry.deepractice.ai/v1",
});

// Git registry (requires domain for security)
const git = createRegistry({
  type: "git",
  url: "git@github.com:Deepractice/Registry.git",
  domain: "deepractice.ai",
});
```

---

## Registry Interface

The main interface for resource operations.

```typescript
interface Registry {
  supportType(type: ResourceType): void;
  pull(locator: string, options?: PullOptions): Promise<void>;
  publish(resource: RXR, options: PublishOptions): Promise<void>;
  link(resource: RXR): Promise<void>;
  get(locator: string): Promise<RXR>;
  resolve<TArgs = void, TResult = unknown>(
    locator: string
  ): Promise<ResolvedResource<TArgs, TResult>>;
  exists(locator: string): Promise<boolean>;
  delete(locator: string): Promise<void>;
  search(options?: SearchOptions): Promise<RXL[]>;
}
```

### supportType

Register a custom resource type.

```typescript
supportType(type: ResourceType): void
```

**Parameters:**

| Name   | Type           | Description                     |
| ------ | -------------- | ------------------------------- |
| `type` | `ResourceType` | Custom resource type definition |

**Example:**

```typescript
import { createRegistry } from "@resourcexjs/registry";
import { myCustomType } from "./types";

const registry = createRegistry();
registry.supportType(myCustomType);
```

### link

Link a resource to the local registry for development or caching.

```typescript
link(resource: RXR): Promise<void>
```

**Parameters:**

| Name       | Type  | Description      |
| ---------- | ----- | ---------------- |
| `resource` | `RXR` | Resource to link |

**Example:**

```typescript
import { createRegistry } from "@resourcexjs/registry";
import { createRXM, createRXC, parseRXL } from "@resourcexjs/core";

const registry = createRegistry();

const manifest = createRXM({
  domain: "localhost",
  name: "hello",
  type: "text",
  version: "1.0.0",
});

const content = await createRXC({ content: "Hello, World!" });

await registry.link({
  locator: parseRXL(manifest.toLocator()),
  manifest,
  content,
});
```

### get

Get raw resource by locator without resolving.

```typescript
get(locator: string): Promise<RXR>
```

**Parameters:**

| Name      | Type     | Description             |
| --------- | -------- | ----------------------- |
| `locator` | `string` | Resource locator string |

**Returns:** `Promise<RXR>` - Raw resource object

**Throws:** `RegistryError` if resource not found

**Example:**

```typescript
const rxr = await registry.get("localhost/hello.text@1.0.0");
console.log(rxr.manifest.domain); // "localhost"

// Access raw content
const files = await rxr.content.files();
```

### resolve

Resolve resource and return a structured result with execute function.

```typescript
resolve<TArgs = void, TResult = unknown>(locator: string): Promise<ResolvedResource<TArgs, TResult>>
```

**Parameters:**

| Name      | Type     | Description             |
| --------- | -------- | ----------------------- |
| `locator` | `string` | Resource locator string |

**Returns:** `Promise<ResolvedResource<TArgs, TResult>>` - Resolved resource with execute function

**Throws:** `RegistryError` if resource not found

**Example:**

```typescript
// Resolve a text resource
const resolved = await registry.resolve<void, string>("localhost/hello.text@1.0.0");

// Access original resource
console.log(resolved.resource.manifest.name); // "hello"

// Execute to get content (lazy-loaded)
const text = await resolved.execute();
console.log(text); // "Hello, World!"

// Check schema (undefined for builtin types)
console.log(resolved.schema); // undefined
```

### exists

Check if a resource exists.

```typescript
exists(locator: string): Promise<boolean>
```

**Parameters:**

| Name      | Type     | Description             |
| --------- | -------- | ----------------------- |
| `locator` | `string` | Resource locator string |

**Returns:** `Promise<boolean>` - True if resource exists

**Example:**

```typescript
if (await registry.exists("localhost/hello.text@1.0.0")) {
  console.log("Resource found!");
}
```

### delete

Delete a resource from the local registry.

```typescript
delete(locator: string): Promise<void>
```

**Parameters:**

| Name      | Type     | Description             |
| --------- | -------- | ----------------------- |
| `locator` | `string` | Resource locator string |

**Example:**

```typescript
await registry.delete("localhost/hello.text@1.0.0");
```

### search

Search for resources matching options.

```typescript
search(options?: SearchOptions): Promise<RXL[]>
```

**Parameters:**

| Name      | Type                         | Description    |
| --------- | ---------------------------- | -------------- |
| `options` | `SearchOptions \| undefined` | Search options |

**Returns:** `Promise<RXL[]>` - Array of matching locators

**Example:**

```typescript
// Search all resources
const all = await registry.search();

// Search with query
const filtered = await registry.search({ query: "hello" });

// Search with pagination
const paginated = await registry.search({
  query: "text",
  limit: 10,
  offset: 0,
});

// Iterate results
for (const rxl of paginated) {
  console.log(rxl.toString());
}
```

### pull

Pull a resource from a remote registry to local cache.

```typescript
pull(locator: string, options?: PullOptions): Promise<void>
```

**Parameters:**

| Name      | Type                       | Description                            |
| --------- | -------------------------- | -------------------------------------- |
| `locator` | `string`                   | Resource locator (must include domain) |
| `options` | `PullOptions \| undefined` | Pull options                           |

**Note:** Not yet implemented. See issue #018.

### publish

Publish a resource to a remote registry.

```typescript
publish(resource: RXR, options: PublishOptions): Promise<void>
```

**Parameters:**

| Name       | Type             | Description                  |
| ---------- | ---------------- | ---------------------------- |
| `resource` | `RXR`            | Resource to publish          |
| `options`  | `PublishOptions` | Publish target configuration |

**Note:** Not yet implemented. See issue #018.

---

## SearchOptions

Options for the search method.

```typescript
interface SearchOptions {
  query?: string;
  limit?: number;
  offset?: number;
}
```

**Properties:**

| Property | Type                  | Description                            |
| -------- | --------------------- | -------------------------------------- |
| `query`  | `string \| undefined` | Filter by substring match on locator   |
| `limit`  | `number \| undefined` | Maximum results to return              |
| `offset` | `number \| undefined` | Number of results to skip (pagination) |

---

## Configuration Types

### LocalRegistryConfig

```typescript
interface LocalRegistryConfig {
  path?: string;
  types?: ResourceType[];
}
```

**Properties:**

| Property | Type                          | Description                            |
| -------- | ----------------------------- | -------------------------------------- |
| `path`   | `string \| undefined`         | Storage path (default: `~/.resourcex`) |
| `types`  | `ResourceType[] \| undefined` | Additional resource types to support   |

### RemoteRegistryConfig

```typescript
interface RemoteRegistryConfig {
  endpoint: string;
}
```

**Properties:**

| Property   | Type     | Description                  |
| ---------- | -------- | ---------------------------- |
| `endpoint` | `string` | Remote registry API endpoint |

### GitRegistryConfig

```typescript
interface GitRegistryConfig {
  type: "git";
  url: string;
  ref?: string;
  basePath?: string;
  domain?: string;
}
```

**Properties:**

| Property   | Type                  | Description                               |
| ---------- | --------------------- | ----------------------------------------- |
| `type`     | `"git"`               | Registry type identifier                  |
| `url`      | `string`              | Git repository URL (SSH format)           |
| `ref`      | `string \| undefined` | Git ref (branch/tag). Default: "main"     |
| `basePath` | `string \| undefined` | Base path in repo. Default: ".resourcex"  |
| `domain`   | `string \| undefined` | Trusted domain (required for remote URLs) |

---

## discoverRegistry

Discover registry for a domain using well-known endpoint.

```typescript
function discoverRegistry(domain: string): Promise<DiscoveryResult>;
```

**Parameters:**

| Name     | Type     | Description                                 |
| -------- | -------- | ------------------------------------------- |
| `domain` | `string` | Domain to discover (e.g., "deepractice.ai") |

**Returns:** `Promise<DiscoveryResult>` - Discovery result with registries

**Throws:** `RegistryError` if discovery fails

**Example:**

```typescript
import { discoverRegistry, createRegistry } from "@resourcexjs/registry";

// Discover registry for a domain
const discovery = await discoverRegistry("deepractice.ai");
console.log(discovery.domain); // "deepractice.ai"
console.log(discovery.registries); // ["git@github.com:Deepractice/Registry.git"]

// Create registry from discovery (auto-bound domain)
const registry = createRegistry({
  type: "git",
  url: discovery.registries[0],
  domain: discovery.domain,
});
```

### DiscoveryResult

```typescript
interface DiscoveryResult {
  domain: string;
  registries: string[];
}
```

**Properties:**

| Property     | Type       | Description              |
| ------------ | ---------- | ------------------------ |
| `domain`     | `string`   | Discovered domain        |
| `registries` | `string[]` | Authorized registry URLs |

### WellKnownResponse

The format of the well-known endpoint response.

```typescript
interface WellKnownResponse {
  version: string;
  registries: string[];
}
```

**Example well-known file (`https://example.com/.well-known/resourcex`):**

```json
{
  "version": "1.0",
  "registries": ["git@github.com:Example/Registry.git"]
}
```

---

## Registry Implementations

### LocalRegistry

Filesystem-based registry for local development and caching.

```typescript
class LocalRegistry implements Registry {
  constructor(config?: LocalRegistryConfig);
}
```

**Storage Structure:**

```
~/.resourcex/
├── local/                              # Development resources
│   └── {name}.{type}/
│       └── {version}/
│           ├── manifest.json
│           └── content.tar.gz
│
└── cache/                              # Remote cached resources
    └── {domain}/
        └── {path}/
            └── {name}.{type}/
                └── {version}/
                    ├── manifest.json
                    └── content.tar.gz
```

**Features:**

- Full read/write support
- Automatic local/cache path resolution
- Supports all registry operations

### RemoteRegistry

HTTP API-based registry for remote access.

```typescript
class RemoteRegistry implements Registry {
  constructor(config: RemoteRegistryConfig);
}
```

**Features:**

- Read-only operations (get, resolve, exists, search)
- HTTP API endpoints: `/resource`, `/content`, `/exists`, `/search`
- Throws `RegistryError` for write operations

**API Endpoints:**

| Endpoint                                 | Method | Description              |
| ---------------------------------------- | ------ | ------------------------ |
| `/resource?locator=...`                  | GET    | Get resource manifest    |
| `/content?locator=...`                   | GET    | Get resource content     |
| `/exists?locator=...`                    | GET    | Check resource existence |
| `/search?query=...&limit=...&offset=...` | GET    | Search resources         |

### GitRegistry

Git clone-based registry for repository-backed resources.

```typescript
class GitRegistry implements Registry {
  constructor(config: GitRegistryConfig);
}
```

**Features:**

- Read-only operations
- Auto-clones repository to `~/.resourcex/.git-cache/`
- Fetches updates on every access
- Supports main and master branches

**Security:**

- Remote URLs require `domain` parameter
- Domain validation middleware auto-applied when domain is set

---

## Middleware

### RegistryMiddleware

Base class for creating registry middleware.

```typescript
abstract class RegistryMiddleware implements Registry {
  constructor(inner: Registry);
}
```

**Example custom middleware:**

```typescript
import { RegistryMiddleware } from "@resourcexjs/registry";
import type { RXR } from "@resourcexjs/core";

class LoggingMiddleware extends RegistryMiddleware {
  override async get(locator: string): Promise<RXR> {
    console.log(`Getting: ${locator}`);
    return super.get(locator);
  }
}

const registry = new LoggingMiddleware(createRegistry());
```

### DomainValidation

Middleware that validates resource domains match the trusted domain.

```typescript
class DomainValidation extends RegistryMiddleware {
  constructor(inner: Registry, trustedDomain: string);
}
```

### withDomainValidation

Factory function to wrap a registry with domain validation.

```typescript
function withDomainValidation(registry: Registry, trustedDomain: string): Registry;
```

**Example:**

```typescript
import { createRegistry, withDomainValidation, GitRegistry } from "@resourcexjs/registry";

const gitRegistry = new GitRegistry({
  type: "git",
  url: "git@github.com:Deepractice/Registry.git",
});

// Wrap with domain validation
const secured = withDomainValidation(gitRegistry, "deepractice.ai");

// Resources with mismatched domains will throw RegistryError
```

---

## Type Guards

### isRemoteConfig

Check if config is for remote registry.

```typescript
function isRemoteConfig(config?: RegistryConfig): config is RemoteRegistryConfig;
```

### isGitConfig

Check if config is for git registry.

```typescript
function isGitConfig(config?: RegistryConfig): config is GitRegistryConfig;
```

---

## Errors

### RegistryError

Error class for registry operations.

```typescript
class RegistryError extends ResourceXError {
  constructor(message: string);
}
```

**Common error scenarios:**

```typescript
import { createRegistry, RegistryError } from "@resourcexjs/registry";

const registry = createRegistry();

try {
  await registry.get("nonexistent.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.error("Registry error:", error.message);
    // "Resource not found: nonexistent.text@1.0.0"
  }
}
```

---

## Complete Example

```typescript
import {
  createRegistry,
  discoverRegistry,
  LocalRegistry,
  RegistryError,
} from "@resourcexjs/registry";
import { parseRXL, createRXM, createRXC } from "@resourcexjs/core";

async function main() {
  // Create local registry
  const registry = createRegistry();

  // Create and link a resource
  const manifest = createRXM({
    domain: "localhost",
    name: "greeting",
    type: "text",
    version: "1.0.0",
  });

  const content = await createRXC({ content: "Hello, ResourceX!" });

  await registry.link({
    locator: parseRXL(manifest.toLocator()),
    manifest,
    content,
  });

  // Check existence
  const exists = await registry.exists("greeting.text@1.0.0");
  console.log("Exists:", exists); // true

  // Resolve and execute
  const resolved = await registry.resolve<void, string>("greeting.text@1.0.0");
  const text = await resolved.execute();
  console.log("Content:", text); // "Hello, ResourceX!"

  // Search resources
  const results = await registry.search({ query: "greeting" });
  console.log("Found:", results.length); // 1

  // Clean up
  await registry.delete("greeting.text@1.0.0");
}

main().catch(console.error);
```
