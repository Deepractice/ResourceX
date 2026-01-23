# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Rules

### Versioning

**NEVER use `major` version in changesets.** Always use `minor` or `patch`:

- `patch` - Bug fixes, internal improvements
- `minor` - New features, enhancements, breaking changes (treated as minor)

This project does not use major version bumps. All breaking changes should be documented but versioned as `minor`.

## Project Overview

ResourceX is a resource management protocol for AI Agents, similar to npm for packages.

**Two layers:**

1. **ARP (Agent Resource Protocol)** - Low-level I/O primitives
   - Format: `arp:{semantic}:{transport}://{location}`
   - Provides: resolve, deposit, exists, delete

2. **ResourceX** - High-level resource management
   - RXL (Locator): `[domain/path/]name[.type][@version]`
   - RXM (Manifest): Resource metadata
   - RXC (Content): Archive-based content (tar.gz internally)
   - RXR (Resource): RXL + RXM + RXC
   - Registry: Maven-style resource storage (link/resolve/exists/delete/search)
   - TypeSystem: Custom resource types with serializer & resolver

## Commands

```bash
# Install dependencies
bun install

# Build all packages (uses Turborepo)
bun run build

# Run all unit tests
bun run test

# Run a single test file
bun test packages/core/tests/unit/locator/parse.test.ts

# Run BDD tests (Cucumber)
bun run test:bdd

# Run BDD tests with specific tags
cd bdd && bun run test:tags "@registry"

# Lint
bun run lint

# Type check
bun run typecheck

# Format code
bun run format
```

## Architecture

### Package Structure

```
packages/
├── arp/         # @resourcexjs/arp - ARP protocol (low-level I/O)
├── core/        # @resourcexjs/core - RXL, RXM, RXC, RXR, ResourceType
├── registry/    # @resourcexjs/registry - Registry implementation
└── resourcex/   # resourcexjs - Main package (re-exports)
```

### Core Objects

**RXL (Locator)** - Resource locator

Format: `[domain/path/]name[.type][@version]`

```typescript
parseRXL("deepractice.ai/sean/assistant.prompt@1.0.0");
// → { domain, path, name, type, version, toString() }
```

**RXM (Manifest)** - Resource metadata

```typescript
createRXM({ domain, path?, name, type, version })
// → { domain, path, name, type, version, toLocator(), toJSON() }
```

**RXC (Content)** - Archive-based content (tar.gz internally)

```typescript
// Create from files
await createRXC({ content: "Hello" })                    // single file
await createRXC({ 'index.ts': '...', 'styles.css': '...' }) // multi-file
await createRXC({ archive: tarGzBuffer })                // from existing archive

// Methods
rxc.file(path): Promise<Buffer>        // read single file
rxc.files(): Promise<Map<string, Buffer>> // read all files
rxc.buffer(): Promise<Buffer>          // raw tar.gz buffer
rxc.stream: ReadableStream             // tar.gz stream
```

**RXR (Resource)** - Complete resource (pure DTO)

```typescript
interface RXR {
  locator: RXL;
  manifest: RXM;
  content: RXC;
}

// Create from literals
const rxr: RXR = { locator, manifest, content };
```

### Type System

**ResourceType** defines how resources are serialized and resolved:

```typescript
// ResolvedResource - structured result with execute and schema
interface ResolvedResource<TArgs = void, TResult = unknown> {
  execute: (args?: TArgs) => TResult | Promise<TResult>;
  schema: TArgs extends void ? undefined : JSONSchema;
}

// ResourceResolver - requires schema for typed args
interface ResourceResolver<TArgs = void, TResult = unknown> {
  schema: TArgs extends void ? undefined : JSONSchema;
  resolve(rxr: RXR): Promise<ResolvedResource<TArgs, TResult>>;
}

interface ResourceType<TArgs = void, TResult = unknown> {
  name: string;               // "text", "json", "prompt"
  aliases?: string[];         // ["txt"], ["config"]
  description: string;
  serializer: ResourceSerializer;  // RXR ↔ Buffer (for storage)
  resolver: ResourceResolver<TArgs, TResult>;  // RXR → structured result
}

// Built-in types (schema: undefined, no args)
text   → aliases: [txt, plaintext]  → execute() => Promise<string>
json   → aliases: [config, manifest] → execute() => Promise<unknown>
binary → aliases: [bin, blob, raw]   → execute() => Promise<Buffer>
```

**TypeHandlerChain** - Responsibility chain for type handling:

```typescript
chain.register(type); // Register a type
chain.canHandle(name); // Check if type supported
chain.serialize(rxr); // RXR → Buffer
chain.deserialize(data, manifest); // Buffer → RXR
chain.resolve<TArgs, TResult>(rxr); // RXR → structured result

// Example usage
const result = await chain.resolve<void, string>(rxr);
result.schema; // undefined for builtin types
await result.execute(); // Lazy load content
```

