# ResourceX Architecture Overview

ResourceX is a resource management protocol for AI Agents, providing a standardized way to publish, discover, and consume resources. Think of it as "npm for AI resources" - a unified system for managing prompts, tools, configurations, and any other resources your agents need.

## Two-Layer Architecture

ResourceX uses a layered architecture that separates concerns between high-level resource management and low-level I/O operations:

```
+--------------------------------------------------+
|                   ResourceX Layer                 |
|  (RXL, RXM, RXC, RXR, Registry, TypeSystem)      |
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
- **RXC (Content)**: Archive-based content storage (tar.gz)
- **RXR (Resource)**: Complete resource combining locator, manifest, and content
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
|      RXC      |    |      RXM       |    |  TypeSystem    |
|   (Content)   |<---|   (Manifest)   |--->| (ResourceType) |
+-------+-------+    +-------+--------+    +----------------+
        |                    |
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
- **RXC** handles content (what does the resource contain?)
- **RXR** combines them into a complete unit

### 2. Pure Data Transfer Objects

RXR is designed as a pure DTO (Data Transfer Object):

```typescript
interface RXR {
  locator: RXL;
  manifest: RXM;
  content: RXC;
}

// Create directly from object literals
const rxr: RXR = { locator, manifest, content };
```

No factory functions or complex construction - just plain objects.

### 3. Archive-Based Content

All content is stored as tar.gz archives internally:

- Unified format for single and multi-file resources
- Streaming support for large files
- Standard compression for efficient storage

### 4. Lazy Execution

The resolver pattern delays content loading until needed:

```typescript
const resolved = await registry.resolve("my-resource.text@1.0.0");
// Content not loaded yet

const content = await resolved.execute();
// Now content is loaded
```

### 5. Extensible Type System

Custom resource types can define:

- How content is serialized for storage
- How content is resolved for execution
- Optional JSON Schema for typed arguments

## Package Structure

```
packages/
├── core/        # @resourcexjs/core
│                # RXL, RXM, RXC, RXR definitions
│
├── type/        # @resourcexjs/type
│                # ResourceType, TypeHandlerChain
│
├── registry/    # @resourcexjs/registry
│                # LocalRegistry, GitRegistry, RemoteRegistry
│
├── arp/         # @resourcexjs/arp
│                # Low-level I/O primitives
│
└── resourcex/   # resourcexjs
                 # Main package (re-exports all)
```

## Quick Start

```typescript
import { createRegistry, createRXM, createRXC, parseRXL } from "resourcexjs";

// Create a resource
const manifest = createRXM({
  domain: "localhost",
  name: "hello",
  type: "text",
  version: "1.0.0",
});

const content = await createRXC({ content: "Hello, World!" });

const rxr = {
  locator: parseRXL(manifest.toLocator()),
  manifest,
  content,
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
- [RXC - Resource Content](./resourcex/rxc-content.md)
- [RXR - Complete Resource](./resourcex/rxr-resource.md)
- [Type System](./resourcex/type-system.md)
- [Registry](./resourcex/registry.md)
