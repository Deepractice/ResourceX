# ARP Protocol Overview

ARP (Agent Resource Protocol) is the low-level I/O layer of ResourceX, providing a unified interface for AI agents to access resources across different transports and storage systems.

## What is ARP?

ARP is a URL-based protocol that decouples **what** data means from **how** it is accessed. It enables AI agents to read and write resources using a simple, consistent interface regardless of whether the resource is stored locally, on a remote server, or inside a packaged resource.

Think of ARP as the "filesystem layer" for AI agents - just as POSIX provides a unified file API across different filesystems, ARP provides a unified resource API across different transports.

## Why ARP?

AI agents need to access various types of resources:

- Local configuration files
- Remote API responses
- Files inside packaged resources (RXR)
- Cloud storage objects

Without ARP, agents would need transport-specific code for each case. ARP abstracts this complexity behind a single URL format and operation set.

**Key benefits:**

1. **Unified Interface** - One API for all resource access
2. **Extensible** - Add new transports without changing agent code
3. **Semantic Awareness** - Data interpretation is separate from transport
4. **Composable** - Combine transports and semantics freely

## URL Format

ARP URLs follow a structured format:

```
arp:{semantic}:{transport}://{location}
```

| Component   | Description               | Examples                           |
| ----------- | ------------------------- | ---------------------------------- |
| `semantic`  | How to interpret the data | `text`, `binary`                   |
| `transport` | How to access the data    | `file`, `https`, `http`, `rxr`     |
| `location`  | Where the data is         | `/path/to/file`, `example.com/api` |

**Examples:**

```typescript
// Local text file
"arp:text:file://./config/settings.json";

// Remote text resource
"arp:text:https://example.com/api/data";

// Local binary file
"arp:binary:file://./data/image.png";

// File inside a resource (RXR transport)
"arp:text:rxr://deepractice.ai/nuwa.role@1.0.0/thought/first-principles.md";
```

## Core Operations

ARP provides four fundamental operations on resources:

| Operation | Description              |
| --------- | ------------------------ |
| `resolve` | Read resource content    |
| `deposit` | Write resource content   |
| `exists`  | Check if resource exists |
| `delete`  | Remove the resource      |

```typescript
import { createARP } from "@resourcexjs/arp";

const arp = createARP();

// Parse URL into ARL (Agent Resource Locator)
const arl = arp.parse("arp:text:file://./data/hello.txt");

// Core operations
const resource = await arl.resolve(); // Read
await arl.deposit("Hello World"); // Write
const exists = await arl.exists(); // Check
await arl.delete(); // Remove
```

## Architecture Layers

ARP has two distinct layers that work together:

```
┌──────────────────────────────────────────────────┐
│                   Application                      │
│            (resolve/deposit/exists/delete)         │
└────────────────────────┬─────────────────────────┘
                         │
┌────────────────────────┴─────────────────────────┐
│              Semantic Layer                        │
│     (Interprets data: text, binary, etc.)         │
└────────────────────────┬─────────────────────────┘
                         │
┌────────────────────────┴─────────────────────────┐
│              Transport Layer                       │
│    (Moves bytes: file, http, https, rxr)          │
└──────────────────────────────────────────────────┘
```

- **Transport Layer**: Handles raw I/O (get/set bytes)
- **Semantic Layer**: Interprets the bytes (text encoding, binary handling)

This separation allows:

- Same transport with different semantics (file + text vs file + binary)
- Same semantic across different transports (text over file vs text over https)

## Relationship with ResourceX

ARP is the foundation layer that ResourceX builds upon:

```
┌─────────────────────────────────────────────────────┐
│                    ResourceX                         │
│  (RXL, RXM, RXC, RXR, Registry, TypeSystem)         │
└────────────────────────┬────────────────────────────┘
                         │ uses
┌────────────────────────┴────────────────────────────┐
│                       ARP                            │
│           (Low-level I/O primitives)                 │
└─────────────────────────────────────────────────────┘
```

**ResourceX** provides high-level resource management:

- RXL (Locator): `name.type@version`
- RXM (Manifest): Resource metadata
- RXC (Content): Archive-based content
- RXR (Resource): Complete resource package

**ARP** provides the underlying I/O:

- How to read/write files
- How to access HTTP resources
- How to read files inside RXR packages

The `rxr` transport bridges these layers, allowing ARP to access files inside ResourceX resources.

## Quick Start

```typescript
import { createARP } from "@resourcexjs/arp";

// Create ARP instance (includes default transports and semantics)
const arp = createARP();

// Read a local text file
const arl = arp.parse("arp:text:file://./README.md");
const resource = await arl.resolve();
console.log(resource.content); // File content as string

// Write content to a file
const writeArl = arp.parse("arp:text:file://./output.txt");
await writeArl.deposit("Hello, World!");

// Check if file exists
const exists = await writeArl.exists(); // true

// Read from HTTP
const httpArl = arp.parse("arp:text:https://api.example.com/data");
const httpResource = await httpArl.resolve();
```

## Package Structure

ARP is distributed in two packages:

**`@resourcexjs/arp`** - Base package with standard protocols:

- Transports: `file`, `http`, `https`
- Semantics: `text`, `binary`

**`resourcexjs/arp`** - Enhanced package with ResourceX integration:

- All standard protocols
- `rxr` transport for accessing files inside resources

```typescript
// Base package (standard protocols only)
import { createARP } from "@resourcexjs/arp";

// Enhanced package (includes RxrTransport)
import { createARP } from "resourcexjs/arp";
```

## Error Handling

ARP uses a typed error hierarchy:

```
ARPError (base)
├── ParseError      - URL parsing failed
├── TransportError  - Transport operation failed
└── SemanticError   - Semantic operation failed
```

```typescript
import { createARP, ParseError, TransportError } from "@resourcexjs/arp";

try {
  const arl = arp.parse("invalid-url");
} catch (error) {
  if (error instanceof ParseError) {
    console.error("Invalid ARP URL:", error.url);
  }
}

try {
  const arl = arp.parse("arp:text:file://./non-existent.txt");
  await arl.resolve();
} catch (error) {
  if (error instanceof TransportError) {
    console.error("Transport error:", error.transport);
  }
}
```

## Next Steps

- [ARL - Agent Resource Locator](./arl.md) - Working with parsed URLs
- [Transport Layer](./transport.md) - Built-in and custom transports
- [Semantic Layer](./semantic.md) - Data interpretation