Used by Registry to delegate serialization logic.

### Registry

**Registry Interface:**

```typescript
interface Registry {
  link(resource: RXR): Promise<void>; // Link to local (~/.resourcex)
  get(locator: string): Promise<RXR>; // Get raw RXR without resolving
  resolve(locator: string): Promise<ResolvedResource>; // Resolve with execute()
  exists(locator: string): Promise<boolean>;
  delete(locator: string): Promise<void>;
  search(options?: SearchOptions): Promise<RXL[]>;
  publish(resource: RXR): Promise<void>; // TODO: remote publish
}

interface SearchOptions {
  query?: string; // Filter by locator substring
  limit?: number; // Max results
  offset?: number; // Skip first N results
}
```

**Registry Configuration:**

```typescript
// Local registry (default)
const registry = createRegistry();
const registry2 = createRegistry({ path: "./custom-path" });

// Remote registry (HTTP)
const registry3 = createRegistry({
  endpoint: "https://registry.deepractice.ai/v1",
});

// Git registry (requires domain for security)
const registry4 = createRegistry({
  type: "git",
  url: "git@github.com:Deepractice/Registry.git",
  domain: "deepractice.dev", // Required for remote URLs
});

// Well-known discovery (for any remote registry, not just git)
import { discoverRegistry } from "@resourcexjs/registry";
const discovery = await discoverRegistry("deepractice.dev");
// → { domain: "deepractice.dev", registries: ["git@github.com:...", "https://..."] }
// Can return git URLs, HTTP endpoints, or any supported registry type
```

**Well-known Format:**

```json
// https://deepractice.dev/.well-known/resourcex
{
  "version": "1.0",
  "registries": ["git@github.com:Deepractice/Registry.git", "https://registry.deepractice.dev/v1"]
}
```

First registry is primary, rest are fallbacks. Supports git URLs, HTTP endpoints, etc.

**Security:**

- Remote URLs require `domain` parameter (prevents impersonation)
- Local paths (./repo) don't require domain (development use)
- `discoverRegistry()` auto-binds domain from well-known
- Domain validation: middleware checks manifest.domain matches trustedDomain

**Registry Middleware:**

Middleware pattern for adding cross-cutting concerns:

```typescript
// Base class - delegates all operations to inner registry
abstract class RegistryMiddleware implements Registry {
  constructor(protected readonly inner: Registry) {}
  // All methods delegate to inner by default
}

// DomainValidation - validates manifest.domain matches trusted domain
class DomainValidation extends RegistryMiddleware {
  constructor(inner: Registry, private trustedDomain: string) { ... }

  async get(locator: string): Promise<RXR> {
    const rxr = await this.inner.get(locator);
    if (rxr.manifest.domain !== this.trustedDomain) {
      throw new RegistryError(`Untrusted domain: ${rxr.manifest.domain}`);
    }
    return rxr;
  }
}

// Factory function
const registry = withDomainValidation(gitRegistry, "deepractice.ai");
```

**Auto-injected Middleware:**

`createRegistry()` automatically wraps GitRegistry with DomainValidation when `domain` is provided:

```typescript
// This automatically wraps with DomainValidation
const registry = createRegistry({
  type: "git",
  url: "git@github.com:Deepractice/Registry.git",
  domain: "deepractice.ai", // Triggers auto-wrap
});
```

**LocalRegistry Implementation:**

- Uses ARP file transport for I/O operations
- Uses TypeHandlerChain for serialization/deserialization
- Storage: `~/.resourcex/{domain}/{path}/{name}.{type}/{version}/`

**RemoteRegistry Implementation:**

- Uses HTTP API for resource access
- Read-only (link/delete not supported)
- Endpoints: `/resource`, `/content`, `/exists`, `/search`

**GitRegistry Implementation:**

- Uses ARP file transport for I/O operations
- Clones git repository to `~/.resourcex/.git-cache/{repo-name}/`
- Every access does `git fetch` to stay current
- Read-only (link/delete not supported)
- Domain validation handled by middleware (not built-in)

**Storage Structure (Local):**

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

### Resolution Flow

```
registry.resolve("my-tool.text@1.0.0")
  ↓
LocalRegistry:
1. Check local/ first: ~/.resourcex/local/my-tool.text/1.0.0/
2. If not found, check cache/: ~/.resourcex/cache/.../my-tool.text/1.0.0/
3. Read manifest.json + content.tar.gz
4. typeChain.deserialize → RXR

RemoteRegistry:
1. GET /resource?locator=... → manifest
2. GET /content?locator=... → content
3. typeChain.deserialize → RXR
```

