# @resourcexjs/registry

Registry layer for ResourceX. Provides business logic for RXR (ResourceX Resource) operations on top of the storage layer.

## Installation

```bash
bun add @resourcexjs/registry
```

## Overview

The `@resourcexjs/registry` package provides:

- **Three registry types** for different use cases
- **Access chain** for read-through cache pattern
- **Middleware** for cross-cutting concerns
- **Discovery** for well-known registry endpoints

All registries implement a common `Registry` interface and use `@resourcexjs/storage` for persistence.

## Registry Types

### LocalRegistry

For local/owned resources without a registry domain in the path.

```typescript
import { LocalRegistry } from "@resourcexjs/registry";
import { FileSystemStorage } from "@resourcexjs/storage";

const storage = new FileSystemStorage("~/.resourcex/local");
const registry = new LocalRegistry(storage);

// Storage structure: {name}/{tag}/manifest.json + archive.tar.gz
await registry.put(rxr);
const resource = await registry.get(rxl);
```

**Use cases:**

- Client local storage (`~/.resourcex/local/`)
- Server authoritative storage (`./data/`)

### MirrorRegistry

For cached/mirrored remote resources. Includes registry domain in the path.

```typescript
import { MirrorRegistry } from "@resourcexjs/registry";
import { FileSystemStorage } from "@resourcexjs/storage";

const storage = new FileSystemStorage("~/.resourcex/cache");
const registry = new MirrorRegistry(storage);

// Storage structure: {registry}/{name}/{tag}/manifest.json + archive.tar.gz
await registry.put(rxr);
const resource = await registry.get(rxl);

// Cache-specific: clear cached resources
await registry.clear(); // Clear all
await registry.clear("deepractice.ai"); // Clear specific registry
```

**Use cases:**

- Caching remote resources locally
- Offline access to previously fetched resources

### LinkedRegistry

For development symlinks. Changes in the source directory are reflected immediately.

```typescript
import { LinkedRegistry } from "@resourcexjs/registry";

const registry = new LinkedRegistry("~/.resourcex/linked");

// Create symlink to development directory
const rxl = await registry.link("./my-prompt");

// Get resource (reads from symlink target)
const resource = await registry.get(rxl);

// Remove symlink
await registry.unlink(rxl);
```

**Use cases:**

- Live development without re-adding resources
- Testing local changes before publishing

## Registry Interface

All registries implement:

```typescript
interface Registry {
  get(rxl: RXL): Promise<RXR>;
  put(rxr: RXR): Promise<void>;
  has(rxl: RXL): Promise<boolean>;
  remove(rxl: RXL): Promise<void>;
  list(options?: SearchOptions): Promise<RXL[]>;
}

interface SearchOptions {
  query?: string; // Filter by name/path substring
  limit?: number; // Max results
  offset?: number; // Skip first N (pagination)
}
```

## Access Chain

The access chain implements a read-through cache pattern for unified resource access.

### RegistryAccessChain

Iterates through accessors in order. First accessor that can handle returns the result.

```typescript
import {
  RegistryAccessChain,
  LinkedAccessor,
  LocalAccessor,
  CacheAccessor,
  RemoteAccessor,
  LocalRegistry,
  MirrorRegistry,
  LinkedRegistry,
} from "@resourcexjs/registry";
import { FileSystemStorage } from "@resourcexjs/storage";

// Create registries
const linkedRegistry = new LinkedRegistry("~/.resourcex/linked");
const localRegistry = new LocalRegistry(new FileSystemStorage("~/.resourcex/local"));
const cacheRegistry = new MirrorRegistry(new FileSystemStorage("~/.resourcex/cache"));

// Create accessor chain
const chain = new RegistryAccessChain(
  [
    new LinkedAccessor(linkedRegistry), // 1. Dev symlinks (highest priority)
    new LocalAccessor(localRegistry), // 2. Local resources (no domain)
    new CacheAccessor(cacheRegistry), // 3. Cached remote resources
    new RemoteAccessor(fetcher, cacheRegistry), // 4. Fetch + auto-cache
  ],
  { memCache: true } // Optional in-memory cache
);

// Get resource (tries each accessor in order)
const rxr = await chain.get(rxl);

// Check existence
const exists = await chain.has(rxl);

// Cache management
chain.invalidate(rxl); // Remove specific resource from memory cache
chain.clearCache(); // Clear entire memory cache
```

### Accessor Types

| Accessor         | Handles                    | Description                    |
| ---------------- | -------------------------- | ------------------------------ |
| `LinkedAccessor` | All (if linked)            | Dev symlinks, highest priority |
| `LocalAccessor`  | Resources without registry | Local storage                  |
| `CacheAccessor`  | Resources with registry    | Cached remote resources        |
| `RemoteAccessor` | Resources with registry    | Fetch + auto-cache             |

### RemoteFetcher Interface

`RemoteAccessor` requires a fetcher implementation:

```typescript
interface RemoteFetcher {
  fetch(rxl: RXL): Promise<RXR>;
}

// Example implementation
const fetcher: RemoteFetcher = {
  async fetch(rxl) {
    const url = `https://${rxl.registry}/api/v1/resources/${rxl.name}/${rxl.tag}`;
    const response = await fetch(url);
    // ... parse response to RXR
    return rxr;
  },
};
```

## Middleware

### RegistryMiddleware

Base class for creating custom middleware. Delegates all operations to the inner registry.

```typescript
import { RegistryMiddleware } from "@resourcexjs/registry";
import type { RXL, RXR } from "@resourcexjs/core";

class LoggingMiddleware extends RegistryMiddleware {
  async get(rxl: RXL): Promise<RXR> {
    console.log("Getting:", rxl);
    const rxr = await this.inner.get(rxl);
    console.log("Got:", rxr.manifest.name);
    return rxr;
  }
}

const logged = new LoggingMiddleware(registry);
```

### DomainValidation

Built-in middleware that validates resource registry matches a trusted registry.

```typescript
import { withDomainValidation } from "@resourcexjs/registry";

const validated = withDomainValidation(registry, "deepractice.ai");

// Throws RegistryError if resource.manifest.registry !== "deepractice.ai"
await validated.get(rxl);
```

**Use cases:**

- Server-side validation to prevent registry impersonation
- Ensuring resources are from trusted sources

## Discovery

Discover registry endpoints via well-known URL.

```typescript
import { discoverRegistry } from "@resourcexjs/registry";

const result = await discoverRegistry("deepractice.ai");
// {
//   domain: "deepractice.ai",
//   registries: ["https://registry.deepractice.ai/api/v1"]
// }
```

**Well-known format** (`https://{domain}/.well-known/resourcex`):

```json
{
  "version": "1.0",
  "registries": ["https://registry.example.com/api/v1"]
}
```

## Storage Structure

```
~/.resourcex/
├── local/                          # LocalRegistry - local resources
│   └── {path/}{name}/
│       └── {tag}/
│           ├── manifest.json
│           └── archive.tar.gz
│
├── cache/                          # MirrorRegistry - cached remote
│   └── {registry}/
│       └── {path/}{name}/
│           └── {tag}/
│               ├── manifest.json
│               └── archive.tar.gz
│
└── linked/                         # LinkedRegistry - dev symlinks
    └── {registry}/
        └── {path/}{name}/
            └── {tag} -> /path/to/dev/folder
```

## Error Handling

```typescript
import { RegistryError } from "@resourcexjs/registry";

try {
  await registry.get(rxl);
} catch (error) {
  if (error instanceof RegistryError) {
    console.error("Registry error:", error.message);
  }
}
```

**Common errors:**

- `Resource not found: {locator}`
- `Resource not found in cache: {locator}`
- `Linked resource not found: {locator}`
- `LinkedRegistry does not support put(). Use link() instead.`
- `Well-known discovery failed for {domain}: {status}`
- `Untrusted registry: resource claims "{claimed}" but registry only trusts "{trusted}"`

## API Reference

### Registries

#### `LocalRegistry`

```typescript
new LocalRegistry(storage: Storage)
```

Registry for local resources without registry domain.

#### `MirrorRegistry`

```typescript
new MirrorRegistry(storage: Storage)
```

Registry for cached remote resources with registry domain.

**Additional methods:**

- `clear(registry?: string): Promise<void>` - Clear cached resources

#### `LinkedRegistry`

```typescript
new LinkedRegistry(basePath: string)
```

Registry for development symlinks.

**Additional methods:**

- `link(devPath: string): Promise<RXL>` - Create symlink to development directory
- `unlink(rxl: RXL): Promise<void>` - Remove symlink (alias for `remove`)

### Access Chain

#### `RegistryAccessChain`

```typescript
new RegistryAccessChain(accessors: RegistryAccessor[], options?: { memCache?: boolean })
```

**Methods:**

- `get(rxl: RXL): Promise<RXR>` - Get resource through chain
- `has(rxl: RXL): Promise<boolean>` - Check existence
- `clearCache(): void` - Clear memory cache
- `invalidate(rxl: RXL): void` - Remove specific resource from memory cache

#### `RegistryAccessor`

```typescript
interface RegistryAccessor {
  readonly name: string;
  canHandle(rxl: RXL): Promise<boolean>;
  get(rxl: RXL): Promise<RXR>;
}
```

### Middleware

#### `RegistryMiddleware`

```typescript
abstract class RegistryMiddleware implements Registry {
  constructor(protected readonly inner: Registry)
}
```

#### `DomainValidation`

```typescript
new DomainValidation(inner: Registry, trustedRegistry: string)
```

Middleware class that validates resource registry matches the trusted registry.

#### `withDomainValidation`

```typescript
withDomainValidation(registry: Registry, trustedRegistry: string): Registry
```

Factory function to create `DomainValidation` middleware.

### Discovery

#### `discoverRegistry`

```typescript
discoverRegistry(domain: string): Promise<DiscoveryResult>
```

**Types:**

```typescript
interface DiscoveryResult {
  domain: string;
  registries: string[];
}

interface WellKnownResponse {
  version?: string;
  registries: string[];
}
```

### Error

#### `RegistryError`

```typescript
class RegistryError extends ResourceXError {
  constructor(message: string, options?: ErrorOptions);
}
```

## License

Apache-2.0
