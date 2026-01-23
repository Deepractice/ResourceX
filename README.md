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
│  RXC (Content)  → Archive-based content (tar.gz)            │
│  RXR (Resource) → RXL + RXM + RXC                           │
│                                                             │
│  Registry       → link/resolve/exists/delete/search         │
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
  content: await createRXC({ content: "You are a helpful assistant." }),
};

await registry.link(rxr);

// Resolve the resource
const resource = await registry.resolve("localhost/my-prompt.text@1.0.0");
const contentBuffer = await resource.content.file("content");
console.log(contentBuffer.toString()); // "You are a helpful assistant."

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
// └── content          # Resource content (or any file names)

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

Archive-based content (internally tar.gz), supports single or multi-file resources:

```typescript
import { createRXC } from "resourcexjs";

// Single file
const content = await createRXC({ content: "Hello, World!" });

// Multiple files
const content = await createRXC({
  "index.ts": "export default 1",
  "styles.css": "body {}",
});

// Nested directories
const content = await createRXC({
  "src/index.ts": "main code",
  "src/utils/helper.ts": "helper code",
});

// Read files
const buffer = await content.file("content"); // single file
const files = await content.files(); // Map<string, Buffer>
const archiveBuffer = await content.buffer(); // raw tar.gz
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
  content: await createRXC({ content: "Hello" }),
};
```

### Registry

Resource storage and retrieval (local or remote):

```typescript
import { createRegistry, discoverRegistry } from "resourcexjs";

// Local registry (default)
const registry = createRegistry();
const registry2 = createRegistry({ path: "./custom-path" });

// Remote registry
const registry3 = createRegistry({
  endpoint: "https://registry.deepractice.ai/v1",
});

// Well-known discovery
const endpoint = await discoverRegistry("deepractice.ai");
// → fetches https://deepractice.ai/.well-known/resourcex
// → returns { "version": "1.0", "registry": "https://..." }

// Link to local (like npm link)
await registry.link(rxr);

// Resolve from local or remote (like npm install)
const rxr = await registry.resolve("deepractice.ai/assistant.prompt@1.0.0");

// Check existence
await registry.exists("localhost/test.text@1.0.0");

// Delete
await registry.delete("localhost/test.text@1.0.0");

// Search
const results = await registry.search({ query: "assistant", limit: 10 });
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
      // Convert RXR to Buffer (returns tar.gz archive)
      return rxr.content.buffer();
    },
    async deserialize(data, manifest) {
      // Convert Buffer to RXR (data is tar.gz archive)
      return {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        content: await createRXC({ archive: data }),
      };
    },
  },
  resolver: {
    async resolve(rxr) {
      // Convert RXR to usable object
      const buffer = await rxr.content.file("content");
      return {
        template: buffer.toString(),
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

// createARP() auto-registers built-in handlers:
// Transports: file, http, https, rxr
// Semantics: text, binary
const arp = createARP();

// Read local file
const arl = arp.parse("arp:text:file://./config.txt");
const resource = await arl.resolve();
console.log(resource.content); // string

// Write
await arl.deposit("hello world");

// Check existence
const exists = await arl.exists();

// Delete
await arl.delete();

// Read from HTTP
const arl2 = arp.parse("arp:text:https://example.com/data.json");
const remote = await arl2.resolve();

// Access files inside a resource (rxr transport - auto-registered)
const arl3 = arp.parse("arp:text:rxr://localhost/my-prompt.text@1.0.0/content");
const inner = await arl3.resolve();
// localhost → LocalRegistry, other domains → RemoteRegistry via well-known
```

**Built-in Transports:**

- `file` - Local filesystem (read-write)
- `http`, `https` - Network resources (read-only)
- `rxr` - Files inside resources (read-only, auto-creates Registry)

**Built-in Semantics:**

- `text` - UTF-8 text → string
- `binary` - Raw bytes → Buffer

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
│       └── {name}.{type}/
│           └── {version}/
│               ├── manifest.json    # RXM serialized
│               └── content.tar.gz   # RXC as tar.gz archive
```

Example:

```
~/.resourcex/
├── localhost/
│   └── my-prompt.text/
│       └── 1.0.0/
│           ├── manifest.json
│           └── content.tar.gz
└── deepractice.ai/
    └── sean/
        └── assistant.prompt/
            └── 1.0.0/
                ├── manifest.json
                └── content.tar.gz
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
