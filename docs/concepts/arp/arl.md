# ARL - Agent Resource Locator

ARL (Agent Resource Locator) is the parsed representation of an ARP URL. It provides methods to interact with the resource at the specified location.

## What is ARL?

When you parse an ARP URL, you get an ARL object. The ARL encapsulates:

- The semantic type (how to interpret data)
- The transport type (how to access data)
- The location (where the data is)
- Methods to operate on the resource

```typescript
import { createARP } from "@resourcexjs/arp";

const arp = createARP();

// Parse URL into ARL
const arl = arp.parse("arp:text:file://./config.json");

// ARL properties
console.log(arl.semantic); // "text"
console.log(arl.transport); // "file"
console.log(arl.location); // "./config.json"
console.log(arl.toString()); // "arp:text:file://./config.json"
```

## ARL Interface

```typescript
interface ARL {
  // Properties
  readonly semantic: string; // e.g., "text", "binary"
  readonly transport: string; // e.g., "file", "https"
  readonly location: string; // e.g., "./data/file.txt"

  // Core operations
  resolve(params?: TransportParams): Promise<Resource>;
  deposit(data: unknown, params?: TransportParams): Promise<void>;
  exists(): Promise<boolean>;
  delete(): Promise<void>;

  // Extended operations (transport-dependent)
  list(options?: ListOptions): Promise<string[]>;
  mkdir(): Promise<void>;

  // Conversion
  toString(): string;
}
```

## Core Operations

### resolve()

Read the resource content. Returns a `Resource` object with the interpreted content and metadata.

```typescript
const arl = arp.parse("arp:text:file://./hello.txt");
const resource = await arl.resolve();

console.log(resource.type); // "text"
console.log(resource.content); // "Hello, World!"
console.log(resource.meta); // { url, semantic, transport, location, size, encoding, ... }
```

**With runtime parameters:**

```typescript
// Directory listing with filter
const dirArl = arp.parse("arp:text:file://./src");
const dirResource = await dirArl.resolve({ pattern: "*.ts" });
console.log(resource.content); // JSON array of matching files

// HTTP with query parameters
const httpArl = arp.parse("arp:text:https://api.example.com/data");
const httpResource = await httpArl.resolve({ format: "json", limit: "10" });
```

### deposit()

Write content to the resource location.

```typescript
const arl = arp.parse("arp:text:file://./output.txt");

// Deposit text content
await arl.deposit("Hello, World!");

// Parent directories are created automatically
const nestedArl = arp.parse("arp:text:file://./deep/nested/path/file.txt");
await nestedArl.deposit("Nested content"); // Creates directories
```

**Note:** Not all transports support deposit. HTTP/HTTPS transports are read-only and will throw an error.

```typescript
const httpArl = arp.parse("arp:text:https://example.com/file.txt");
await httpArl.deposit("content"); // Throws: "HTTP transport is read-only"
```

### exists()

Check if the resource exists at the location.

```typescript
const arl = arp.parse("arp:text:file://./config.json");

if (await arl.exists()) {
  const resource = await arl.resolve();
  // Process existing resource
} else {
  // Create default config
  await arl.deposit('{"default": true}');
}
```

### delete()

Remove the resource at the location.

```typescript
const arl = arp.parse("arp:text:file://./temp.txt");

// Delete the file
await arl.delete();

// Deleting non-existent file is a no-op (does not throw)
await arl.delete(); // Safe to call again

// Directories are deleted recursively
const dirArl = arp.parse("arp:binary:file://./temp-dir");
await dirArl.delete(); // Removes directory and all contents
```

**Note:** HTTP/HTTPS transports do not support delete.

## Extended Operations

Some transports support additional operations beyond the core four.

### list()

List contents of a directory. Only supported by transports that have directory semantics (e.g., `file`).

```typescript
const arl = arp.parse("arp:binary:file://./src");

// Basic listing
const files = await arl.list();
console.log(files); // ["index.ts", "utils.ts", "types.ts"]

// Recursive listing
const allFiles = await arl.list({ recursive: true });
console.log(allFiles); // ["index.ts", "utils/helpers.ts", "utils/format.ts"]

// With pattern filter
const tsFiles = await arl.list({ pattern: "*.ts" });
console.log(tsFiles); // ["index.ts", "utils.ts", "types.ts"]
```

**ListOptions:**

```typescript
interface ListOptions {
  recursive?: boolean; // Include subdirectories
  pattern?: string; // Glob pattern filter (e.g., "*.json")
}
```

### mkdir()

Create a directory at the location. Only supported by filesystem-like transports.

```typescript
const arl = arp.parse("arp:binary:file://./new-directory");

// Create directory (recursive by default)
await arl.mkdir();

// Create nested directories
const nestedArl = arp.parse("arp:binary:file://./deep/nested/path");
await nestedArl.mkdir(); // Creates all parent directories
```

## Parsing ARP URLs

The ARP instance validates URLs during parsing.

### Valid URL Formats

