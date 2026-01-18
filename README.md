<div align="center">
  <h1>ResourceX</h1>
  <p>
    <strong>npm for AI Resources - Resource management protocol for AI Agents</strong>
  </p>
  <p>像 npm 管理包一样，管理 AI 资源（prompts, tools, agents, etc.）</p>

  <p>
    <b>Unified Protocol</b> · <b>Type System</b> · <b>Local & Remote</b>
  </p>
  <p>
    <b>统一协议</b> · <b>类型系统</b> · <b>本地远程</b>
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

AI Agents need to manage various resources: prompts, tools, agents, configurations. Like npm for packages, ResourceX provides:

- 📦 **Unified Locator** - `domain/path/name.type@version` format
- 🏷️ **Type System** - Define custom resource types with serializer & resolver
- 💾 **Registry** - Local cache + remote publishing (like npm registry)
- 🔌 **Protocol Layer** - ARP (Agent Resource Protocol) for I/O primitives

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  ResourceX (High-level)                      │
│                                                             │
│  RXL (Locator)  → deepractice.ai/sean/assistant.prompt@1.0 │
│  RXM (Manifest) → Resource metadata                         │
│  RXC (Content)  → Stream-based content                      │
│  RXR (Resource) → RXL + RXM + RXC                           │
│                                                             │
│  Registry       → link/resolve/exists/delete                │
│  TypeSystem     → text/json/binary + custom types          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   ARP (Low-level I/O)                        │
│                                                             │
│  Format: arp:semantic:transport://location                  │
│  - semantic: text, binary                                   │
│  - transport: file, https, http, agentvm                    │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Installation

```bash
npm install resourcexjs
# or
bun add resourcexjs
```

### Basic Usage

```typescript
import { createRegistry } from "resourcexjs";
import { parseRXL, createRXM, createRXC } from "resourcexjs";

// Create a registry (default: ~/.resourcex)
const registry = createRegistry();

// Link a resource to local registry
const manifest = createRXM({
  domain: "localhost",
  name: "my-prompt",
  type: "text",
  version: "1.0.0",
});

const rxr = {
  locator: parseRXL(manifest.toLocator()),
  manifest,
  content: createRXC("You are a helpful assistant."),
};

await registry.link(rxr);

// Resolve the resource
const resource = await registry.resolve("localhost/my-prompt.text@1.0.0");
console.log(await resource.content.text()); // "You are a helpful assistant."

// Check existence
const exists = await registry.exists("localhost/my-prompt.text@1.0.0");

// Delete resource
await registry.delete("localhost/my-prompt.text@1.0.0");
```

### Load from Folder

Organize resources in folders and load them easily:

```typescript
import { loadResource, createRegistry } from "resourcexjs";

// Create a resource folder:
// my-prompt/
// ├── resource.json    # Resource metadata
// └── content          # Resource content

// resource.json format:
// {
//   "name": "assistant",
//   "type": "text",
//   "version": "1.0.0",
//   "domain": "localhost"  // optional, defaults to "localhost"
// }

// Load and link in one step
const rxr = await loadResource("./my-prompt");
const registry = createRegistry();
await registry.link(rxr);

// Now you can resolve it
const resource = await registry.resolve("localhost/assistant.text@1.0.0");
```

### Custom Loaders

Support different source formats via custom loaders:

```typescript
import { loadResource, type ResourceLoader, type RXR } from "resourcexjs";

// Example: ZIP loader
class ZipLoader implements ResourceLoader {
  canLoad(source: string): boolean {
    return source.endsWith(".zip");
  }

  async load(source: string): Promise<RXR> {
    // Extract ZIP to temp folder
    // Use FolderLoader internally
    // Return RXR
  }
}

const rxr = await loadResource("resource.zip", {
  loader: new ZipLoader(),
});
```

## Core Concepts

### RXL - Resource Locator

Format: `[domain/path/]name[.type][@version]`

```typescript
import { parseRXL } from "resourcexjs";

const rxl = parseRXL("deepractice.ai/sean/assistant.prompt@1.0.0");

console.log(rxl.domain); // "deepractice.ai"
console.log(rxl.path); // "sean"
console.log(rxl.name); // "assistant"
console.log(rxl.type); // "prompt"
console.log(rxl.version); // "1.0.0"
console.log(rxl.toString()); // "deepractice.ai/sean/assistant.prompt@1.0.0"
```

### RXM - Resource Manifest

Resource metadata:

```typescript
import { createRXM } from "resourcexjs";

const manifest = createRXM({
  domain: "deepractice.ai",
  path: "sean",
  name: "assistant",
  type: "prompt",
  version: "1.0.0",
});

console.log(manifest.toLocator()); // "deepractice.ai/sean/assistant.prompt@1.0.0"
console.log(manifest.toJSON()); // Plain object
```

### RXC - Resource Content

Stream-based content that can only be consumed once (like fetch Response):

```typescript
import { createRXC, loadRXC } from "resourcexjs";

// From string/Buffer/Stream
const content = createRXC("Hello, World!");
console.log(await content.text()); // "Hello, World!"

// From file or URL
const content = await loadRXC("./file.txt");
const content = await loadRXC("https://example.com/data.txt");

// Available methods
await content.text(); // → string
await content.buffer(); // → Buffer
await content.json<T>(); // → T
content.stream; // → ReadableStream<Uint8Array>
```

### RXR - Resource

Complete resource object (pure DTO):

