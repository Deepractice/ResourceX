# @resourcexjs/core

Core implementation of Agent Resource Protocol (ARP).

> **Note**: For most use cases, use the [`resourcexjs`](https://www.npmjs.com/package/resourcexjs) package instead. This package is for advanced usage and custom extensions.

## Installation

```bash
npm install @resourcexjs/core
# or
bun add @resourcexjs/core
```

## Usage

### Parse ARP URLs

```typescript
import { parseARP } from "@resourcexjs/core";

const parsed = parseARP("arp:text:https://example.com/file.txt");
// { semantic: "text", transport: "https", location: "example.com/file.txt" }
```

### Resolve Resources

```typescript
import { resolve } from "@resourcexjs/core";

const resource = await resolve("arp:text:https://example.com/file.txt");
// { type: "text", content: "...", meta: { ... } }
```

### Deposit Resources

```typescript
import { deposit } from "@resourcexjs/core";

await deposit("arp:text:file://./data/config.txt", "hello world");
```

### Check Existence & Delete

```typescript
import { resourceExists, resourceDelete } from "@resourcexjs/core";

const exists = await resourceExists("arp:text:file://./data/config.txt");
await resourceDelete("arp:text:file://./data/config.txt");
```

### Custom Transport Handler

Transport provides I/O primitives (read/write/list/exists/delete):

```typescript
import { registerTransportHandler, type TransportHandler } from "@resourcexjs/core";

const s3Handler: TransportHandler = {
  name: "s3",
  capabilities: {
    canRead: true,
    canWrite: true,
    canList: true,
    canDelete: true,
    canStat: false,
  },
  async read(location: string): Promise<Buffer> {
    // read from S3...
    return buffer;
  },
  async write(location: string, content: Buffer): Promise<void> {
    // write to S3...
  },
  async list(location: string): Promise<string[]> {
    // list S3 objects...
    return keys;
  },
};

registerTransportHandler(s3Handler);
```

### Custom Semantic Handler

Semantic orchestrates Transport primitives to handle resource logic:

```typescript
import { registerSemanticHandler, type SemanticHandler, type Resource } from "@resourcexjs/core";

const jsonHandler: SemanticHandler = {
  name: "json",
  async resolve(transport, location, context): Promise<Resource> {
    const buffer = await transport.read(location);
    return {
      type: "json",
      content: JSON.parse(buffer.toString("utf-8")),
      meta: {
        url: context.url,
        semantic: context.semantic,
        transport: context.transport,
        location: context.location,
        size: buffer.length,
        resolvedAt: context.timestamp.toISOString(),
      },
    };
  },
  async deposit(transport, location, data, context): Promise<void> {
    if (!transport.write) throw new Error("Transport does not support write");
    const buffer = Buffer.from(JSON.stringify(data), "utf-8");
    await transport.write(location, buffer);
  },
};

registerSemanticHandler(jsonHandler);
```

## Exports

### Functions

- `parseARP(url)` - Parse ARP URL string
- `resolve(url)` - Resolve ARP URL to resource
- `deposit(url, data)` - Deposit data to ARP URL
- `resourceExists(url)` - Check if resource exists
- `resourceDelete(url)` - Delete resource
- `getTransportHandler(name)` - Get registered transport handler
- `registerTransportHandler(handler)` - Register custom transport
- `getSemanticHandler(name)` - Get registered semantic handler
- `registerSemanticHandler(handler)` - Register custom semantic

### Built-in Handlers

**Transport:**

- `httpsHandler` - HTTPS protocol (read-only)
- `httpHandler` - HTTP protocol (read-only)
- `fileHandler` - Local file system (read/write/list/delete)

**Semantic:**

- `textHandler` - Plain text

### Error Classes

```typescript
import {
  ResourceXError, // Base error
  ParseError, // ARP URL parsing failed
  TransportError, // Transport layer failed
  SemanticError, // Semantic layer failed
} from "@resourcexjs/core";
```

### Types

```typescript
import type {
  ParsedARP,
  Resource,
  ResourceMeta,
  SemanticContext,
  TransportHandler,
  TransportCapabilities,
  ResourceStat,
  SemanticHandler,
  TextResource,
} from "@resourcexjs/core";
```

## License

MIT
