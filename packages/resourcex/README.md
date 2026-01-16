# resourcexjs

Agent Resource Protocol (ARP) for AI Agents.

## Installation

```bash
npm install resourcexjs
# or
bun add resourcexjs
```

## Quick Start

```typescript
import { createResourceX } from "resourcexjs";

const rx = createResourceX();

// Resolve a remote text resource
const resource = await rx.resolve("arp:text:https://example.com/file.txt");

console.log(resource.type); // "text"
console.log(resource.content); // file content as string
console.log(resource.meta); // { url, semantic, transport, ... }

// Deposit a local text resource
await rx.deposit("arp:text:file://./data/config.txt", "hello world");

// Binary resources
await rx.deposit("arp:binary:file://./data/image.png", imageBuffer);
const binary = await rx.resolve("arp:binary:file://./data/image.png");
console.log(binary.content); // Buffer

// Check if resource exists
const exists = await rx.exists("arp:text:file://./data/config.txt");

// Delete a resource
await rx.delete("arp:text:file://./data/config.txt");
```

## ARP URL Format

```
arp:{semantic}:{transport}://{location}
```

- **semantic**: What the resource is (e.g., `text`, `binary`)
- **transport**: How to access it (e.g., `https`, `http`, `file`)
- **location**: Where to find it

Examples:

- `arp:text:https://example.com/readme.txt`
- `arp:binary:file:///path/to/image.png`
- `arp:text:file://./local/file.txt`

## Resource Definition

Define custom resources as shortcuts for commonly used ARP URLs:

```typescript
import { createResourceX } from "resourcexjs";
import { join } from "path";
import { homedir } from "os";

const rx = createResourceX({
  resources: [
    {
      name: "logs",
      semantic: "text",
      transport: "file",
      basePath: join(homedir(), ".myapp", "logs"),
    },
    {
      name: "cache",
      semantic: "binary",
      transport: "file",
      basePath: join(homedir(), ".myapp", "cache"),
    },
  ],
});

// Use resource URL
await rx.deposit("logs://app.log", "log entry");
await rx.deposit("cache://data.bin", buffer);

// Equivalent to full ARP URL
await rx.deposit("arp:text:file://~/.myapp/logs/app.log", "log entry");
```

## API

### `createResourceX(config?)`

Create a ResourceX instance.

```typescript
const rx = createResourceX({
  timeout: 5000, // request timeout in ms
  transports: [], // custom transport handlers
  semantics: [], // custom semantic handlers
  resources: [], // resource definitions
});
```

### `rx.resolve(url)`

Resolve an ARP or Resource URL and return the resource.

```typescript
const resource = await rx.resolve("arp:text:https://example.com/file.txt");
// Returns: { type, content, meta }

const resource = await rx.resolve("myresource://file.txt");
// Also works with resource URLs
```

### `rx.deposit(url, data)`

Deposit data to an ARP or Resource URL.

```typescript
await rx.deposit("arp:text:file://./data/config.txt", "content");
await rx.deposit("arp:binary:file://./data/image.png", buffer);
```

### `rx.exists(url)`

Check if a resource exists.

```typescript
const exists = await rx.exists("arp:text:file://./data/config.txt");
// Returns: boolean
```

### `rx.delete(url)`

Delete a resource.

```typescript
await rx.delete("arp:text:file://./data/config.txt");
```

### `rx.parse(url)`

Parse a URL without fetching.

```typescript
const parsed = rx.parse("arp:text:https://example.com/file.txt");
// Returns: { semantic: "text", transport: "https", location: "example.com/file.txt" }

const parsed = rx.parse("myresource://file.txt");
// Also works with resource URLs (expanded to full location)
```

### `rx.registerTransport(handler)`

Register a custom transport handler.

### `rx.registerSemantic(handler)`

Register a custom semantic handler.

## Built-in Semantic Types

| Type     | Content  | Description                    |
| -------- | -------- | ------------------------------ |
| `text`   | `string` | Plain text with UTF-8 encoding |
| `binary` | `Buffer` | Raw binary, no transformation  |

## Resource Object

```typescript
interface Resource {
  type: string; // semantic type (e.g., "text", "binary")
  content: unknown; // parsed content (string for text, Buffer for binary)
  meta: {
    url: string; // original URL
    semantic: string; // semantic type
    transport: string; // transport protocol
    location: string; // resource location
    size: number; // content size in bytes
    encoding?: string; // content encoding (for text)
    resolvedAt: string; // ISO timestamp
  };
}
```

## Error Handling

All errors extend `ResourceXError`:

```typescript
import { createResourceX, ResourceXError } from "resourcexjs";

const rx = createResourceX();

try {
  await rx.resolve("arp:text:https://example.com/file.txt");
} catch (error) {
  if (error instanceof ResourceXError) {
    console.error("ResourceX error:", error.message);
  }
}
```

For fine-grained error handling, import specific error types from `@resourcexjs/core`:

```typescript
import { ParseError, TransportError, SemanticError } from "@resourcexjs/core";
```

## License

MIT
