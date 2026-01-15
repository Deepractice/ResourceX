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

### Custom Transport Handler

```typescript
import { registerTransportHandler, type TransportHandler } from "@resourcexjs/core";

const s3Handler: TransportHandler = {
  protocol: "s3",
  async fetch(location: string): Promise<Buffer> {
    // fetch from S3...
    return buffer;
  },
};

registerTransportHandler(s3Handler);
```

### Custom Semantic Handler

```typescript
import { registerSemanticHandler, type SemanticHandler, type Resource } from "@resourcexjs/core";

const jsonHandler: SemanticHandler = {
  type: "json",
  parse(content: Buffer, context): Resource {
    return {
      type: "json",
      content: JSON.parse(content.toString("utf-8")),
      meta: {
        /* ... */
      },
    };
  },
};

registerSemanticHandler(jsonHandler);
```

## Exports

### Functions

- `parseARP(url)` - Parse ARP URL string
- `resolve(url)` - Resolve ARP URL to resource
- `getTransportHandler(protocol)` - Get registered transport handler
- `registerTransportHandler(handler)` - Register custom transport
- `getSemanticHandler(type)` - Get registered semantic handler
- `registerSemanticHandler(handler)` - Register custom semantic

### Built-in Handlers

**Transport:**

- `httpsHandler` - HTTPS protocol
- `httpHandler` - HTTP protocol
- `fileHandler` - Local file system

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
  ParseContext,
  TransportHandler,
  SemanticHandler,
  TextResource,
} from "@resourcexjs/core";
```

## License

MIT
