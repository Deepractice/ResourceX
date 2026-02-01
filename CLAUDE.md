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

2. **Storage Layer** - Pure key-value I/O (`@resourcexjs/storage`)
   - FileSystemStorage, MemoryStorage, S3Storage (planned)
   - Simple interface: get, put, delete, exists, list

3. **Registry Layer** - Business logic for RXR (`@resourcexjs/registry`)
   - LocalRegistry: Local resources (no registry in path)
   - MirrorRegistry: Cached remote resources (with registry)
   - LinkedRegistry: Development symlinks

4. **ResourceX API** - Unified client API (`resourcexjs`)
   - `createResourceX()` - Main entry point
   - Combines all layers for seamless resource management

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
├── core/        # @resourcexjs/core - RXL, RXM, RXA, RXR primitives
├── type/        # @resourcexjs/type - Type system (BundledType, TypeHandlerChain)
├── storage/     # @resourcexjs/storage - Storage layer (FileSystem, Memory)
├── registry/    # @resourcexjs/registry - Registry layer (Hosted, Mirror, Linked)
├── loader/      # @resourcexjs/loader - Resource loading (FolderLoader)
└── resourcex/   # resourcexjs - Main package (ResourceX API)
```

### Core Primitives (`@resourcexjs/core`)

```typescript
// Parse locator string to RXL
const rxl = parse("deepractice.ai/hello.text@1.0.0");

// Create manifest from definition
const rxm = manifest({ name: "hello", type: "text", version: "1.0.0" });

// Create archive from content
const rxa = await archive({ content: Buffer.from("Hello!") });

// Create resource (RXR = RXL + RXM + RXA)
const rxr = resource(rxm, rxa);

// Extract archive to files
const files = await extract(rxa); // Record<string, Buffer>

// Format RXL to string
const locatorStr = format(rxl); // "deepractice.ai/hello.text@1.0.0"

// Wrap raw buffer as RXA
const rxa = wrap(buffer);
```

### Storage Layer (`@resourcexjs/storage`)

Pure key-value storage abstraction:

```typescript
interface Storage {
  get(key: string): Promise<Buffer>;
  put(key: string, data: Buffer): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
}

// Implementations
FileSystemStorage; // Local filesystem
MemoryStorage; // In-memory (for testing)
```

### Registry Layer (`@resourcexjs/registry`)

Business logic for RXR operations:

```typescript
interface Registry {
  get(rxl: RXL): Promise<RXR>;
  put(rxr: RXR): Promise<void>;
  has(rxl: RXL): Promise<boolean>;
  remove(rxl: RXL): Promise<void>;
  list(options?: SearchOptions): Promise<RXL[]>;
}

// Registry types
HostedRegistry; // Resources you own (authoritative)
MirrorRegistry; // Cached remote resources (can clear)
LinkedRegistry; // Development symlinks (live editing)
```

### ResourceX API (`resourcexjs`)

Unified client API combining all layers. Users only interact with:

- **path**: Local directory (for add, push, link)
- **locator**: Resource identifier string (e.g., `hello.text@1.0.0`)

```typescript
import { createResourceX } from "resourcexjs";

const rx = createResourceX({
  registry: "https://registry.mycompany.com",
});

// Local operations
await rx.add("./my-prompt"); // Add from directory to local storage
await rx.link("./dev-prompt"); // Link for live development
await rx.has("hello.text@1.0.0"); // Check if exists locally
await rx.remove("hello.text@1.0.0"); // Remove from local
const result = await rx.use("hello.text@1.0.0"); // Use & execute
const results = await rx.search("hello"); // Search local resources

// Remote operations
await rx.push("./my-prompt"); // Push directory to remote registry
await rx.pull("registry.example.com/hello.text@1.0.0"); // Pull from remote to local cache

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

Two locator formats (Go-style):

```typescript
// Local: name.type@version (no registry)
await rx.use("hello.text@1.0.0");

// Remote: registry/[path/]name.type@version (with registry)
await rx.use("registry.example.com/hello.text@1.0.0");
```

### Storage Directory Structure

```
~/.resourcex/
├── local/                   # LocalRegistry - local resources (no registry)
│   └── my-tool.text/
│       └── 1.0.0/
│           ├── manifest.json
│           └── archive.tar.gz
├── cache/                   # MirrorRegistry - cached remote (with registry)
│   └── deepractice.ai/
│       └── hello.text/
│           └── 1.0.0/
│               ├── manifest.json
│               └── archive.tar.gz
└── linked/                  # LinkedRegistry - dev symlinks
    └── {registry}/
        └── dev.text/
            └── 1.0.0 → /path/to/dev
```

### Use Flow

```
rx.use("hello.text@1.0.0")
  ↓
1. Parse locator (determine if local or remote)
2. Check linked (development priority)
3. Check local (no registry) or cache (with registry)
4. If registry configured and has registry in locator:
   - Fetch from remote registry
   - Cache locally
5. Get BundledType from TypeHandlerChain
6. Execute resolver
7. Return Executable { execute, schema }
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

```typescript
// ✅ Good
const { createResourceX } = await import("resourcexjs");
const rx = createResourceX();

// ❌ Bad
const { HostedRegistry } = await import("@resourcexjs/registry");
```

## Error Hierarchy

```
ResourceXError (base)
├── LocatorError (RXL parsing)
├── ManifestError (RXM validation)
├── ContentError (RXA operations)
└── DefinitionError (RXD validation)

StorageError (storage operations)
RegistryError (registry operations)
ResourceTypeError (type not found)

ARPError (base)
├── ParseError (URL parsing)
├── TransportError (transport not found)
└── SemanticError (semantic not found)
```

## TODO

- [x] Storage layer - FileSystemStorage, MemoryStorage
- [x] Registry layer - HostedRegistry, MirrorRegistry, LinkedRegistry
- [x] ResourceX API - createResourceX with unified interface
- [x] Core primitives - parse, manifest, archive, resource, extract
- [x] Simplified API - Hide internal objects, users use path/locator only
- [ ] ResourceX Server - HTTP API for hosting resources
- [ ] S3Storage, R2Storage - Cloud storage backends
- [ ] Update BDD tests to match new simplified API
