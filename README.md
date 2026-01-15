# ResourceX

Agent Resource Protocol (ARP) implementation for AI Agents.

## What is ARP?

ARP (Agent Resource Protocol) is a URL format that separates **what** a resource is from **how** to get it:

```
arp:{semantic}:{transport}://{location}
```

- **semantic**: What the resource is (`text`)
- **transport**: How to fetch it (`https`, `http`, `file`)
- **location**: Where to find it

## Installation

```bash
npm install resourcexjs
```

## Usage

```typescript
import { createResourceX } from "resourcexjs";

const rx = createResourceX();

const resource = await rx.resolve("arp:text:https://example.com/file.txt");

console.log(resource.type); // "text"
console.log(resource.content); // file content
console.log(resource.meta); // { url, semantic, transport, size, ... }
```

## CLI

```bash
npm install -g @resourcexjs/cli

# Resolve and print content
arp "arp:text:https://example.com/file.txt"

# Parse URL components
arp parse "arp:text:https://example.com/file.txt"

# Output as JSON
arp "arp:text:https://example.com/file.txt" --json
```

## Packages

| Package                                | Description         |
| -------------------------------------- | ------------------- |
| [`resourcexjs`](./packages/resourcex)  | Main package        |
| [`@resourcexjs/core`](./packages/core) | Core implementation |
| [`@resourcexjs/cli`](./packages/cli)   | CLI tool            |

## Error Handling

```typescript
import { createResourceX, ResourceXError } from "resourcexjs";

try {
  await rx.resolve("arp:text:https://example.com/file.txt");
} catch (error) {
  if (error instanceof ResourceXError) {
    console.error(error.message);
  }
}
```

## Custom Handlers

### Transport

```typescript
rx.registerTransport({
  type: "s3",
  async fetch(location: string): Promise<Buffer> {
    // Fetch from S3...
    return buffer;
  },
});

await rx.resolve("arp:text:s3://bucket/key.txt");
```

### Semantic

```typescript
rx.registerSemantic({
  type: "json",
  parse(content: Buffer, context) {
    return {
      type: "json",
      content: JSON.parse(content.toString()),
      meta: { ...context, size: content.length },
    };
  },
});

await rx.resolve("arp:json:https://api.example.com/data.json");
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT
