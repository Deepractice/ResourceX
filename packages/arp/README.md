# @resourcexjs/arp

Agent Resource Protocol (ARP) - A URL protocol for AI agents to access resources.

## Installation

```bash
bun add @resourcexjs/arp
# or
npm install @resourcexjs/arp
```

## Overview

ARP provides a unified URL-based abstraction for resource I/O operations. It separates **what** a resource means (semantic) from **where** and **how** to access it (transport).

### URL Format

```
arp:{semantic}:{transport}://{location}
```

| Component   | Description            | Examples                            |
| ----------- | ---------------------- | ----------------------------------- |
| `semantic`  | Content interpretation | `text`, `binary`                    |
| `transport` | Storage backend        | `file`, `http`, `https`             |
| `location`  | Resource path          | `/path/to/file`, `example.com/data` |

### Example URLs

```
arp:text:file:///path/to/file.txt       # Absolute file path
arp:text:file://./relative/file.txt     # Relative file path
arp:binary:https://example.com/image.png # HTTPS resource
arp:text:http://localhost:3000/data      # HTTP resource
```

## Quick Start

```typescript
import { createARP } from "@resourcexjs/arp";

const arp = createARP();

// Parse ARP URL into ARL (Agent Resource Locator)
const arl = arp.parse("arp:text:file://./data.txt");

// Core operations
await arl.deposit("Hello, World!"); // Write
const resource = await arl.resolve(); // Read
console.log(resource.content); // "Hello, World!"

if (await arl.exists()) {
  // Check existence
  await arl.delete(); // Delete
}
```

## Core Concepts

### ARI vs ARL

- **ARI (Agent Resource Identifier)**: Identifies resource type (semantic + transport)
- **ARL (Agent Resource Locator)**: Full locator with operations (semantic + transport + location)

```typescript
interface ARI {
  readonly semantic: string;
  readonly transport: string;
}

interface ARL extends ARI {
  readonly location: string;
  resolve(params?): Promise<Resource>;
  deposit(data, params?): Promise<void>;
  exists(): Promise<boolean>;
  delete(): Promise<void>;
  list(options?): Promise<string[]>;
  mkdir(): Promise<void>;
  toString(): string;
}
```

### Resource

The result of `arl.resolve()`:

```typescript
interface Resource<T = unknown> {
  type: string; // Semantic type ("text", "binary")
  content: T; // Content (string for text, Buffer for binary)
  meta: ResourceMeta; // Metadata
}

interface ResourceMeta {
  url: string; // Original ARP URL
  semantic: string;
  transport: string;
  location: string;
  size: number;
  encoding?: string; // e.g., "utf-8" for text
  mimeType?: string;
  resolvedAt: string; // ISO timestamp
  type?: "file" | "directory";
}
```

## Built-in Handlers

`createARP()` automatically registers standard handlers:

### Transports

| Name    | Description      | Read | Write | Exists | Delete | List | Mkdir |
| ------- | ---------------- | ---- | ----- | ------ | ------ | ---- | ----- |
| `file`  | Local filesystem | Yes  | Yes   | Yes    | Yes    | Yes  | Yes   |
| `http`  | HTTP resources   | Yes  | No    | Yes    | No     | No   | No    |
| `https` | HTTPS resources  | Yes  | No    | Yes    | No     | No   | No    |

### Semantics

| Name     | Input Type                                        | Output Type | Description        |
| -------- | ------------------------------------------------- | ----------- | ------------------ |
| `text`   | `string`                                          | `string`    | UTF-8 text content |
| `binary` | `Buffer`, `Uint8Array`, `ArrayBuffer`, `number[]` | `Buffer`    | Raw binary data    |

## API Reference

### `createARP(config?): ARP`

Create an ARP instance.

```typescript
interface ARPConfig {
  transports?: TransportHandler[]; // Custom transports
  semantics?: SemanticHandler[]; // Custom semantics
}

const arp = createARP();

// With custom handlers
const arp = createARP({
  transports: [myTransport],
  semantics: [mySemantic],
});
```

### `arp.parse(url): ARL`

Parse an ARP URL string into an ARL object.

```typescript
const arl = arp.parse("arp:text:file://./data.txt");

console.log(arl.semantic); // "text"
console.log(arl.transport); // "file"
console.log(arl.location); // "./data.txt"
console.log(arl.toString()); // "arp:text:file://./data.txt"
```

**Throws**: `ParseError` if URL format is invalid

### `arp.registerTransport(handler): void`

Register a custom transport handler.

```typescript
arp.registerTransport(myTransportHandler);
```

### `arp.registerSemantic(handler): void`

Register a custom semantic handler.

```typescript
arp.registerSemantic(mySemanticHandler);
```

### ARL Operations

#### `arl.resolve(params?): Promise<Resource>`

Read resource from location.

```typescript
const resource = await arl.resolve();
console.log(resource.type); // "text"
console.log(resource.content); // string or Buffer
console.log(resource.meta); // ResourceMeta
```

