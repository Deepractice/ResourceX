# @resourcexjs/registry API Reference

The registry package provides resource storage and retrieval with support for local storage, remote fetch via HTTP, and well-known discovery.

## Installation

```bash
bun add @resourcexjs/registry
```

## createRegistry

Factory function to create a registry instance.

```typescript
function createRegistry(config?: CreateRegistryConfig): Registry;
```

**Parameters:**

| Name     | Type                                | Description            |
| -------- | ----------------------------------- | ---------------------- |
| `config` | `CreateRegistryConfig \| undefined` | Registry configuration |

**Returns:** `Registry` - Registry instance

**Example:**

```typescript
import { createRegistry } from "@resourcexjs/registry";

// Default: local storage at ~/.resourcex
const registry = createRegistry();

// With custom local path
const customPath = createRegistry({ path: "./my-registry" });

// With mirror for faster remote fetch
const withMirror = createRegistry({
  mirror: "https://mirror.example.com/v1",
});

// With custom resource types
const withTypes = createRegistry({
  types: [myCustomType],
});

// With isolator for sandbox execution
const withIsolator = createRegistry({
  isolator: "srt", // or "none", "cloudflare", "e2b"
});

// Server mode: custom storage
import { LocalStorage } from "@resourcexjs/registry";

const serverRegistry = createRegistry({
  storage: new LocalStorage({ path: "./server-data" }),
});
```

---

## Registry Interface

The main interface for resource operations.

```typescript
interface Registry {
  supportType(type: BundledType): void;
  link(path: string): Promise<void>;
  add(source: string | RXR): Promise<void>;
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
supportType(type: BundledType): void
```

**Parameters:**

| Name   | Type          | Description                     |
| ------ | ------------- | ------------------------------- |
| `type` | `BundledType` | Custom resource type definition |

**Example:**

```typescript
import { createRegistry, bundleResourceType } from "@resourcexjs/registry";

const registry = createRegistry();
const promptType = await bundleResourceType("./prompt.type.ts");
registry.supportType(promptType);
```

### link

Create a symlink to a development directory. Changes in the source directory are immediately reflected when resolving.

```typescript
link(path: string): Promise<void>
```

**Parameters:**

| Name   | Type     | Description                                          |
| ------ | -------- | ---------------------------------------------------- |
| `path` | `string` | Path to resource directory (must have resource.json) |

**Throws:** `RegistryError` if storage does not support link

**Example:**

```typescript
const registry = createRegistry();

// Link development directory - changes reflect immediately
await registry.link("./my-prompt");

// Now you can resolve it
const resolved = await registry.resolve("localhost/my-prompt.text@1.0.0");
```

### add

Add a resource to the storage by copying its content.

```typescript
add(source: string | RXR): Promise<void>
```

**Parameters:**

| Name     | Type            | Description                           |
| -------- | --------------- | ------------------------------------- |
| `source` | `string \| RXR` | Resource directory path or RXR object |

**Throws:** `ResourceTypeError` if resource type is not supported

**Example:**

```typescript
import { createRegistry, createRXM, createRXA, parseRXL } from "@resourcexjs/registry";

const registry = createRegistry();

// Add from directory path
await registry.add("./my-prompt");

// Or add from RXR object
const manifest = createRXM({
  domain: "localhost",
  name: "hello",
  type: "text",
  version: "1.0.0",
});
const archive = await createRXA({ content: "Hello, World!" });

await registry.add({
  locator: parseRXL(manifest.toLocator()),
  manifest,
  archive,
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

**Behavior:**

- For `localhost` domain: Only checks local storage
- For other domains: Checks local storage first, then fetches from remote if not found

**Example:**

```typescript
const rxr = await registry.get("localhost/hello.text@1.0.0");
console.log(rxr.manifest.domain); // "localhost"

// Access raw content
const pkg = await rxr.archive.extract();
const files = await pkg.files();
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

Check if a resource exists in local storage.

```typescript
exists(locator: string): Promise<boolean>
```

**Parameters:**

| Name      | Type     | Description             |
| --------- | -------- | ----------------------- |
| `locator` | `string` | Resource locator string |

**Returns:** `Promise<boolean>` - True if resource exists in local storage

**Note:** For non-localhost domains, this only checks local cache. Use `get()` to trigger remote fetch.

**Example:**

```typescript
if (await registry.exists("localhost/hello.text@1.0.0")) {
  console.log("Resource found!");
}
```

### delete

Delete a resource from the local storage.

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

**Note:** Search only works on local storage.

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

### ClientRegistryConfig

Configuration for client mode (default).

```typescript
interface ClientRegistryConfig {
  path?: string;
  mirror?: string;
  types?: BundledType[];
  isolator?: IsolatorType;
}
```

**Properties:**

| Property   | Type                         | Description                                |
| ---------- | ---------------------------- | ------------------------------------------ |
| `path`     | `string \| undefined`        | Local cache path (default: `~/.resourcex`) |
| `mirror`   | `string \| undefined`        | Mirror URL for faster remote fetch         |
| `types`    | `BundledType[] \| undefined` | Additional resource types to support       |
| `isolator` | `IsolatorType \| undefined`  | Sandbox isolation level (default: "none")  |

### ServerRegistryConfig

