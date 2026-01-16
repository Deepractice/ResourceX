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

// Check if resource exists
const exists = await rx.exists("arp:text:file://./data/config.txt");

// Delete a resource
await rx.delete("arp:text:file://./data/config.txt");
```

## ARP URL Format

```
arp:{semantic}:{transport}://{location}
```

- **semantic**: What the resource is (e.g., `text`)
- **transport**: How to access it (e.g., `https`, `http`, `file`)
- **location**: Where to find it

Examples:

- `arp:text:https://example.com/readme.txt`
- `arp:text:http://localhost:3000/data.txt`
- `arp:text:file:///path/to/local/file.txt`

## API

### `createResourceX(config?)`

Create a ResourceX instance.

```typescript
const rx = createResourceX({
  timeout: 5000, // request timeout in ms
  transports: [], // custom transport handlers
  semantics: [], // custom semantic handlers
});
```

### `rx.resolve(url)`

Resolve an ARP URL and return the resource.

```typescript
const resource = await rx.resolve("arp:text:https://example.com/file.txt");
// Returns: { type, content, meta }
```

### `rx.deposit(url, data)`

Deposit data to an ARP URL.

```typescript
await rx.deposit("arp:text:file://./data/config.txt", "content");
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

Parse an ARP URL without fetching.

```typescript
const parsed = rx.parse("arp:text:https://example.com/file.txt");
// Returns: { semantic: "text", transport: "https", location: "example.com/file.txt" }
```

### `rx.registerTransport(handler)`

Register a custom transport handler.

### `rx.registerSemantic(handler)`

Register a custom semantic handler.

## Resource Object

```typescript
interface Resource {
  type: string; // semantic type (e.g., "text")
  content: unknown; // parsed content
  meta: {
    url: string; // original ARP URL
    semantic: string; // semantic type
    transport: string; // transport protocol
    location: string; // resource location
    size: number; // content size in bytes
    encoding?: string; // content encoding
    mimeType?: string; // MIME type
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
