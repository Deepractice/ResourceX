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
   - RXA (Archive): Archive container (tar.gz) for storage/transfer
   - RXP (Package): Extracted package for runtime file access
   - RXR (Resource): RXL + RXM + RXA
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
├── core/        # @resourcexjs/core - RXL, RXM, RXA, RXP, RXR
├── type/        # @resourcexjs/type - Type system (BundledType, TypeHandlerChain)
├── loader/      # @resourcexjs/loader - Resource loading (FolderLoader)
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

**RXA (Archive)** - Archive container (tar.gz format) for storage/transfer

```typescript
// Create archive
await createRXA({ content: "Hello" })                    // single file
await createRXA({ 'index.ts': '...', 'styles.css': '...' }) // multi-file
await createRXA({ buffer: tarGzBuffer })                 // from existing archive

// Methods
rxa.buffer(): Promise<Buffer>          // raw tar.gz buffer
rxa.stream: ReadableStream             // tar.gz stream
rxa.extract(): Promise<RXP>            // extract to package
```

**RXP (Package)** - Extracted package for runtime file access

```typescript
// Created from RXA.extract()
const pkg = await rxa.extract();

// Methods
pkg.paths(): string[]                     // flat list of file paths
pkg.tree(): PathNode[]                    // tree structure
pkg.file(path): Promise<Buffer>           // read single file
pkg.files(): Promise<Map<string, Buffer>> // read all files
pkg.pack(): Promise<RXA>                  // pack back to archive
```

**RXR (Resource)** - Complete resource (pure DTO)

```typescript
interface RXR {
  locator: RXL;
  manifest: RXM;
  archive: RXA;
}

// Create from literals
const rxr: RXR = { locator, manifest, archive };
```

### Type System

**BundledType** - Pre-bundled resource type ready for sandbox execution:

```typescript
interface BundledType {
  name: string;           // "text", "json", "prompt"
  aliases?: string[];     // ["txt"], ["config"]
  description: string;
  schema?: JSONSchema;    // For typed arguments
  code: string;           // Bundled resolver code (executable in sandbox)
}

// Built-in types (schema: undefined, no args)
text   → aliases: [txt, plaintext]  → execute() => Promise<string>
json   → aliases: [config, manifest] → execute() => Promise<unknown>
binary → aliases: [bin, blob, raw]   → execute() => Promise<Uint8Array>
```

**ResolveContext** - Pure data context passed to resolver in sandbox:

```typescript
interface ResolveContext {
  manifest: {
    domain: string;
    path?: string;
    name: string;
    type: string;
    version: string;
  };
  files: Record<string, Uint8Array>; // Extracted archive files
}

// Resolver code example (in .type.ts file)
export default {
  name: "text",
  description: "Plain text content",
  async resolve(ctx: ResolveContext) {
    return new TextDecoder().decode(ctx.files["content"]);
  },
};
```

**ResolvedResource** - Result from registry.resolve():

```typescript
interface ResolvedResource<TArgs = void, TResult = unknown> {
  resource: RXR; // Original resource
  execute: (args?: TArgs) => TResult | Promise<TResult>; // Lazy execution
  schema: TArgs extends void ? undefined : JSONSchema; // For UI rendering
}
```

**TypeHandlerChain** - Type registration and lookup:

```typescript
const chain = TypeHandlerChain.create(); // Includes builtins by default
chain.register(type); // Register custom type
chain.canHandle(name); // Check if type supported
chain.getHandler(name); // Get BundledType (throws if not found)
```

**Bundling Custom Types:**

```typescript
import { bundleResourceType } from "@resourcexjs/type";

// Bundle from .type.ts file (uses Bun.build)
const promptType = await bundleResourceType("./prompt.type.ts");
registry.supportType(promptType);
```

### Registry

**Registry Interface:**

```typescript
interface Registry {
  supportType(type: BundledType): void; // Add custom resource type
  link(path: string): Promise<void>; // Symlink to dev directory (live changes)
  add(source: string | RXR): Promise<void>; // Copy to local (~/.resourcex)
  get(locator: string): Promise<RXR>; // Get raw RXR without resolving
  resolve<TArgs, TResult>(locator: string): Promise<ResolvedResource<TArgs, TResult>>;
  exists(locator: string): Promise<boolean>;
  delete(locator: string): Promise<void>;
  search(options?: SearchOptions): Promise<RXL[]>;
}

interface SearchOptions {
  query?: string; // Filter by locator substring
  limit?: number; // Max results
  offset?: number; // Skip first N results
}
```

**Registry Configuration:**

