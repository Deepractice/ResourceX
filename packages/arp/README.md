# @resourcexjs/arp

Agent Resource Protocol - Low-level I/O primitives for ResourceX.

## Installation

```bash
bun add @resourcexjs/arp
```

## Overview

ARP (Agent Resource Protocol) provides a URL-based abstraction layer for resource I/O operations.

### URL Format

```
arp:{semantic}:{transport}://{location}
```

- **semantic**: Content interpretation (text, binary)
- **transport**: Storage backend (file, http, https)
- **location**: Resource location (path, URL)

### Examples

```
arp:text:file://~/data.txt
arp:binary:https://example.com/image.png
```

### Built-in Handlers

**createARP()** auto-registers standard protocol handlers:

**Transports:**

- `file` - Local filesystem (read-write)
- `http`, `https` - Network resources (read-only)

> **Note:** For `rxr` transport (ResourceX-specific), use `resourcexjs/arp` instead.
> The main package provides an enhanced `createARP()` that includes RxrTransport.

**Semantics:**

- `text` - UTF-8 text -> string
- `binary` - Raw bytes -> Buffer

## Usage

### Basic Operations

```typescript
import { createARP } from "@resourcexjs/arp";

const arp = createARP();

// Parse ARP URL
const arl = arp.parse("arp:text:file://./data.txt");

// Read
const resource = await arl.resolve();
console.log(resource.content); // string (text semantic)

// Write
await arl.deposit("Hello, World!");

// Check existence
if (await arl.exists()) {
  console.log("File exists");
}

// Delete
await arl.delete();
```

### Text Semantic

```typescript
const arl = arp.parse("arp:text:file://./hello.txt");

// Write text
await arl.deposit("Hello, World!");

// Read text
const resource = await arl.resolve();
console.log(resource.content); // "Hello, World!" (string)
```

### Binary Semantic

```typescript
const arl = arp.parse("arp:binary:file://./data.bin");

// Write binary
const buffer = Buffer.from([1, 2, 3, 4]);
await arl.deposit(buffer);

// Read binary
const resource = await arl.resolve();
console.log(resource.content); // Buffer
```

## API Reference

### `createARP(config?)`

Create ARP instance with registered handlers.

**Parameters:**

- `config?: ARPConfig` - Optional configuration

**Returns**: `ARP`

```typescript
const arp = createARP();
```

### `ARP.parse(url: string): ARL`

Parse ARP URL and return ARL (Agent Resource Locator).

**Parameters:**

- `url: string` - ARP URL

**Returns**: `ARL`

**Throws**: `ParseError` if URL is invalid

```typescript
const arl = arp.parse("arp:text:file://./data.txt");
```

### `ARP.registerTransport(transport: TransportHandler): void`

Register a custom transport handler.

```typescript
arp.registerTransport(new S3Transport());
```

### `ARP.registerSemantic(semantic: SemanticHandler): void`

Register a custom semantic handler.

```typescript
arp.registerSemantic(new JsonSemantic());
```

### ARL Operations

#### `resolve(params?): Promise<Resource>`

Read resource from location.

**Parameters:**

- `params?: TransportParams` - Optional parameters passed to transport

**Returns**: `Promise<Resource>`

- `{ content: string }` for text semantic
- `{ content: Buffer }` for binary semantic

**Throws**: `TransportError` if operation fails

```typescript
const resource = await arl.resolve();
console.log(resource.content);
```

#### `deposit(data: unknown, params?): Promise<void>`

Write resource to location.

**Parameters:**

- `data: unknown` - Content to write (string, Buffer, Uint8Array, ArrayBuffer, number[])
- `params?: TransportParams` - Optional parameters passed to transport

**Throws**: `TransportError` if operation fails

```typescript
await arl.deposit("Hello");
await arl.deposit(Buffer.from([1, 2, 3]));
```

#### `exists(): Promise<boolean>`

Check if resource exists.

**Returns**: `Promise<boolean>`

```typescript
if (await arl.exists()) {
  console.log("Resource exists");
}
```

#### `delete(): Promise<void>`

Delete resource from location.

**Throws**: `TransportError` if operation fails

```typescript
await arl.delete();
```

## Transport Handlers

Transport handlers implement a unified interface:

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

### File Transport (`file`)

Local filesystem operations.

```typescript
// Absolute path
arp.parse("arp:text:file:///absolute/path/file.txt");

// Relative path
arp.parse("arp:text:file://./relative/path/file.txt");

// Home directory
arp.parse("arp:text:file://~/file.txt");
```

**Operations:**

- get (read file)
- set (write file)
- exists (check file)
- delete (remove file)

