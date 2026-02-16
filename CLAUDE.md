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

**Architecture Layers:**

1. **ARP (Agent Resource Protocol)** - Low-level I/O primitives
   - Format: `arp:{semantic}:{transport}://{location}`
   - Provides: resolve, deposit, exists, delete

2. **Core Layer** - Primitives and CAS Registry (`@resourcexjs/core`)
   - RXL, RXM, RXA, RXR primitives
   - CASRegistry: Content-addressable storage for resources
   - Store interfaces (SPI): RXAStore, RXMStore
   - TypeHandlerChain: Resource type system

3. **Provider Layer** - Platform-specific implementations (`@resourcexjs/node-provider`)
   - NodeProvider: Node.js/Bun platform provider
   - FileSystemRXAStore: Blob storage on filesystem
   - FileSystemRXMStore: Manifest storage on filesystem

4. **ResourceX API** - Unified client API (`resourcexjs`)
   - `setProvider()` + `createResourceX()` - Main entry point
   - Combines all layers for seamless resource management

5. **Server** - Registry server (`@resourcexjs/server`)
   - HTTP API for hosting and distributing resources
   - Uses CASRegistry with configurable stores

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
cd bdd && bun run test:tags "@resourcex"

# Lint + format check (Biome)
bun run check

# Auto-fix lint + format
bun run check:fix

# Type check
bun run typecheck
```

## Architecture

### Package Structure

```
packages/
├── arp/           # @resourcexjs/arp - ARP protocol (low-level I/O)
├── core/          # @resourcexjs/core - Primitives, CASRegistry, TypeSystem
├── node-provider/ # @resourcexjs/node-provider - Node.js/Bun provider
├── server/        # @resourcexjs/server - Registry server
└── resourcex/     # resourcexjs - Main client package
```

### Core Primitives (`@resourcexjs/core`)

```typescript
// Parse locator string to RXL (Docker-style format)
const rxl = parse("registry.example.com/hello:1.0.0");

// Create manifest from definition
const rxm = manifest({ name: "hello", type: "text", tag: "1.0.0" });

// Create archive from content
const rxa = await archive({ content: Buffer.from("Hello!") });

// Create resource (RXR = RXL + RXM + RXA)
const rxr = resource(rxm, rxa);

// Extract archive to files
const files = await extract(rxa); // Record<string, Buffer>

// Format RXL to string
const locatorStr = format(rxl); // "registry.example.com/hello:1.0.0"

// Wrap raw buffer as RXA
const rxa = wrap(buffer);
```

### CASRegistry (`@resourcexjs/core`)

Content-addressable storage for resources:

```typescript
import { CASRegistry, MemoryRXAStore, MemoryRXMStore } from "@resourcexjs/core";

const cas = new CASRegistry(new MemoryRXAStore(), new MemoryRXMStore());

await cas.put(rxr); // Store resource
const rxr = await cas.get(rxl); // Get resource
const exists = await cas.has(rxl); // Check existence
await cas.remove(rxl); // Remove resource
const results = await cas.list({ query: "hello" }); // Search
await cas.gc(); // Garbage collect orphaned blobs
await cas.clearCache("registry.example.com"); // Clear cached resources
```

### Store Interfaces (SPI)

For implementing custom storage backends:

```typescript
interface RXAStore {
  get(digest: string): Promise<Buffer>;
  put(data: Buffer): Promise<string>; // Returns digest
  has(digest: string): Promise<boolean>;
  delete(digest: string): Promise<void>;
  list(): Promise<string[]>;
}

interface RXMStore {
  get(name: string, tag: string, registry?: string): Promise<StoredRXM | null>;
  put(manifest: StoredRXM): Promise<void>;
  has(name: string, tag: string, registry?: string): Promise<boolean>;
  delete(name: string, tag: string, registry?: string): Promise<void>;
  listTags(name: string, registry?: string): Promise<string[]>;
  search(options?: RXMSearchOptions): Promise<StoredRXM[]>;
  deleteByRegistry(registry: string): Promise<void>;
}
```

### Provider Layer (`@resourcexjs/node-provider`)

Platform-specific implementations:

```typescript
import { NodeProvider, FileSystemRXAStore, FileSystemRXMStore } from "@resourcexjs/node-provider";

// Use with ResourceX client
import { setProvider, createResourceX } from "resourcexjs";
setProvider(new NodeProvider());
const rx = createResourceX();

// Use directly with server
const rxaStore = new FileSystemRXAStore("./data/blobs");
const rxmStore = new FileSystemRXMStore("./data/manifests");
```

### ResourceX API (`resourcexjs`)

Unified client API. Users only interact with:

- **path**: Local directory (for add)
- **locator**: Resource identifier string (e.g., `hello:1.0.0`)

```typescript
import { createResourceX, setProvider } from "resourcexjs";
import { NodeProvider } from "@resourcexjs/node-provider";

// Configure provider first
setProvider(new NodeProvider());

const rx = createResourceX({
  registry: "https://registry.mycompany.com",
});

// Local operations
await rx.add("./my-prompt"); // Add from directory to local storage
await rx.has("hello:1.0.0"); // Check if exists locally
await rx.remove("hello:1.0.0"); // Remove from local
const result = await rx.resolve("hello:1.0.0"); // Resolve locator & execute
const result2 = await rx.ingest("./my-skill"); // Ingest from any source & execute
const results = await rx.search("hello"); // Search local resources

