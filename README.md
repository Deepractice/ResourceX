<div align="center">
  <h1>ResourceX</h1>
  <p>
    <strong>Unified resource manager for AI Agents based on ARP</strong>
  </p>
  <p>基于 ARP 协议的 AI Agent 统一资源管理器</p>

  <p>
    <b>Unified Access</b> · <b>Web Native</b> · <b>Fully Extensible</b>
  </p>
  <p>
    <b>统一访问</b> · <b>原生协议</b> · <b>完全可扩展</b>
  </p>

  <p>
    <a href="https://github.com/Deepractice/ResourceX"><img src="https://img.shields.io/github/stars/Deepractice/ResourceX?style=social" alt="Stars"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/ResourceX?color=blue" alt="License"/></a>
    <a href="https://www.npmjs.com/package/resourcexjs"><img src="https://img.shields.io/npm/v/resourcexjs?color=cb3837&logo=npm" alt="npm"/></a>
  </p>

  <p>
    <a href="README.md"><strong>English</strong></a> |
    <a href="README.zh-CN.md">简体中文</a>
  </p>
</div>

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

Part of the [Deepractice](https://github.com/Deepractice) AI Agent infrastructure:

- **[PromptX](https://github.com/Deepractice/PromptX)** - AI Agent context platform
- **[AgentX](https://github.com/Deepractice/AgentX)** - AI Agent runtime platform
- **[ToolX](https://github.com/Deepractice/ToolX)** - Tool integration
- **[UIX](https://github.com/Deepractice/UIX)** - AI-to-UI protocol layer
- **[SandboX](https://github.com/Deepractice/SandboX)** - Agent sandbox

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](./LICENSE)

---

<div align="center">
  <p>
    Built with ❤️ by <a href="https://github.com/Deepractice">Deepractice</a>
  </p>
</div>