```typescript
interface RXR {
  locator: RXL;
  manifest: RXM;
  content: RXC;
}

// Create from literals
const rxr: RXR = {
  locator: parseRXL("localhost/test.text@1.0.0"),
  manifest: createRXM({ domain: "localhost", name: "test", type: "text", version: "1.0.0" }),
  content: createRXC("content"),
};
```

### Registry

Resource storage and retrieval:

```typescript
import { createRegistry } from "resourcexjs";

const registry = createRegistry({
  path: "~/.resourcex", // optional, default
  types: [textType, jsonType], // optional, defaults to built-in types
});

// Link to local (like npm link)
await registry.link(rxr);

// Resolve from local or remote (like npm install)
const rxr = await registry.resolve("deepractice.ai/assistant.prompt@1.0.0");

// Check existence
await registry.exists("localhost/test.text@1.0.0");

// Delete
await registry.delete("localhost/test.text@1.0.0");

// Search (TODO)
await registry.search("assistant");
```

### Resource Types

Define how different resource types are serialized and resolved:

```typescript
import { defineResourceType, textType, jsonType, binaryType } from "resourcexjs";

// Built-in types
console.log(textType.name); // "text"
console.log(textType.aliases); // ["txt", "plaintext"]
console.log(jsonType.aliases); // ["config", "manifest"]
console.log(binaryType.aliases); // ["bin", "blob", "raw"]

// Define custom type
defineResourceType({
  name: "prompt",
  aliases: ["deepractice-prompt"],
  description: "AI Prompt template",
  serializer: {
    async serialize(rxr) {
      // Convert RXR to Buffer
      return Buffer.from(JSON.stringify({ template: await rxr.content.text() }));
    },
    async deserialize(data, manifest) {
      // Convert Buffer to RXR
      const obj = JSON.parse(data.toString());
      return {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        content: createRXC(obj.template),
      };
    },
  },
  resolver: {
    async resolve(rxr) {
      // Convert RXR to usable object
      return {
        template: await rxr.content.text(),
        compile: (vars) => {
          /* ... */
        },
      };
    },
  },
});
```

### TypeHandlerChain

Responsibility chain for type handling (used internally by Registry):

```typescript
import { createTypeHandlerChain, builtinTypes } from "resourcexjs";

const chain = createTypeHandlerChain(builtinTypes);

// Serialize
const buffer = await chain.serialize(rxr);

// Deserialize
const rxr = await chain.deserialize(buffer, manifest);

// Resolve to usable object
const result = await chain.resolve<string>(rxr);
```

## ARP - Low-level Protocol

For direct file/network I/O without Registry:

```typescript
import { createARP } from "resourcexjs/arp";

const arp = createARP(); // Auto-registers file, http, https, text, binary

// Read
const arl = arp.parse("arp:text:file://./config.txt");
const resource = await arl.resolve();
console.log(resource.content); // string

// Write
await arl.deposit("hello world");

// Check existence
const exists = await arl.exists();

// Delete
await arl.delete();
```

## Packages

| Package                                        | Description                    |
| ---------------------------------------------- | ------------------------------ |
| [`resourcexjs`](./packages/resourcex)          | Main package (RXL/RXM/RXC/RXR) |
| [`@resourcexjs/core`](./packages/core)         | Core types and implementations |
| [`@resourcexjs/registry`](./packages/registry) | Resource registry              |
| [`@resourcexjs/arp`](./packages/arp)           | ARP protocol (low-level I/O)   |

## Storage Structure

Resources are stored in:

```
~/.resourcex/
├── {domain}/
│   └── {path}/
│       └── {name}.{type}@{version}/
│           ├── manifest.json    # RXM serialized
│           └── content          # RXC serialized (via type's serializer)
```

Example:

```
~/.resourcex/
├── localhost/
│   └── my-prompt.text@1.0.0/
│       ├── manifest.json
│       └── content
└── deepractice.ai/
    └── sean/
        └── assistant.prompt@1.0.0/
            ├── manifest.json
            └── content
```

## Workflow

### Maven-style Caching

Like Maven's local repository (`~/.m2`):

```
1. resolve("deepractice.ai/assistant.prompt@1.0.0")
2. Check ~/.resourcex/deepractice.ai/assistant.prompt@1.0.0
3. If exists → return local (fast)
4. If not exists → fetch from remote → cache locally → return
```

### Development Workflow

```typescript
// 1. Link local resource for development
const registry = createRegistry();
await registry.link(myPrompt);

// 2. Use it
const resource = await registry.resolve("localhost/my-prompt.text@1.0.0");

// 3. Publish to remote (TODO)
await registry.publish(myPrompt);

// 4. Others can install
await registry.resolve("deepractice.ai/sean/my-prompt.text@1.0.0");
// → Downloads from remote → Caches to ~/.resourcex → Returns
```

## Error Handling

```typescript
import {
  ResourceXError,
  LocatorError,
  ManifestError,
  ContentError,
  ResourceTypeError,
} from "resourcexjs";

import { RegistryError } from "resourcexjs";

import { ARPError, ParseError, TransportError, SemanticError } from "resourcexjs/arp";
```

## Ecosystem

Part of the [Deepractice](https://github.com/Deepractice) AI infrastructure:

- **[AgentVM](https://github.com/Deepractice/AgentVM)** - AI Agent runtime environment
- **[AgentX](https://github.com/Deepractice/AgentX)** - AI Agent execution runtime
- **[ResourceX](https://github.com/Deepractice/ResourceX)** - Resource management (this project)

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