### ARP Layer

ARP provides low-level I/O primitives:

**Transport Interface:**

```typescript
interface TransportHandler {
  readonly name: string;
  get(location: string, params?: TransportParams): Promise<TransportResult>;
  set(location: string, content: Buffer, params?: TransportParams): Promise<void>;
  exists(location: string): Promise<boolean>;
  delete(location: string): Promise<void>;
  // Optional directory operations
  list?(location: string, options?: ListOptions): Promise<string[]>;
  mkdir?(location: string): Promise<void>;
}

interface ListOptions {
  recursive?: boolean; // List recursively
  pattern?: string; // Glob pattern filter (e.g., "*.json")
}

type TransportParams = Record<string, string>;

interface TransportResult {
  content: Buffer;
  metadata?: {
    type?: "file" | "directory";
    size?: number;
    modifiedAt?: Date;
  };
}
```

**Built-in Transports:**

- `file` - Local filesystem (read-write)
  - `get`: Returns file content or directory listing (JSON array)
  - `set`/`delete`: Supported
  - `list`: Supported (with recursive and pattern options)
  - `mkdir`: Supported (creates directories recursively)
- `http`, `https` - Network (read-only)
  - Merges URL query params with runtime params
  - `set`/`delete`/`list`/`mkdir` throw "not supported" error
- `rxr` - Access files inside resources (read-only)
  - Format: `arp:{semantic}:rxr://{rxl}/{internal-path}`
  - Example: `arp:text:rxr://localhost/hello.text@1.0.0/content`
  - Auto-creates Registry based on domain:
    - `localhost` → LocalRegistry (filesystem)
    - Other domains → RemoteRegistry (via well-known discovery)
  - Can manually inject Registry via constructor if needed
  - `set`/`delete`/`mkdir` throw "read-only" error
  - `list`: Supported (lists files in resource)

**Built-in Semantics:**

- `text` - UTF-8 text (string)
- `binary` - Raw bytes (Buffer, Uint8Array, ArrayBuffer, number[])

**Default registration:** `createARP()` auto-registers all built-in transports and semantics.

## Development Workflow

Follow `issues/000-unified-development-mode.md`:

1. **Phase 1: Code Review** - Clarify requirements
2. **Phase 2: BDD** - Write `.feature` files
3. **Phase 3: Implementation** - TDD (tests → code)

## Conventions

- Uses Bun as package manager and runtime
- ESM modules only (`"type": "module"`)
- TypeScript with strict mode
- **Path aliases**: Use `~/` instead of `../` for imports within packages
- Keep `.js` extensions in imports for ESM compatibility
- Commits follow Conventional Commits (enforced by commitlint via lefthook)
- Pre-commit hooks auto-format and lint staged files
- Turborepo manages build orchestration

## Testing

- **Unit tests**: `packages/*/tests/unit/**/*.test.ts` (Bun test)
- **BDD tests**: `bdd/features/**/*.feature` + `bdd/steps/**/*.steps.ts` (Cucumber)
- **TDD approach**: Write tests first, then implement
- **Tags**: @arp, @resourcex, @locator, @manifest, @resource-type, @registry

## Key Implementation Details

### TypeHandlerChain Pattern

Registry delegates serialization to TypeHandlerChain, keeping concerns separated:

```typescript
// LocalRegistry (storage layer)
class LocalRegistry implements Registry {
  private typeChain: TypeHandlerChain;

  async link(rxr: RXR) {
    // Delegate to chain
    const buffer = await this.typeChain.serialize(rxr);

    // Store using fs
    await writeFile(contentPath, buffer);
  }
}
```

This allows swapping storage implementations without changing serialization logic.

### Archive-based Content

RXC stores content as tar.gz archive internally, supporting single or multi-file resources:

```typescript
// Single file resource
const content = await createRXC({ content: "Hello" });
const buffer = await content.file("content"); // ✅ Buffer
buffer.toString(); // "Hello"

// Multi-file resource
const content = await createRXC({
  "src/index.ts": "main code",
  "src/utils.ts": "helper code",
});
const files = await content.files(); // Map<string, Buffer>
```

### Type Aliases

Types support aliases for flexibility:

```typescript
// These are all equivalent:
createRXM({ type: "text", ... })
createRXM({ type: "txt", ... })
createRXM({ type: "plaintext", ... })

// Registry resolves via TypeHandlerChain
registry.resolve("localhost/file.txt@1.0.0")    // ✅
registry.resolve("localhost/file.text@1.0.0")   // ✅
```

## API Summary

### Core Package (`@resourcexjs/core`)