```typescript
// Local file
arp.parse("arp:text:file://./config.json");
arp.parse("arp:text:file:///absolute/path/file.txt");

// HTTP/HTTPS
arp.parse("arp:text:https://example.com/api/data");
arp.parse("arp:text:http://localhost:3000/status");

// With query parameters
arp.parse("arp:text:https://example.com/api?key=value&format=json");

// Binary resources
arp.parse("arp:binary:file://./image.png");
arp.parse("arp:binary:https://cdn.example.com/files/document.pdf");

// RXR transport (files inside resources)
arp.parse("arp:text:rxr://localhost/hello.text@1.0.0/content");
arp.parse("arp:text:rxr://deepractice.ai/nuwa.role@1.0.0/thought/first-principles.md");
```

### Parse Errors

The parser throws `ParseError` for invalid URLs:

```typescript
import { ParseError } from "@resourcexjs/arp";

try {
  // Missing arp: prefix
  arp.parse("text:file://./file.txt");
} catch (e) {
  // ParseError: Invalid ARP URL: must start with "arp:"
}

try {
  // Missing ://
  arp.parse("arp:text:file/path/file.txt");
} catch (e) {
  // ParseError: Invalid ARP URL: missing "://"
}

try {
  // Missing semantic or transport
  arp.parse("arp:file://./file.txt");
} catch (e) {
  // ParseError: Invalid ARP URL: must have exactly 2 types (semantic:transport)
}

try {
  // Unknown transport
  arp.parse("arp:text:ftp://server/file.txt");
} catch (e) {
  // TransportError: Unsupported transport type: ftp
}

try {
  // Unknown semantic
  arp.parse("arp:xml:file://./data.xml");
} catch (e) {
  // SemanticError: Unsupported semantic type: xml
}
```

## Resource Object

The `resolve()` method returns a `Resource` object:

```typescript
interface Resource<T = unknown> {
  type: string; // Semantic type: "text", "binary"
  content: T; // Interpreted content
  meta: ResourceMeta;
}

interface ResourceMeta {
  url: string; // Original ARP URL
  semantic: string; // Semantic type
  transport: string; // Transport type
  location: string; // Resource location
  size: number; // Content size in bytes
  encoding?: string; // Character encoding (for text)
  mimeType?: string; // MIME type
  resolvedAt: string; // ISO timestamp
  type?: "file" | "directory";
}
```

**Text resource example:**

```typescript
const textArl = arp.parse("arp:text:file://./hello.txt");
const textResource = await textArl.resolve();

// textResource = {
//   type: "text",
//   content: "Hello, World!",
//   meta: {
//     url: "arp:text:file://./hello.txt",
//     semantic: "text",
//     transport: "file",
//     location: "./hello.txt",
//     size: 13,
//     encoding: "utf-8",
//     mimeType: "text/plain",
//     resolvedAt: "2024-01-15T10:30:00.000Z",
//     type: "file"
//   }
// }
```

**Binary resource example:**

```typescript
const binaryArl = arp.parse("arp:binary:file://./image.png");
const binaryResource = await binaryArl.resolve();

// binaryResource = {
//   type: "binary",
//   content: <Buffer ...>,
//   meta: {
//     url: "arp:binary:file://./image.png",
//     semantic: "binary",
//     transport: "file",
//     location: "./image.png",
//     size: 1024,
//     resolvedAt: "2024-01-15T10:30:00.000Z",
//     type: "file"
//   }
// }
```

## Runtime Parameters

Runtime parameters can be passed to `resolve()` and `deposit()` to customize behavior:

```typescript
type TransportParams = Record<string, string>;
```

Parameters are transport-specific:

**File transport:**

- `recursive`: `"true"` - List directories recursively
- `pattern`: Glob pattern - Filter files (e.g., `"*.json"`)

**HTTP/HTTPS transport:**

- Any key-value pairs become query parameters
- Runtime params override URL query params on conflict

```typescript
// File: directory listing with filter
const dirArl = arp.parse("arp:text:file://./src");
await dirArl.resolve({ recursive: "true", pattern: "*.ts" });

// HTTP: add query parameters
const apiArl = arp.parse("arp:text:https://api.example.com/users");
await apiArl.resolve({ page: "1", limit: "10" });

// HTTP: override URL params
const urlArl = arp.parse("arp:text:https://api.example.com/users?limit=5");
await urlArl.resolve({ limit: "20" }); // Uses limit=20, not limit=5
```

## ARL vs ARI

ARP defines two related types:

- **ARI (Agent Resource Identifier)**: Identifies resource type without location
- **ARL (Agent Resource Locator)**: Full locator with location and operations

```typescript
// ARI - type identification only
interface ARI {
  readonly semantic: string;
  readonly transport: string;
}

// ARL - extends ARI with location and operations
interface ARL extends ARI {
  readonly location: string;
  resolve(...): Promise<Resource>;
  deposit(...): Promise<void>;
  exists(): Promise<boolean>;
  delete(): Promise<void>;
  // ...
}
```

In practice, you will mostly work with ARL objects returned by `arp.parse()`.

## Next Steps

- [Transport Layer](./transport.md) - How transports handle I/O
- [Semantic Layer](./semantic.md) - How semantics interpret data
- [ARP Protocol Overview](./protocol.md) - High-level architecture