Configuration for server mode (custom storage).

```typescript
interface ServerRegistryConfig {
  storage: Storage;
  types?: BundledType[];
  isolator?: IsolatorType;
}
```

**Properties:**

| Property   | Type                         | Description                          |
| ---------- | ---------------------------- | ------------------------------------ |
| `storage`  | `Storage`                    | Custom storage implementation        |
| `types`    | `BundledType[] \| undefined` | Additional resource types to support |
| `isolator` | `IsolatorType \| undefined`  | Sandbox isolation level              |

### IsolatorType

Sandbox isolation types for resolver execution.

```typescript
type IsolatorType = "none" | "srt" | "cloudflare" | "e2b";
```

| Type           | Overhead | Description                    |
| -------------- | -------- | ------------------------------ |
| `"none"`       | ~10ms    | No isolation (development)     |
| `"srt"`        | ~50ms    | OS-level isolation (SRT)       |
| `"cloudflare"` | ~100ms   | Container isolation (Docker)   |
| `"e2b"`        | ~150ms   | MicroVM isolation (production) |

---

## ResolvedResource

Result from `resolve()` method.

```typescript
interface ResolvedResource<TArgs = void, TResult = unknown> {
  resource: RXR;
  execute: (args?: TArgs) => TResult | Promise<TResult>;
  schema: TArgs extends void ? undefined : JSONSchema;
}
```

**Properties:**

| Property   | Type                                            | Description               |
| ---------- | ----------------------------------------------- | ------------------------- |
| `resource` | `RXR`                                           | Original resource object  |
| `execute`  | `(args?: TArgs) => TResult \| Promise<TResult>` | Lazy execution function   |
| `schema`   | `JSONSchema \| undefined`                       | JSON Schema for arguments |

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
import { discoverRegistry } from "@resourcexjs/registry";

// Discover registry for a domain
const discovery = await discoverRegistry("deepractice.ai");
console.log(discovery.domain); // "deepractice.ai"
console.log(discovery.registries); // ["https://registry.deepractice.ai/v1"]
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
  version?: string;
  registries: string[];
}
```

**Example well-known file (`https://example.com/.well-known/resourcex`):**

```json
{
  "version": "1.0",
  "registries": ["https://registry.example.com/v1"]
}
```

---

## Storage Interface

Storage abstraction for resource CRUD operations.

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
class LocalStorage implements Storage {
  constructor(config?: LocalStorageConfig);
  link(path: string): Promise<void>;
}
```

**Storage Structure:**

```
{basePath}/{domain}/{path}/{name}.{type}/{version}/
  ├── manifest.json
  └── archive.tar.gz
```

**Example:**

```typescript
import { LocalStorage } from "@resourcexjs/registry";

const storage = new LocalStorage({ path: "./my-resources" });
```

### LocalStorageConfig

```typescript
interface LocalStorageConfig {
  path?: string;
}
```

**Properties:**

| Property | Type                  | Description                            |
| -------- | --------------------- | -------------------------------------- |
| `path`   | `string \| undefined` | Storage path (default: `~/.resourcex`) |

---

## Middleware

### RegistryMiddleware

Base class for creating registry middleware.

```typescript
abstract class RegistryMiddleware implements Registry {
  constructor(protected readonly inner: Registry);
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
import { createRegistry, withDomainValidation, LocalStorage } from "@resourcexjs/registry";

const baseRegistry = createRegistry({
  storage: new LocalStorage({ path: "./resources" }),
});

// Wrap with domain validation
const secured = withDomainValidation(baseRegistry, "deepractice.ai");

// Resources with mismatched domains will throw RegistryError
try {
  await secured.get("evil.com/resource.text@1.0.0");
} catch (error) {
  // "Untrusted domain: resource claims 'evil.com' but registry only trusts 'deepractice.ai'"
}
```

---

## Errors

### RegistryError

Error class for registry operations.

```typescript
class RegistryError extends Error {
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
  LocalStorage,
  RegistryError,
} from "@resourcexjs/registry";
import { parseRXL, createRXM, createRXA } from "@resourcexjs/core";

async function main() {
  // Create local registry
  const registry = createRegistry();

  // Option 1: Link development directory (live changes)
  await registry.link("./my-greeting");

  // Option 2: Add from directory (snapshot)
  await registry.add("./my-greeting");

  // Option 3: Add from RXR object
  const manifest = createRXM({
    domain: "localhost",
    name: "greeting",
    type: "text",
    version: "1.0.0",
  });
  const archive = await createRXA({ content: "Hello, ResourceX!" });
  await registry.add({
    locator: parseRXL(manifest.toLocator()),
    manifest,
    archive,
  });

  // Check existence
  const exists = await registry.exists("localhost/greeting.text@1.0.0");
  console.log("Exists:", exists); // true

  // Resolve and execute
  const resolved = await registry.resolve<void, string>("localhost/greeting.text@1.0.0");
  const text = await resolved.execute();
  console.log("Content:", text); // "Hello, ResourceX!"

  // Search resources
  const results = await registry.search({ query: "greeting" });
  console.log("Found:", results.length); // 1

  // Clean up
  await registry.delete("localhost/greeting.text@1.0.0");
}

main().catch(console.error);
```
