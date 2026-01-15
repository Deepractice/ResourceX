# ResourceX

**Unified resource manager for AI Agents based on ARP ｜ 基于 ARP 协议的 AI Agent 统一资源管理器**

[![npm version](https://img.shields.io/npm/v/resourcexjs.svg)](https://www.npmjs.com/package/resourcexjs)
[![npm downloads](https://img.shields.io/npm/dm/resourcexjs.svg)](https://www.npmjs.com/package/resourcexjs)
[![GitHub stars](https://img.shields.io/github/stars/Deepractice/ResourceX)](https://github.com/Deepractice/ResourceX/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-green.svg)](https://nodejs.org/)

---

## What is ARP?

**ARP (Agent Resource Protocol)** is a URL format that separates **what** a resource is from **how** to get it:

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

## Ecosystem

ResourceX is part of [Deepractice](https://github.com/Deepractice)'s AI development ecosystem:

- [AgentX](https://github.com/Deepractice/AgentX) - AI agent development framework
- [PromptX](https://github.com/Deepractice/PromptX) - Prompt engineering toolkit
- [DPML](https://github.com/Deepractice/dpml) - Deepractice Markup Language

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](./LICENSE)