```typescript
// Client mode (default) - LocalStorage as cache, fetches from remote
const registry = createRegistry();
const registry2 = createRegistry({ path: "./custom-path" });

// With mirror for remote fetch
const registry3 = createRegistry({
  mirror: "https://registry.deepractice.ai/v1",
});

// With custom types
const registry4 = createRegistry({
  types: [myPromptType, myToolType],
});

// With sandbox isolator
const registry5 = createRegistry({
  isolator: "srt", // "none" | "srt" | "cloudflare" | "e2b"
});

// Server mode - custom Storage implementation
const registry6 = createRegistry({
  storage: new LocalStorage({ path: "./data" }),
});
```

**Isolator Types (SandboX integration):**

- `"none"` - No isolation, fastest (~10ms), for development
- `"srt"` - OS-level isolation (~50ms), secure local dev
- `"cloudflare"` - Container isolation (~100ms), local Docker or edge
- `"e2b"` - MicroVM isolation (~150ms), production (planned)

**Well-known Discovery:**

```typescript
import { discoverRegistry } from "@resourcexjs/registry";
const discovery = await discoverRegistry("deepractice.dev");
// → { domain: "deepractice.dev", registries: ["https://..."] }
```

**Well-known Format:**

```json
// https://deepractice.dev/.well-known/resourcex
{
  "version": "1.0",
  "registries": ["https://registry.deepractice.dev/v1"]
}
```

**Storage Interface:**

Registry uses pluggable Storage backend:

```typescript
interface Storage {
  readonly type: string;
  get(locator: string): Promise<RXR>;
  put(rxr: RXR): Promise<void>;
  exists(locator: string): Promise<boolean>;
  delete(locator: string): Promise<void>;
  search(options?: SearchOptions): Promise<RXL[]>;
}

// Built-in implementations:
LocalStorage; // Filesystem-based (uses ARP)
```

**Storage Structure:**

```
~/.resourcex/
└── {domain}/
    └── {path}/
        └── {name}.{type}/
            └── {version}/
                ├── manifest.json
                └── archive.tar.gz

# For localhost (no domain):
~/.resourcex/localhost/{name}.{type}/{version}/
```

### Loader

**loadResource** - Load resource from directory:

```typescript
import { loadResource } from "@resourcexjs/loader";

const rxr = await loadResource("./my-resource");
await registry.add(rxr);
```

**FolderLoader** expects this structure:

```
my-resource/
├── resource.json    # Required: metadata
└── content          # Content files (any name)
```

**resource.json format:**

```json
{
  "name": "my-resource",
  "type": "text",
  "version": "1.0.0",
  "domain": "localhost",
  "path": "optional/path"
}
```

All files except `resource.json` are packaged into RXA.

### Resolution Flow

```
registry.resolve("my-tool.text@1.0.0")
  ↓
1. Check local storage: ~/.resourcex/localhost/my-tool.text/1.0.0/
2. If not found and domain != localhost:
   a. Try mirror (if configured)
   b. Discover via well-known
   c. Fetch from remote endpoint
   d. Cache to local storage
3. Get BundledType from TypeHandlerChain
4. Execute resolver in sandbox via ResolverExecutor
5. Return ResolvedResource with execute()
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

### BDD Testing Rules

**IMPORTANT**: BDD tests are end-to-end tests from user perspective:

1. **Only import from `resourcexjs`** - Never use internal packages like `@resourcexjs/registry`, `@resourcexjs/core`, etc.
2. **Only test public API** - Never test internal implementation classes directly
3. **User perspective** - Test what users would actually do, not internal mechanics

```typescript
// ✅ Good - using public API
const { createRegistry, discoverRegistry } = await import("resourcexjs");
const discovery = await discoverRegistry("deepractice.dev");
const registry = createRegistry({ url: discovery.registries[0], domain: discovery.domain });

// ❌ Bad - using internal implementation
const { GitHubRegistry } = await import("@resourcexjs/registry");
const registry = new GitHubRegistry({ url: "..." });
```

## Key Implementation Details

### Registry Architecture

Registry separates concerns into three layers:

1. **Storage** - Pure CRUD operations (LocalStorage)
2. **TypeHandlerChain** - Type registration and lookup
3. **ResolverExecutor** - Sandbox execution of resolver code

```typescript
class DefaultRegistry implements Registry {
  private storage: Storage;
  private typeHandler: TypeHandlerChain;
  private executor: ResolverExecutor;

  async resolve(locator: string) {
    const rxr = await this.get(locator);              // Storage
    const handler = this.typeHandler.getHandler(...); // Type lookup
    return {
      resource: rxr,
      schema: handler.schema,
      execute: (args) => this.executor.execute(handler.code, rxr, args),
    };
  }
}
```

### ResolverExecutor

Executes bundled resolver code in sandbox (via SandboX):

```typescript
interface ResolverExecutor {
  execute<TResult>(code: string, rxr: RXR, args?: unknown): Promise<TResult>;
}