// Remote operations
await rx.push("my-prompt:1.0.0"); // Push to remote registry
await rx.pull("hello:1.0.0"); // Pull from remote to local cache
await rx.clearCache(); // Clear cached remote resources

// Extension
rx.supportType(myCustomType); // Add custom type
```

### Configuration

```typescript
const rx = createResourceX({
  path: "~/.resourcex", // Storage path (default: ~/.resourcex)
  registry: "https://...", // Central registry URL (required for remote ops)
  types: [myType], // Custom types
  isolator: "none", // Sandbox: none | srt | cloudflare | e2b
});
```

### Locator Format

Docker-style locator format:

```
[registry/][path/]name[:tag]
```

```typescript
// Local: name:tag (no registry)
await rx.resolve("hello:1.0.0");

// Remote: registry/[path/]name:tag (with registry)
await rx.resolve("registry.example.com/hello:1.0.0");
await rx.resolve("localhost:3098/org/hello:1.0.0");
```

### Storage Directory Structure

Content-addressable storage (CAS):

```
~/.resourcex/
├── blobs/                        # Content-addressable blob storage
│   └── ab/
│       └── sha256:abcd1234...    # Archive data (tar.gz)
└── manifests/
    ├── _local/                   # Local resources (no registry)
    │   └── my-prompt/
    │       └── 1.0.0.json        # Manifest with digest reference
    └── registry.example.com/     # Cached remote resources
        └── hello/
            └── 1.0.0.json
```

### Resolve Flow

```
rx.resolve("hello:1.0.0")
  ↓
1. Parse locator (determine if local or remote)
2. Check CASRegistry for resource
3. If not found and registry configured:
   - Fetch from remote registry
   - Cache locally
4. Get BundledType from TypeHandlerChain
5. Execute resolver
6. Return Executable { execute, schema }
```

### Ingest Flow

```
rx.ingest("./my-skill")        // directory path
rx.ingest("hello:1.0.0")       // or RXL locator
  ↓
1. Check if input is a loadable source (SourceLoader.canLoad)
2. If source: add(source) → CAS, then resolve(locator)
3. If locator: resolve(locator) directly
4. All paths go through CAS — no shortcut bypasses storage
```

### Type System

```typescript
interface BundledType {
  name: string;           // "text", "json", "prompt"
  aliases?: string[];     // ["txt"], ["config"]
  description: string;
  schema?: JSONSchema;
  code: string;           // Bundled resolver code
}

// Built-in types
text   → aliases: [txt, plaintext]   → string
json   → aliases: [config, manifest] → unknown
binary → aliases: [bin, blob, raw]   → Uint8Array

// Register custom type
rx.supportType({
  name: "prompt",
  description: "AI prompt",
  code: `({
    async resolve(ctx) {
      return new TextDecoder().decode(ctx.files["content"]);
    }
  })`,
});
```

### ARP Layer

Low-level I/O primitives:

```typescript
import { createARP } from "resourcexjs/arp";

const arp = createARP();
const arl = arp.parse("arp:text:file:///path/to/file");

await arl.resolve(); // Get content
await arl.deposit(data); // Write content
await arl.exists(); // Check existence
await arl.delete(); // Delete
await arl.list(); // List directory
await arl.mkdir(); // Create directory
```

## Development Workflow

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

## Testing

- **Unit tests**: `packages/*/tests/unit/**/*.test.ts` (Bun test)
- **BDD tests**: `bdd/features/**/*.feature` + `bdd/steps/**/*.steps.ts` (Cucumber)
- **Tags**: @arp, @resourcex, @locator, @manifest, @resource-type, @registry

### BDD Testing Rules

**IMPORTANT**: BDD tests are end-to-end tests from user perspective:

1. **Only import from `resourcexjs`** - Never use internal packages
2. **Only test public API** - Never test internal implementation
3. **User perspective** - Test what users would actually do
4. **Provider setup** - Always configure provider before creating client

```typescript
// ✅ Good
import { createResourceX, setProvider } from "resourcexjs";
import { NodeProvider } from "@resourcexjs/node-provider";

setProvider(new NodeProvider());
const rx = createResourceX();

// ❌ Bad
import { CASRegistry } from "@resourcexjs/core";
```

## Error Hierarchy

```
ResourceXError (base)
├── LocatorError (RXL parsing)
├── ManifestError (RXM validation)
├── ContentError (RXA operations)
└── DefinitionError (RXD validation)

RegistryError (registry operations)
ResourceTypeError (type not found)

ARPError (base)
├── ParseError (URL parsing)
├── TransportError (transport not found)
└── SemanticError (semantic not found)
```

## TODO

- [x] Core primitives - parse, manifest, archive, resource, extract
- [x] CASRegistry - Content-addressable storage with deduplication
- [x] Provider architecture - Platform-specific implementations
- [x] ResourceX API - createResourceX with unified interface
- [x] ResourceX Server - HTTP API for hosting resources
- [x] Simplified API - Hide internal objects, users use path/locator only
- [ ] S3Storage, R2Storage - Cloud storage backends