### HTTP/HTTPS Transport

Network resource operations (read-only).

```typescript
arp.parse("arp:text:https://example.com/data.txt");
arp.parse("arp:binary:https://example.com/image.png");
```

**Operations:**

- get (read) - supported
- set (write) - throws error
- exists - not supported
- delete - throws error

## Semantic Handlers

```typescript
interface SemanticHandler {
  readonly name: string;
  encode(data: unknown): Promise<Buffer>;
  decode(buffer: Buffer): Promise<unknown>;
}
```

### Text Semantic (`text`)

Interprets content as UTF-8 text.

- **Input**: `string` or `Buffer`
- **Output**: `string`

### Binary Semantic (`binary`)

Interprets content as raw bytes.

- **Input**: `Buffer` or `string`
- **Output**: `Buffer`

## Error Handling

```typescript
import { ParseError, TransportError, SemanticError } from "@resourcexjs/arp";

try {
  const arl = arp.parse("arp:invalid:url");
} catch (error) {
  if (error instanceof ParseError) {
    console.error("Invalid ARP URL");
  }
}

try {
  await arl.resolve();
} catch (error) {
  if (error instanceof TransportError) {
    console.error("Transport operation failed");
  }
}
```

### Error Types

- **ARPError**: Base error class
- **ParseError**: Invalid ARP URL format
- **TransportError**: Transport operation failed
- **SemanticError**: Semantic handler error

## Examples

### Copy File

```typescript
const source = arp.parse("arp:binary:file://./source.bin");
const dest = arp.parse("arp:binary:file://./dest.bin");

// Read from source
const { content } = await source.resolve();

// Write to destination
await dest.deposit(content);
```

### Download and Save

```typescript
// Download from URL
const remote = arp.parse("arp:text:https://example.com/data.txt");
const { content } = await remote.resolve();

// Save locally
const local = arp.parse("arp:text:file://./downloaded.txt");
await local.deposit(content);
```

### Conditional Write

```typescript
const arl = arp.parse("arp:text:file://./file.txt");

if (!(await arl.exists())) {
  await arl.deposit("New content");
}
```

## Custom Handlers

### Custom Transport

```typescript
import type { TransportHandler, TransportParams, TransportResult } from "@resourcexjs/arp";

class S3Transport implements TransportHandler {
  readonly name = "s3";

  async get(location: string, params?: TransportParams): Promise<TransportResult> {
    const data = await s3.getObject({ Bucket: "...", Key: location });
    return {
      content: data.Body as Buffer,
      metadata: { type: "file", size: data.ContentLength },
    };
  }

  async set(location: string, content: Buffer, params?: TransportParams): Promise<void> {
    await s3.putObject({ Bucket: "...", Key: location, Body: content });
  }

  async exists(location: string): Promise<boolean> {
    try {
      await s3.headObject({ Bucket: "...", Key: location });
      return true;
    } catch {
      return false;
    }
  }

  async delete(location: string): Promise<void> {
    await s3.deleteObject({ Bucket: "...", Key: location });
  }
}

// Register
const arp = createARP();
arp.registerTransport(new S3Transport());

// Use
const arl = arp.parse("arp:binary:s3://my-bucket/file.bin");
```

### Custom Semantic

```typescript
import type { SemanticHandler } from "@resourcexjs/arp";

class JsonSemantic implements SemanticHandler {
  readonly name = "json";

  async encode(data: unknown): Promise<Buffer> {
    const json = JSON.stringify(data, null, 2);
    return Buffer.from(json, "utf-8");
  }

  async decode(buffer: Buffer): Promise<unknown> {
    const text = buffer.toString("utf-8");
    return JSON.parse(text);
  }
}

// Register
arp.registerSemantic(new JsonSemantic());

// Use
const arl = arp.parse("arp:json:file://./data.json");
await arl.deposit({ key: "value" });
const { content } = await arl.resolve(); // parsed JSON
```

## Exports

```typescript
// Core
export { ARP, createARP, type ARPConfig };
export type { ARI, ARL };
export const VERSION: string;

// Errors
export { ARPError, ParseError, TransportError, SemanticError };

// Transports
export type { TransportHandler, TransportResult, TransportParams, ListOptions };
export { FileTransportHandler, fileTransport };
export { HttpTransportHandler, httpTransport, httpsTransport };

// Semantics
export type { Resource, SemanticHandler, ResourceMeta, SemanticContext };
export type { TextResource, BinaryResource, BinaryInput };
export { TextSemanticHandler, textSemantic };
export { BinarySemanticHandler, binarySemantic };
```

## License

MIT
