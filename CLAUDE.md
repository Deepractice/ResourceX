# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
interface ResourceType<T> {
  name: string;               // "text", "json", "prompt"
  aliases?: string[];         // ["txt"], ["config"]
  description: string;
  serializer: ResourceSerializer;  // RXR ↔ Buffer (for storage)
  resolver: ResourceResolver<T>;   // RXR → usable object
}

// Built-in types
text   → aliases: [txt, plaintext]
json   → aliases: [config, manifest]
binary → aliases: [bin, blob, raw]
```

**TypeHandlerChain** - Responsibility chain for type handling:

```typescript
chain.register(type); // Register a type
chain.canHandle(name); // Check if type supported
chain.serialize(rxr); // RXR → Buffer
chain.deserialize(data, manifest); // Buffer → RXR
chain.resolve<T>(rxr); // RXR → usable object
```

Used by Registry to delegate serialization logic.

### Registry

**Registry Interface:**

```typescript
interface Registry {
  link(resource: RXR): Promise<void>; // Link to local (~/.resourcex)
  resolve(locator: string): Promise<RXR>; // Resolve (local-first)
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

**ARPRegistry Implementation:**

- Uses ARP for atomic I/O (read/write via arp:text:file://)
- Uses TypeHandlerChain for serialization/deserialization
- Storage: `~/.resourcex/{domain}/{path}/{name}.{type}@{version}/`

**Storage Structure:**

```
~/.resourcex/
└── {domain}/
    └── {path}/
        └── {name}.{type}@{version}/
            ├── manifest.json    # RXM as JSON
            └── content          # RXC as tar.gz archive
```

### Resolution Flow

```
registry.resolve("deepractice.ai/assistant.prompt@1.0.0")
  ↓
1. Check local: ~/.resourcex/deepractice.ai/assistant.prompt@1.0.0/manifest.json
2. If exists:
   - Read manifest.json → createRXM(json)
   - Get ResourceType by manifest.type
   - Read content → Buffer
   - typeChain.deserialize(buffer, manifest) → RXR
3. If not exists:
   - TODO: Fetch from remote registry (domain-based)
   - Cache to local
   - Return RXR
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

- `file` - Local filesystem
  - `get`: Returns file content or directory listing (JSON array)
  - Params: `recursive="true"`, `pattern="*.json"`
- `http`, `https` - Network (read-only)
  - Merges URL query params with runtime params
  - `set`/`delete` throw "read-only" error

**Semantic handlers:**

- `text` - UTF-8 text
- `binary` - Raw bytes (Buffer, Uint8Array, ArrayBuffer, number[])

**Default registration:** `createARP()` auto-registers all built-in handlers.

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
// ARPRegistry (storage layer)
class ARPRegistry implements Registry {
  private typeChain: TypeHandlerChain;

  async link(rxr: RXR) {
    // Delegate to chain
    const buffer = await this.typeChain.serialize(rxr);

    // Store using ARP
    await this.arp.parse(url).deposit(buffer);
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
createRegistry(config?: { path?, types? }): Registry

registry.link(rxr): Promise<void>
registry.resolve(locator): Promise<RXR>
registry.exists(locator): Promise<boolean>
registry.delete(locator): Promise<void>
registry.search(options?): Promise<RXL[]>   // { query?, limit?, offset? }
registry.publish(rxr): Promise<void>        // TODO: remote publish
```

### ARP Package (`@resourcexjs/arp`)

```typescript
createARP(config?: ARPConfig): ARP

arp.parse(url: string): ARL

arl.resolve(params?: TransportParams): Promise<Resource>
arl.deposit(data: unknown, params?: TransportParams): Promise<void>
arl.exists(): Promise<boolean>
arl.delete(): Promise<void>

// Transports (for direct use)
fileTransport: TransportHandler
httpTransport: TransportHandler
httpsTransport: TransportHandler
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
- [ ] Registry.publish() - Remote publishing to domain-based registry
- [ ] Remote resolution - Fetch from remote when not in local cache