```typescript
// Locator
parseRXL(locator: string): RXL

// Manifest
createRXM(data: ManifestData): RXM

// Content
createRXC(files: Record<string, Buffer | string>): Promise<RXC>
createRXC({ archive: Buffer }): Promise<RXC>

// ResourceType
defineResourceType<T>(config: ResourceType<T>): ResourceType<T>
getResourceType<T>(name: string): ResourceType<T> | undefined
clearResourceTypes(): void

// Built-in types
textType, jsonType, binaryType, builtinTypes

// TypeHandlerChain
createTypeHandlerChain(types?: ResourceType[]): TypeHandlerChain
```

### Registry Package (`@resourcexjs/registry`)

```typescript
// Create registry (local, remote, or git)
createRegistry(): Registry                              // LocalRegistry with default path
createRegistry({ path?: string }): Registry             // LocalRegistry
createRegistry({ endpoint: string }): Registry          // RemoteRegistry
createRegistry({ type: "git", url: string, domain: string }): Registry  // GitRegistry

// Well-known discovery (returns domain + registries)
discoverRegistry(domain: string): Promise<DiscoveryResult>
// → { domain: "example.com", registries: ["git@github.com:..."] }

// Types
interface DiscoveryResult {
  domain: string;
  registries: string[];
}

// Classes
LocalRegistry   // Filesystem-based (uses ARP)
RemoteRegistry  // HTTP API-based
GitRegistry     // Git clone-based (uses ARP, read-only)

// Middleware
RegistryMiddleware              // Base class for custom middleware
DomainValidation                // Validates manifest.domain
withDomainValidation(registry, domain): Registry  // Factory function

// Registry methods
registry.link(rxr): Promise<void>
registry.get(locator): Promise<RXR>         // Raw RXR without resolving
registry.resolve(locator): Promise<ResolvedResource>
registry.exists(locator): Promise<boolean>
registry.delete(locator): Promise<void>
registry.search(options?): Promise<RXL[]>   // { query?, limit?, offset? }
registry.publish(rxr): Promise<void>        // TODO: remote publish
```

### ARP Package (`@resourcexjs/arp`)

Base ARP package with standard protocols only (file, http, https).
For RxrTransport, use the main `resourcexjs` package.

```typescript
createARP(config?: ARPConfig): ARP  // file, http, https only

arp.parse(url: string): ARL
arp.registerTransport(transport: TransportHandler): void

arl.resolve(params?: TransportParams): Promise<Resource>
arl.deposit(data: unknown, params?: TransportParams): Promise<void>
arl.exists(): Promise<boolean>
arl.delete(): Promise<void>
arl.list(options?: ListOptions): Promise<string[]>  // Directory listing
arl.mkdir(): Promise<void>                          // Create directory

// Built-in transports (standard protocols)
fileTransport: TransportHandler
httpTransport: TransportHandler
httpsTransport: TransportHandler
```

### Main Package ARP (`resourcexjs/arp`)

Enhanced ARP with ResourceX integration (includes RxrTransport).

```typescript
import { createARP, RxrTransport } from "resourcexjs/arp";

// createARP() auto-registers RxrTransport
const arp = createARP(); // file, http, https, rxr

// Access files inside resources
const arl = arp.parse("arp:text:rxr://localhost/hello.text@1.0.0/content");
const resource = await arl.resolve();

// RxrTransport usage (manual mode for testing)
const rxrTransport = new RxrTransport(registry); // Inject specific registry
const arp2 = createARP({ transports: [rxrTransport] }); // Override default
```

## Error Hierarchy

```
ResourceXError
├── LocatorError (RXL parsing)
├── ManifestError (RXM validation)
├── ContentError (RXC consumption)
└── ResourceTypeError (Type not found)

RegistryError (Registry operations)

ARPError
├── ParseError (ARP URL parsing)
├── TransportError (Transport not found)
└── SemanticError (Semantic not found)
```

## TODO

- [x] Registry.search() - Implemented with query/limit/offset options
- [x] Registry.get() - Get raw RXR without resolving
- [x] RxrTransport - Access files inside resources via ARP
- [x] RemoteRegistry - HTTP client for remote registry access
- [x] Well-known discovery - `discoverRegistry()` for service discovery
- [x] RxrTransport auto-create - Auto-creates Registry based on domain
- [x] ARP list/mkdir - Directory operations for file transport
- [x] Registry Middleware - DomainValidation middleware with auto-injection
- [x] Registry uses ARP - LocalRegistry and GitRegistry use ARP for I/O
- [ ] Registry.publish() - Remote publishing to domain-based registry
- [ ] Registry HTTP Server - Server-side routes (see `issues/015-registry-remote-support.md`)