**Params**: `TransportParams` - Key-value pairs passed to transport

```typescript
// Pass parameters to transport
const resource = await arl.resolve({
  recursive: "true",
  pattern: "*.json",
});
```

#### `arl.deposit(data, params?): Promise<void>`

Write data to location.

```typescript
// Text semantic
await arl.deposit("Hello, World!");

// Binary semantic
await arl.deposit(Buffer.from([0x48, 0x69]));
await arl.deposit(new Uint8Array([1, 2, 3]));
await arl.deposit([1, 2, 3, 4]); // number array
```

**Throws**: `SemanticError` if semantic doesn't support deposit

#### `arl.exists(): Promise<boolean>`

Check if resource exists.

```typescript
if (await arl.exists()) {
  console.log("Resource exists");
}
```

#### `arl.delete(): Promise<void>`

Delete resource at location.

```typescript
await arl.delete();
```

#### `arl.list(options?): Promise<string[]>`

List directory contents (file transport only).

```typescript
interface ListOptions {
  recursive?: boolean; // List subdirectories
  pattern?: string; // Glob pattern filter (e.g., "*.json")
}

const arl = arp.parse("arp:text:file://./my-dir");
const files = await arl.list(); // ["file1.txt", "file2.txt"]
const all = await arl.list({ recursive: true }); // ["sub/file.txt", ...]
const json = await arl.list({ pattern: "*.json" }); // ["config.json", ...]
```

**Throws**: `TransportError` if transport doesn't support list

#### `arl.mkdir(): Promise<void>`

Create directory (file transport only).

```typescript
const arl = arp.parse("arp:text:file://./new-dir");
await arl.mkdir();
```

**Throws**: `TransportError` if transport doesn't support mkdir

## Transport Handlers

### Interface

```typescript
interface TransportHandler {
  readonly name: string;
  get(location: string, params?: TransportParams): Promise<TransportResult>;
  set(location: string, content: Buffer, params?: TransportParams): Promise<void>;
  exists(location: string): Promise<boolean>;
  delete(location: string): Promise<void>;
  list?(location: string, options?: ListOptions): Promise<string[]>;
  mkdir?(location: string): Promise<void>;
}

type TransportParams = Record<string, string>;

interface TransportResult {
  content: Buffer;
  metadata?: {
    type?: "file" | "directory";
    size?: number;
    modifiedAt?: Date;
    [key: string]: unknown;
  };
}
```

### File Transport

Local filesystem operations with full read-write support.

```typescript
// Paths
arp.parse("arp:text:file:///absolute/path.txt"); // Absolute
arp.parse("arp:text:file://./relative/path.txt"); // Relative to cwd

// Directory operations
const dir = arp.parse("arp:text:file://./my-dir");
await dir.mkdir(); // Create directory
const files = await dir.list({ recursive: true }); // List recursively
```

### HTTP/HTTPS Transport

Read-only network resource access.

```typescript
const arl = arp.parse("arp:text:https://example.com/data.txt");

// Read
const resource = await arl.resolve();

// Check existence (HEAD request)
const exists = await arl.exists();

// Query parameters
const arl2 = arp.parse("arp:text:https://api.example.com/data?format=json");
const resource2 = await arl2.resolve({ token: "abc123" }); // Merges params
```

**Note**: `set`, `delete`, `list`, `mkdir` throw `TransportError`

## Semantic Handlers

### Interface

```typescript
interface SemanticHandler<T = unknown> {
  readonly name: string;
  resolve(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<Resource<T>>;
  deposit?(
    transport: TransportHandler,
    location: string,
    data: T,
    context: SemanticContext
  ): Promise<void>;
  exists?(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<boolean>;
  delete?(transport: TransportHandler, location: string, context: SemanticContext): Promise<void>;
}

interface SemanticContext {
  url: string;
  semantic: string;
  transport: string;
  location: string;
  timestamp: Date;
  params?: TransportParams;
}
```

### Text Semantic

UTF-8 text handling.

```typescript
const arl = arp.parse("arp:text:file://./hello.txt");

await arl.deposit("Hello, World!");

const resource = await arl.resolve();
// resource.type = "text"
// resource.content = "Hello, World!" (string)
// resource.meta.encoding = "utf-8"
// resource.meta.mimeType = "text/plain"
```

### Binary Semantic

Raw binary data handling.

```typescript
const arl = arp.parse("arp:binary:file://./data.bin");

// Multiple input types supported
await arl.deposit(Buffer.from([1, 2, 3, 4]));
await arl.deposit(new Uint8Array([1, 2, 3, 4]));
await arl.deposit(new ArrayBuffer(4));
await arl.deposit([1, 2, 3, 4]); // number[]

const resource = await arl.resolve();
// resource.type = "binary"
// resource.content = Buffer
```

## Error Handling