// Flow:
// 1. RXR → ResolveContext (extract files to Uint8Array)
// 2. Serialize context to JSON
// 3. Execute resolver code in sandbox
// 4. Parse stdout as result
```

### Archive and Package

RXA stores content as tar.gz archive for storage/transfer. RXP provides runtime file access:

```typescript
// Create archive
const archive = await createRXA({ content: "Hello" }); // single file
const archive = await createRXA({ "src/index.ts": "code" }); // multi-file

// Extract to package for file access
const pkg = await archive.extract();
const buffer = await pkg.file("content"); // ✅ Buffer
buffer.toString(); // "Hello"

// Get all file paths
const paths = pkg.paths(); // ["content"] or ["src/index.ts", ...]

// Read all files
const files = await pkg.files(); // Map<string, Buffer>

// Pack back to archive
const newArchive = await pkg.pack();
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

// Archive and Package
createRXA(files: Record<string, Buffer | string>): Promise<RXA>
createRXA({ buffer: Buffer }): Promise<RXA>
```

### Type Package (`@resourcexjs/type`)

```typescript
// Types
interface BundledType { name, aliases?, description, schema?, code }
interface ResolveContext { manifest, files: Record<string, Uint8Array> }
interface ResolvedResource<TArgs, TResult> { resource, execute, schema }
type IsolatorType = "none" | "srt" | "cloudflare" | "e2b"

// TypeHandlerChain
TypeHandlerChain.create(): TypeHandlerChain  // Includes builtins
chain.register(type: BundledType): void
chain.canHandle(name: string): boolean
chain.getHandler(name: string): BundledType

// Bundler
bundleResourceType(sourcePath: string): Promise<BundledType>

// Built-in types
textType, jsonType, binaryType, builtinTypes
```

### Loader Package (`@resourcexjs/loader`)

```typescript
// Load resource from folder
loadResource(path: string): Promise<RXR>
loadResource(path: string, { loader: CustomLoader }): Promise<RXR>

// Loader interface
interface ResourceLoader {
  canLoad(source: string): Promise<boolean>;
  load(source: string): Promise<RXR>;
}

// Built-in loader
FolderLoader  // Loads from folder with resource.json
```

### Registry Package (`@resourcexjs/registry`)

```typescript
// Create registry
createRegistry(): Registry                        // Client mode, default path
createRegistry({ path?: string }): Registry       // Client mode, custom path
createRegistry({ mirror?: string }): Registry     // Client mode with mirror
createRegistry({ types?: BundledType[] }): Registry
createRegistry({ isolator?: IsolatorType }): Registry
createRegistry({ storage: Storage }): Registry    // Server mode

// Well-known discovery
discoverRegistry(domain: string): Promise<DiscoveryResult>
// → { domain: "example.com", registries: ["https://..."] }

// Storage
interface Storage { type, get, put, exists, delete, search }
LocalStorage   // Filesystem-based (uses ARP)

// Registry interface
registry.supportType(type: BundledType): void
registry.link(path: string): Promise<void>
registry.add(source: string | RXR): Promise<void>
registry.get(locator: string): Promise<RXR>
registry.resolve<TArgs, TResult>(locator: string): Promise<ResolvedResource<TArgs, TResult>>
registry.exists(locator: string): Promise<boolean>
registry.delete(locator: string): Promise<void>
registry.search(options?: SearchOptions): Promise<RXL[]>

// Middleware (for custom extensions)
RegistryMiddleware, DomainValidation, withDomainValidation
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
ResourceXError (base for @resourcexjs/core)
├── LocatorError (RXL parsing)
├── ManifestError (RXM validation)
└── ContentError (RXA/RXP operations)

ResourceTypeError (type not found/already registered - @resourcexjs/type)

RegistryError (registry operations - @resourcexjs/registry)

ARPError (base for @resourcexjs/arp)
├── ParseError (ARP URL parsing)
├── TransportError (Transport not found)
└── SemanticError (Semantic not found)
```

## TODO

- [x] Registry.search() - Implemented with query/limit/offset options
- [x] Registry.get() - Get raw RXR without resolving
- [x] RxrTransport - Access files inside resources via ARP
- [x] Well-known discovery - `discoverRegistry()` for service discovery
- [x] RxrTransport auto-create - Auto-creates Registry based on domain
- [x] ARP list/mkdir - Directory operations for file transport
- [x] Registry Middleware - DomainValidation middleware
- [x] Registry uses ARP - LocalStorage uses ARP for I/O
- [x] BundledType - Pre-bundled types for sandbox execution
- [x] ResolverExecutor - Sandbox execution via SandboX
- [x] Loader package - loadResource with FolderLoader
- [ ] Registry HTTP Server - Server-side routes (see `issues/015-registry-remote-support.md`)
