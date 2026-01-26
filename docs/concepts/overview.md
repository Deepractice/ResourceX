# ResourceX Architecture Overview

ResourceX is a resource management protocol for AI Agents, providing a standardized way to publish, discover, and consume resources. Think of it as "npm for AI resources" - a unified system for managing prompts, tools, configurations, and any other resources your agents need.

## Two-Layer Architecture

ResourceX uses a layered architecture that separates concerns between high-level resource management and low-level I/O operations:

```
+--------------------------------------------------+
|                   ResourceX Layer                 |
|  (RXL, RXM, RXA, RXP, RXR, Registry, TypeSystem) |
+--------------------------------------------------+
                         |
                         v
+--------------------------------------------------+
|                    ARP Layer                      |
|  (Agent Resource Protocol - Low-level I/O)       |
+--------------------------------------------------+
```

### ResourceX Layer (High-Level)

The ResourceX layer provides:

- **RXL (Locator)**: Human-readable resource addresses
- **RXM (Manifest)**: Resource metadata (domain, name, type, version)
- **RXA (Archive)**: Compressed archive for storage/transfer (tar.gz)
- **RXP (Package)**: Extracted package for runtime file access
- **RXR (Resource)**: Complete resource combining locator, manifest, and archive
- **Registry**: Resource storage and retrieval operations
- **TypeSystem**: Extensible type handling with serialization and resolution

### ARP Layer (Low-Level)

The ARP (Agent Resource Protocol) layer provides:

- **Transports**: File, HTTP, HTTPS, RXR (access files inside resources)
- **Semantics**: Text, Binary content interpretation
- **Operations**: resolve, deposit, exists, delete

## Core Object Relationships

```
                     +----------------+
                     |      RXL       |
                     |   (Locator)    |
                     +-------+--------+
                             |
                             | parsed from
                             v
+---------------+    +----------------+    +----------------+
|      RXA      |    |      RXM       |    |  TypeSystem    |
|   (Archive)   |<---|   (Manifest)   |--->| (ResourceType) |
+-------+-------+    +-------+--------+    +----------------+
        |                    |
        | extract()          |
        v                    |
+---------------+            |
|      RXP      |            |
|   (Package)   |            |
+-------+-------+            |
        |                    |
        +--------+   +-------+
                 |   |
                 v   v
             +----------+
             |   RXR    |
             | (Resource)|
             +----+-----+
                  |
                  | stored in / retrieved from
                  v
             +----------+
             | Registry |
             +----------+
```

## Design Philosophy

### 1. Separation of Concerns

Each component has a single responsibility:

- **RXL** handles addressing (where is the resource?)
- **RXM** handles metadata (what is the resource?)
- **RXA** handles storage (compressed archive for transfer)
- **RXP** handles access (extracted files for runtime)
- **RXR** combines them into a complete unit

### 2. Pure Data Transfer Objects

RXR is designed as a pure DTO (Data Transfer Object):

```typescript
interface RXR {
  locator: RXL;
  manifest: RXM;
  archive: RXA;
}

// Create directly from object literals
const rxr: RXR = { locator, manifest, archive };
```

No factory functions or complex construction - just plain objects.

### 3. Archive-Based Content

All content is stored as tar.gz archives internally:

- Unified format for single and multi-file resources
- Streaming support for large files
- Standard compression for efficient storage

The archive (RXA) is extracted to a package (RXP) for runtime file access:

```typescript
const pkg = await archive.extract();
const content = await pkg.file("content");
```

### 4. Lazy Execution

The resolver pattern delays content loading until needed:

```typescript
const resolved = await registry.resolve("my-resource.text@1.0.0");
// Content not loaded yet

const content = await resolved.execute();
// Now content is loaded
```

### 5. Extensible Type System

Custom resource types use a **BundledType** architecture for sandbox-compatible execution:

- Bundled resolver code that can execute in isolated sandboxes
- Optional JSON Schema for typed arguments
- Multiple sandbox isolation levels (none, srt, cloudflare, e2b)

## Package Structure

```
packages/
├── core/        # @resourcexjs/core
│                # RXL, RXM, RXA, RXP, RXR definitions
│
├── type/        # @resourcexjs/type
│                # BundledType, TypeHandlerChain, ResolverExecutor
│
├── registry/    # @resourcexjs/registry
│                # Registry, LocalStorage
│
├── arp/         # @resourcexjs/arp
│                # Low-level I/O primitives
│
└── resourcex/   # resourcexjs
                 # Main package (re-exports all)
```

## Quick Start

```typescript
import { createRegistry, createRXM, createRXA, parseRXL } from "resourcexjs";

// Create a resource
const manifest = createRXM({
  domain: "localhost",
  name: "hello",
  type: "text",
  version: "1.0.0",
});

const archive = await createRXA({ content: "Hello, World!" });

const rxr = {
  locator: parseRXL(manifest.toLocator()),
  manifest,
  archive,
};

// Store it
const registry = createRegistry();
await registry.add(rxr);

// Retrieve it
const resolved = await registry.resolve("hello.text@1.0.0");
const text = await resolved.execute();
console.log(text); // "Hello, World!"
```

## Next Steps

- [RXL - Resource Locator](./resourcex/rxl-locator.md)
- [RXM - Resource Manifest](./resourcex/rxm-manifest.md)
- [RXA - Resource Archive](./resourcex/rxa-archive.md)
- [RXP - Resource Package](./resourcex/rxp-package.md)
- [RXR - Complete Resource](./resourcex/rxr-resource.md)
- [Type System](./resourcex/type-system.md)
- [Registry](./resourcex/registry.md)
