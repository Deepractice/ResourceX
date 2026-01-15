# ResourceX

Agent Resource Protocol (ARP) implementation for AI Agents.

ResourceX provides a unified way for AI agents to reference and access resources using a standardized URL format.

## What is ARP?

ARP (Agent Resource Protocol) is a URL format that separates **what** a resource is from **how** to get it:

```
arp:{semantic}:{transport}://{location}
```

| Part        | Description          | Examples                                |
| ----------- | -------------------- | --------------------------------------- |
| `semantic`  | What the resource is | `text`, `json`, `image`, `prompt`       |
| `transport` | How to fetch it      | `https`, `http`, `file`, `arr`          |
| `location`  | Where to find it     | `example.com/file.txt`, `/path/to/file` |

**Examples:**

```
arp:text:https://example.com/readme.txt
arp:text:file:///path/to/local/file.txt
arp:prompt:arr://deepractice@assistant?lang=zh
```

## Quick Start

### Installation

```bash
npm install resourcexjs
# or
bun add resourcexjs
```

### Usage

```typescript
import { createResourceX } from "resourcexjs";

const rx = createResourceX();

// Resolve a remote text file
const resource = await rx.resolve("arp:text:https://example.com/file.txt");

console.log(resource.type); // "text"
console.log(resource.content); // file content
console.log(resource.meta); // { url, semantic, transport, size, ... }
```

### CLI

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

| Package                                | Description                            |
| -------------------------------------- | -------------------------------------- |
| [`resourcexjs`](./packages/resourcex)  | Main package - unified API for ARP     |
| [`@resourcexjs/core`](./packages/core) | Core implementation - parser, handlers |
| [`@resourcexjs/cli`](./packages/cli)   | Command-line interface                 |

## Supported Types

### Semantic Types

| Type     | Description | Status    |
| -------- | ----------- | --------- |
| `text`   | Plain text  | Supported |
| `json`   | JSON data   | Planned   |
| `image`  | Image files | Planned   |
| `prompt` | AI prompts  | Planned   |

### Transport Types

| Type    | Description             | Status    |
| ------- | ----------------------- | --------- |
| `https` | HTTPS protocol          | Supported |
| `http`  | HTTP protocol           | Supported |
| `file`  | Local filesystem        | Supported |
| `arr`   | Agent Resource Registry | Planned   |

## Development

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3.0
- [Node.js](https://nodejs.org/) >= 22.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/Deepractice/ResourceX.git
cd ResourceX

# Install dependencies
bun install

# Build all packages
bun run build
```

### Commands

```bash
# Build
bun run build

# Run tests
bun run test          # Unit tests
bun run test:bdd      # BDD tests

# Lint & Format
bun run lint
bun run format

# Type check
bun run typecheck
```

### Project Structure

```
ResourceX/
├── packages/
│   ├── core/           # @resourcexjs/core
│   ├── resourcex/      # resourcexjs
│   └── cli/            # @resourcexjs/cli
├── bdd/                # BDD tests (Cucumber)
├── turbo.json          # Turborepo config
└── package.json        # Root package.json
```

## Error Handling

All errors extend `ResourceXError`:

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

For fine-grained error handling:

```typescript
import { ParseError, TransportError, SemanticError } from "@resourcexjs/core";
```

## Custom Handlers

### Custom Transport

```typescript
import { createResourceX } from "resourcexjs";

const rx = createResourceX();

rx.registerTransport({
  type: "s3",
  async fetch(location: string): Promise<Buffer> {
    // Fetch from S3...
    return buffer;
  },
});

await rx.resolve("arp:text:s3://bucket/key.txt");
```

### Custom Semantic

```typescript
rx.registerSemantic({
  type: "json",
  parse(content: Buffer, context) {
    return {
      type: "json",
      content: JSON.parse(content.toString()),
      meta: { ... },
    };
  },
});

await rx.resolve("arp:json:https://api.example.com/data.json");
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## License

MIT
