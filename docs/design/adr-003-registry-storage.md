# ADR-003: Registry Storage Design

**Status**: Accepted
**Date**: 2025-01

## Context

ResourceX needs a Registry system for storing and retrieving versioned resources. The design must address:

1. **Local development**: Developers need to work offline with local resources
2. **Remote access**: Resources should be accessible from remote registries
3. **Caching**: Remote resources should be cached locally for performance
4. **Multiple backends**: Support filesystem, HTTP, Git, and potentially S3
5. **Security**: Remote registries need domain binding to prevent impersonation

Previous design mixed local development resources with cached remote resources in the same directory structure, causing confusion about resource ownership and cleanup.

## Decision

### Registry Interface

```typescript
interface Registry {
  // Write operations
  link(resource: RXR): Promise<void>; // Link to local development
  publish(resource: RXR): Promise<void>; // Publish to remote (TODO)

  // Read operations
  get(locator: string): Promise<RXR>; // Get raw resource
  resolve(locator: string): Promise<ResolvedResource>; // Resolve with execute()
  exists(locator: string): Promise<boolean>;

  // Management
  delete(locator: string): Promise<void>;
  search(options?: SearchOptions): Promise<RXL[]>;
}
```

### Local/Cache Separation

Storage is separated into two distinct areas:

```
~/.resourcex/
├── local/                              # Local development resources
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

**Local Area** (`local/`):

- Contains resources being developed
- Organized by `name.type/version` only (no domain hierarchy)
- Manifest may have any domain (including target publish domain)
- Written by `registry.add()`
- Searched first during resolution

**Cache Area** (`cache/`):

- Contains downloaded remote resources
- Organized by `domain/path/name.type/version`
- Populated by `registry.pull()` (TODO) or remote fetch
- Read-only from user perspective

### Resolution Flow

```
registry.resolve("my-tool.prompt@1.0.0")
                    |
                    v
    +-------------------------------+
    | 1. Check local/               |
    |    ~/.resourcex/local/        |
    |    my-tool.prompt/1.0.0/      |
    +---------------+---------------+
                    |
           Found?   |   Not Found?
                    v
    +-------------------------------+
    | 2. Check cache/               |
    |    ~/.resourcex/cache/        |
    |    {domain}/.../              |
    +---------------+---------------+
                    |
           Found?   |   Not Found?
                    v
    +-------------------------------+
    | 3. Fetch from remote          |
    |    (via well-known discovery) |
    +---------------+---------------+
                    |
                    v
    +-------------------------------+
    | 4. Cache locally + Return     |
    +-------------------------------+
```

### Registry Implementations

#### LocalRegistry

- Uses Node.js `fs` module directly
- Manages both `local/` and `cache/` areas
- Supports full Registry interface

```typescript
const registry = createRegistry(); // Default: LocalRegistry
const registry2 = createRegistry({ path: "./custom" });
```

#### RemoteRegistry

- HTTP client for remote registry access
- Read-only (link/delete not supported)
- Uses REST API endpoints

```typescript
const registry = createRegistry({
  endpoint: "https://registry.deepractice.ai/v1",
});
```

#### GitRegistry

- Uses Git repository as storage backend
- Clones to `~/.resourcex/.git-cache/{repo-name}/`
- Executes `git fetch` on every access to stay current
- Read-only (link/delete not supported)
- **Security**: Remote URLs require domain binding

```typescript
// Local development (no domain required)
const devRegistry = createRegistry({
  type: "git",
  url: "./my-local-repo",
});

// Remote (domain required for security)
const registry = createRegistry({
  type: "git",
  url: "git@github.com:Deepractice/Registry.git",
  domain: "deepractice.dev", // Required for remote!
});
```

### Well-Known Discovery

Registry discovery via standard endpoint:

```
GET https://{domain}/.well-known/resourcex
```

Response:

```json
{
  "version": "1.0",
  "registries": ["git@github.com:Deepractice/Registry.git"]
}
```

Discovery function:

```typescript
const result = await discoverRegistry("deepractice.dev");
// → { domain: "deepractice.dev", registries: ["git@github.com:..."] }
```

### Security Model

**Domain Binding**:

- Remote registries must be bound to a trusted domain
- During resolution, `manifest.domain` is validated against `trustedDomain`
- Prevents malicious registries from impersonating other domains

```typescript
// This ensures resources from this registry can only claim
// to be from "deepractice.dev" domain
const registry = createRegistry({
  type: "git",
  url: "git@github.com:Deepractice/Registry.git",
  domain: "deepractice.dev", // Trusted domain binding
});

// If a resource's manifest.domain doesn't match, resolution fails
```

### TypeHandlerChain Integration

Registry delegates serialization to TypeHandlerChain:

```typescript
class LocalRegistry implements Registry {
  private typeChain: TypeHandlerChain;

  async link(rxr: RXR) {
    const buffer = await this.typeChain.serialize(rxr);
    await writeFile(contentPath, buffer);
  }

  async get(locator: string): Promise<RXR> {
    const manifest = await this.readManifest(path);
    const buffer = await readFile(contentPath);
    return this.typeChain.deserialize(buffer, manifest);
  }
}
```

### Future: Storage Abstraction

Planned refactoring to separate Registry logic from storage:

```
+-----------------------------------+
|           Registry                |
| - Domain validation               |
| - Well-known discovery            |
| - TypeHandlerChain                |
| - Security checks                 |
+----------------+------------------+
                 | uses
                 v
+-----------------------------------+
|        Storage (interface)        |
| get(path): Promise<Buffer>        |
| exists(path): Promise<boolean>    |
| list(prefix): Promise<string[]>   |
| put?(path, data): Promise<void>   |
| delete?(path): Promise<void>      |
+-----------------------------------+
        ^           ^           ^
        |           |           |
   FileStorage  GitStorage  S3Storage
```

## Consequences

### Positive

1. **Clear Separation**: Local development vs cached remote resources
2. **Easy Cleanup**: Can clear cache without affecting local work
3. **Security**: Domain binding prevents impersonation attacks
4. **Flexibility**: Multiple storage backends supported
5. **Performance**: Local-first resolution for faster development

### Negative

1. **Migration Required**: Existing users need to migrate storage structure
2. **Complexity**: Multiple registry types add cognitive load
3. **Git Overhead**: GitRegistry clones entire repository

### Breaking Changes

Storage structure changed from:

```
~/.resourcex/{domain}/{path}/{name}.{type}/{version}/
```

To:

```
~/.resourcex/local/{name}.{type}/{version}/           # Local
~/.resourcex/cache/{domain}/{path}/{name}.{type}/{version}/  # Remote
```

Migration: Delete `~/.resourcex` and re-link/pull resources.

## Related Decisions

- ADR-001: Two-Layer Architecture
- ADR-002: Locator Format Design

## References

- Issue #011: Registry Design
- Issue #015: Registry Remote Support
- Issue #016: GitHub Registry Design
- Issue #017: Separate Local and Cache
- Issue #018: GitHub Registry Implementation
- Issue #019: Registry Storage Separation
