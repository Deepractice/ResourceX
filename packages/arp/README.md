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
- **transport**: Storage backend (file, http, https, agentvm)
- **location**: Resource location (path, URL)

### Examples

```
arp:text:file://~/data.txt
arp:binary:https://example.com/image.png
arp:text:agentvm://sandbox/config.json
```

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

### ARL Operations

#### `resolve(): Promise<Resource>`

Read resource from location.

**Returns**: `Promise<Resource>`

- `{ content: string }` for text semantic
- `{ content: Buffer }` for binary semantic

**Throws**: `TransportError` if operation fails

```typescript
const resource = await arl.resolve();
console.log(resource.content);
```

#### `deposit(data: string | Buffer): Promise<void>`

Write resource to location.

**Parameters:**

- `data: string | Buffer` - Content to write

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

## Semantic Handlers

### Text Semantic (`text`)

Interprets content as UTF-8 text.

- **Input**: `string` or `Buffer`
- **Output**: `string`

```typescript
const arl = arp.parse("arp:text:file://./file.txt");
await arl.deposit("Hello"); // string
const { content } = await arl.resolve(); // string
```

### Binary Semantic (`binary`)

Interprets content as raw bytes.

- **Input**: `Buffer` or `string`
- **Output**: `Buffer`

```typescript
const arl = arp.parse("arp:binary:file://./file.bin");
await arl.deposit(Buffer.from([1, 2, 3]));
const { content } = await arl.resolve(); // Buffer
```

## Transport Handlers

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

- ✅ resolve (read)
- ✅ deposit (write)
- ✅ exists
- ✅ delete

### HTTP/HTTPS Transport

Network resource operations (read-only).

```typescript
arp.parse("arp:text:https://example.com/data.txt");
arp.parse("arp:binary:https://example.com/image.png");
```

**Operations:**

- ✅ resolve (read)
- ❌ deposit (not supported)
- ❌ exists (not supported)
- ❌ delete (not supported)

### AgentVM Transport (`agentvm`)

AgentVM sandbox storage (`~/.agentvm/`).

```typescript
arp.parse("arp:text:agentvm://sandbox/config.json");
// Maps to: ~/.agentvm/sandbox/config.json
```

**Operations:**

- ✅ resolve (read)
- ✅ deposit (write)
- ✅ exists
- ✅ delete

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
import type { TransportHandler } from "@resourcexjs/arp";

class S3Transport implements TransportHandler {
  protocol = "s3";

  async resolve(location: string) {
    // Fetch from S3
    const data = await s3.getObject({ Bucket: "...", Key: location });
    return data.Body;
  }

  async deposit(location: string, data: Buffer) {
    // Upload to S3
    await s3.putObject({ Bucket: "...", Key: location, Body: data });
  }

  // ... other methods
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
  name = "json";

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

## Architecture

```
┌──────────────────────────────────────┐
│             ARP                      │
└────────────┬─────────────────────────┘
             │
      ┌──────┴──────┐
      │   parse()   │
      └──────┬──────┘
             │
      ┌──────▼──────┐
      │    ARL      │ (Agent Resource Locator)
      └──────┬──────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼───┐      ┌──────▼──────┐
│Semantic│     │  Transport  │
│Handler │     │  Handler    │
└────────┘     └─────────────┘
```

## License

MIT