```typescript
import { ARPError, ParseError, TransportError, SemanticError } from "@resourcexjs/arp";

try {
  const arl = arp.parse("invalid-url");
} catch (error) {
  if (error instanceof ParseError) {
    console.error("Invalid ARP URL:", error.url);
  }
}

try {
  await arl.resolve();
} catch (error) {
  if (error instanceof TransportError) {
    console.error("Transport failed:", error.transport);
  }
  if (error instanceof SemanticError) {
    console.error("Semantic failed:", error.semantic);
  }
}
```

### Error Hierarchy

```
ARPError (base)
├── ParseError      - Invalid ARP URL format
├── TransportError  - Transport operation failed
└── SemanticError   - Semantic operation failed
```

## Examples

### Copy File

```typescript
const source = arp.parse("arp:binary:file://./source.bin");
const dest = arp.parse("arp:binary:file://./dest.bin");

const { content } = await source.resolve();
await dest.deposit(content);
```

### Download and Save

```typescript
const remote = arp.parse("arp:text:https://example.com/data.txt");
const local = arp.parse("arp:text:file://./downloaded.txt");

const { content } = await remote.resolve();
await local.deposit(content);
```

### Conditional Write

```typescript
const arl = arp.parse("arp:text:file://./config.txt");

if (!(await arl.exists())) {
  await arl.deposit("default config");
}
```

### Process Directory

```typescript
const dir = arp.parse("arp:text:file://./data");

// List all JSON files recursively
const files = await dir.list({ recursive: true, pattern: "*.json" });

for (const file of files) {
  const fileArl = arp.parse(`arp:text:file://./data/${file}`);
  const { content } = await fileArl.resolve();
  console.log(`${file}: ${content.length} chars`);
}
```

## Custom Handlers

### Custom Transport

```typescript
import type { TransportHandler, TransportResult, TransportParams } from "@resourcexjs/arp";

class S3Transport implements TransportHandler {
  readonly name = "s3";

  async get(location: string, params?: TransportParams): Promise<TransportResult> {
    // location format: "bucket-name/key/path"
    const [bucket, ...keyParts] = location.split("/");
    const key = keyParts.join("/");

    const data = await s3.getObject({ Bucket: bucket, Key: key });
    return {
      content: Buffer.from(await data.Body!.transformToByteArray()),
      metadata: { type: "file", size: data.ContentLength },
    };
  }

  async set(location: string, content: Buffer, params?: TransportParams): Promise<void> {
    const [bucket, ...keyParts] = location.split("/");
    await s3.putObject({ Bucket: bucket, Key: keyParts.join("/"), Body: content });
  }

  async exists(location: string): Promise<boolean> {
    try {
      const [bucket, ...keyParts] = location.split("/");
      await s3.headObject({ Bucket: bucket, Key: keyParts.join("/") });
      return true;
    } catch {
      return false;
    }
  }

  async delete(location: string): Promise<void> {
    const [bucket, ...keyParts] = location.split("/");
    await s3.deleteObject({ Bucket: bucket, Key: keyParts.join("/") });
  }
}

// Register and use
const arp = createARP();
arp.registerTransport(new S3Transport());

const arl = arp.parse("arp:binary:s3://my-bucket/path/file.bin");
```

### Custom Semantic

```typescript
import type { SemanticHandler, Resource, SemanticContext, ResourceMeta } from "@resourcexjs/arp";
import type { TransportHandler } from "@resourcexjs/arp";

interface JsonResource extends Resource<unknown> {
  type: "json";
  content: unknown;
}

class JsonSemantic implements SemanticHandler<unknown> {
  readonly name = "json";

  async resolve(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<JsonResource> {
    const result = await transport.get(location, context.params);
    const text = result.content.toString("utf-8");
    const content = JSON.parse(text);

    const meta: ResourceMeta = {
      url: context.url,
      semantic: context.semantic,
      transport: context.transport,
      location: context.location,
      size: result.content.length,
      encoding: "utf-8",
      mimeType: "application/json",
      resolvedAt: context.timestamp.toISOString(),
      type: "file",
    };

    return { type: "json", content, meta };
  }

  async deposit(
    transport: TransportHandler,
    location: string,
    data: unknown,
    context: SemanticContext
  ): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(json, "utf-8");
    await transport.set(location, buffer, context.params);
  }
}

// Register and use
arp.registerSemantic(new JsonSemantic());

const arl = arp.parse("arp:json:file://./config.json");
await arl.deposit({ key: "value", nested: { foo: "bar" } });
const { content } = await arl.resolve(); // parsed object
```

## Exports

```typescript
// Core
export { ARP, createARP, type ARPConfig };
export type { ARI, ARL };
export const VERSION: string;

// Errors
export { ARPError, ParseError, TransportError, SemanticError };

// Transport
export type { TransportHandler, TransportResult, TransportParams, ListOptions };
export { FileTransportHandler, fileTransport };
export { HttpTransportHandler, httpTransport, httpsTransport };

// Semantic
export type { Resource, SemanticHandler, ResourceMeta, SemanticContext };
export type { TextResource, BinaryResource, BinaryInput };
export { TextSemanticHandler, textSemantic };
export { BinarySemanticHandler, binarySemantic };
```

## License

Apache-2.0
