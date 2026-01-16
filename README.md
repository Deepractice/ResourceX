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
    <img src="https://visitor-badge.laobi.icu/badge?page_id=Deepractice.ResourceX" alt="Views"/>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/ResourceX?color=blue" alt="License"/></a>
    <a href="https://www.npmjs.com/package/resourcexjs"><img src="https://img.shields.io/npm/v/resourcexjs?color=cb3837&logo=npm" alt="npm"/></a>
  </p>

  <p>
    <a href="README.md"><strong>English</strong></a> |
    <a href="README.zh-CN.md">简体中文</a>
  </p>
</div>

---

## Why ResourceX?

AI Agents need to access resources from different sources: configuration from local files, prompts from remote URLs, training data from cloud storage. Each source requires different code:

```typescript
// Reading from different sources = different code
const localConfig = await fs.readFile("./config.txt", "utf-8");
const remotePrompt = await fetch("https://api.example.com/prompt.txt").then((r) => r.text());
const s3Data = await s3Client.getObject({ Bucket: "...", Key: "..." });
```

**ResourceX solves this with a unified protocol**: one API for all resources, regardless of source or type.

```typescript
// One API for everything
const config = await rx.resolve("arp:text:file://./config.txt");
const prompt = await rx.resolve("arp:text:https://api.example.com/prompt.txt");
const data = await rx.resolve("arp:binary:s3://bucket/data.bin");
```

## Quick Start

```bash
npm install resourcexjs
```

```typescript
import { createResourceX } from "resourcexjs";

const rx = createResourceX();

// Read a text file
const resource = await rx.resolve("arp:text:file://./hello.txt");
console.log(resource.content); // "Hello World"
```

## Core Features

### Resolve (Read Resources)

```typescript
// Text from remote URL
const text = await rx.resolve("arp:text:https://example.com/file.txt");
console.log(text.content); // string

// Binary from local file
const image = await rx.resolve("arp:binary:file://./photo.png");
console.log(image.content); // Buffer
```

### Deposit (Write Resources)

```typescript
// Write text to local file
await rx.deposit("arp:text:file://./config.txt", "hello world");

// Write binary data
await rx.deposit("arp:binary:file://./image.png", imageBuffer);
```

### Exists & Delete

```typescript
// Check if resource exists
const exists = await rx.exists("arp:text:file://./config.txt");

// Delete a resource
await rx.delete("arp:text:file://./config.txt");
```

## How it Works

ResourceX uses **ARP (Agent Resource Protocol)**, a URL format that separates **what** a resource is from **how** to access it:

```
arp:{semantic}:{transport}://{location}
```

- **semantic**: What the resource is (`text`, `binary`)
- **transport**: How to access it (`https`, `http`, `file`)
- **location**: Where to find it

### Semantic + Transport = Orthogonal

You can mix and match any semantic with any transport:

| Semantic | Transport | Example                                    |
| -------- | --------- | ------------------------------------------ |
| `text`   | `file`    | `arp:text:file://./config.txt`             |
| `text`   | `https`   | `arp:text:https://example.com/data.txt`    |
| `binary` | `file`    | `arp:binary:file://./image.png`            |
| `binary` | `s3`      | `arp:binary:s3://bucket/data.bin` (custom) |

### Built-in Handlers

**Semantic:**

| Name     | Content  | Description                    |
| -------- | -------- | ------------------------------ |
| `text`   | `string` | Plain text with UTF-8 encoding |
| `binary` | `Buffer` | Raw binary, no transformation  |

**Transport:**

| Name          | Capabilities           | Description                                |
| ------------- | ---------------------- | ------------------------------------------ |
| `https`       | read                   | HTTPS protocol                             |
| `http`        | read                   | HTTP protocol                              |
| `file`        | read/write/list/delete | Local filesystem                           |
| `deepractice` | read/write/list/delete | Deepractice local storage (~/.deepractice) |

## Configuration and Custom

ResourceX is fully configurable via the `createResourceX()` config object.

### Deepractice Transport

Built-in transport for Deepractice ecosystem, automatically maps to `~/.deepractice/`:

```typescript
import { createResourceX, deepracticeHandler } from "resourcexjs";

const rx = createResourceX({
  transports: [deepracticeHandler()],
});

// Automatically maps to ~/.deepractice/sandbox/logs/app.log
await rx.deposit("arp:text:deepractice://sandbox/logs/app.log", "log entry");

// Custom parent directory (for testing or custom installations)
const rx = createResourceX({
  transports: [deepracticeHandler({ parentDir: "/var/data" })],
});
// → /var/data/.deepractice/sandbox/logs/app.log
```

### Custom Resources (URL Shortcuts)

Tired of repeating long URLs? Define shortcuts:

```typescript
import { createResourceX } from "resourcexjs";
import { join } from "path";
import { homedir } from "os";

const rx = createResourceX({
  resources: [
    {
      name: "app-config",
      semantic: "text",
      transport: "file",
      basePath: join(homedir(), ".myapp", "config"),
    },
  ],
});

// Short and clean
await rx.deposit("app-config://settings.txt", "theme=dark");

// Instead of
await rx.deposit("arp:text:file://~/.myapp/config/settings.txt", "theme=dark");
```

### Custom Transport

Add new transport protocols (S3, GCS, Redis, etc.):

```typescript
const s3Transport = {
  name: "s3",
  capabilities: { canRead: true, canWrite: true, canList: true, canDelete: true, canStat: false },
  async read(location: string): Promise<Buffer> {
    // Your S3 implementation
    return buffer;
  },
  async write(location: string, content: Buffer): Promise<void> {
    // Your S3 implementation
  },
};

const rx = createResourceX({
  transports: [s3Transport],
});

// Use it
await rx.resolve("arp:text:s3://bucket/key.txt");
```

### Custom Semantic

Add new semantic types (JSON, YAML, Image, etc.):

```typescript
const jsonSemantic = {
  name: "json",
  async resolve(transport, location, context) {
    const buffer = await transport.read(location);
    return {
      type: "json",
      content: JSON.parse(buffer.toString()),
      meta: { ...context, size: buffer.length, resolvedAt: context.timestamp.toISOString() },
    };
  },
  async deposit(transport, location, data, context) {
    const buffer = Buffer.from(JSON.stringify(data));
    await transport.write(location, buffer);
  },
};

const rx = createResourceX({
  semantics: [jsonSemantic],
});

// Use it
const data = await rx.resolve("arp:json:https://api.example.com/data.json");
console.log(data.content); // Parsed object
```

### All Together

Combine everything in one config:

```typescript
const rx = createResourceX({
  transports: [s3Transport, redisTransport],
  semantics: [jsonSemantic, yamlSemantic],
  resources: [
    { name: "s3-data", semantic: "json", transport: "s3", basePath: "my-bucket/data" },
    { name: "cache", semantic: "text", transport: "redis", basePath: "cache:" },
  ],
});
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
