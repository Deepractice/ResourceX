<div align="center">
  <h1>ResourceX</h1>
  <p><strong>The resource layer for AI Agents</strong></p>
  <p>AI Agent 的资源层</p>

  <p>Manage, version, and share prompts, tools, skills, and everything</p>
  <p>管理、版本化、共享 prompts、tools、skills 以及一切</p>

  <p>
    <b>Decentralized</b> · <b>Extensible</b> · <b>Universal</b>
  </p>
  <p>
    <b>去中心化</b> · <b>可扩展</b> · <b>通用</b>
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

  <p>
    <a href="#quick-start">Quick Start</a> •
    <a href="./docs/README.md">Documentation</a> •
    <a href="./docs/api/core.md">API Reference</a>
  </p>
</div>

---

## Why ResourceX?

AI Agents need to manage various resources: **prompts**, **tools**, **agents**, **skills**, **configurations**, and more. ResourceX provides a unified resource layer with protocol, runtime, and registry. _Everything is a resource._

```
┌─────────────────────────────────────────────────────────────┐
│                     Registry Layer                          │
│                                                             │
│  Local / Git / Remote    →  Storage & Discovery             │
│  link / resolve / search →  Resource Operations             │
├─────────────────────────────────────────────────────────────┤
│                    ResourceX Layer                          │
│                                                             │
│  RXL (Locator)   →  deepractice.ai/assistant.prompt@1.0.0  │
│  RXM (Manifest)  →  Resource metadata                       │
│  RXC (Content)   →  Archive-based storage (tar.gz)          │
│  Type System     →  text / json / binary / custom           │
├─────────────────────────────────────────────────────────────┤
│                       ARP Layer                             │
│                                                             │
│  Format: arp:{semantic}:{transport}://{location}            │
│  Low-level I/O primitives for file, http, https, rxr        │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
npm install resourcexjs
```

```typescript
import { createRegistry, parseRXL, createRXM, createRXC } from "resourcexjs";

// 1. Create a resource
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

// 2. Link to local registry (~/.resourcex)
const registry = createRegistry();
await registry.link(rxr);

// 3. Resolve anywhere
const resource = await registry.resolve("localhost/my-prompt.text@1.0.0");
const text = await resource.execute(); // "You are a helpful assistant."
```

## [Documentation](./docs/README.md)

### [Getting Started](./docs/getting-started/introduction.md)

- [Introduction](./docs/getting-started/introduction.md) - What is ResourceX
- [Installation](./docs/getting-started/installation.md) - Setup guide
- [Quick Start](./docs/getting-started/quick-start.md) - 5-minute tutorial

### [Core Concepts](./docs/concepts/overview.md)

- [Architecture Overview](./docs/concepts/overview.md) - Two-layer design
- **[ResourceX Layer](./docs/concepts/resourcex/rxl-locator.md)**
  - [RXL - Locator](./docs/concepts/resourcex/rxl-locator.md) - `domain/path/name.type@version`
  - [RXM - Manifest](./docs/concepts/resourcex/rxm-manifest.md) - Resource metadata
  - [RXC - Content](./docs/concepts/resourcex/rxc-content.md) - Archive-based storage
  - [RXR - Resource](./docs/concepts/resourcex/rxr-resource.md) - Complete resource object
  - [Type System](./docs/concepts/resourcex/type-system.md) - Built-in & custom types
  - [Registry](./docs/concepts/resourcex/registry.md) - Storage & retrieval
- **[ARP Layer](./docs/concepts/arp/protocol.md)**
  - [Protocol](./docs/concepts/arp/protocol.md) - Agent Resource Protocol
  - [ARL](./docs/concepts/arp/arl.md) - ARP Resource Locator
  - [Transport](./docs/concepts/arp/transport.md) - file, http, https, rxr
  - [Semantic](./docs/concepts/arp/semantic.md) - text, binary

### [Guides](./docs/guides/local-registry.md)

- [Local Registry](./docs/guides/local-registry.md) - Development workflow
- [Git Registry](./docs/guides/git-registry.md) - Team sharing
- [Remote Registry](./docs/guides/remote-registry.md) - HTTP API
- [Custom Types](./docs/guides/custom-types.md) - Define your own types
- [ARP Protocol](./docs/guides/arp-protocol.md) - Low-level I/O

### [API Reference](./docs/api/core.md)

- [Core API](./docs/api/core.md) - RXL, RXM, RXC, RXR
- [Registry API](./docs/api/registry.md) - Registry operations
- [ARP API](./docs/api/arp.md) - Transport & Semantic
- [Errors](./docs/api/errors.md) - Error handling

### [Design & Contributing](./docs/design/README.md)

- [Design Decisions](./docs/design/README.md) - Architecture rationale
- [Development](./docs/contributing/development.md) - Setup & commands
- [Workflow](./docs/contributing/workflow.md) - BDD process
- [Conventions](./docs/contributing/conventions.md) - Code style

## Packages

| Package                                        | Description                        |
| ---------------------------------------------- | ---------------------------------- |
| [`resourcexjs`](./packages/resourcex)          | Main package - everything you need |
| [`@resourcexjs/core`](./packages/core)         | Core types (RXL, RXM, RXC, RXR)    |
| [`@resourcexjs/registry`](./packages/registry) | Registry implementations           |
| [`@resourcexjs/arp`](./packages/arp)           | ARP protocol                       |

## Ecosystem

Part of the [Deepractice](https://github.com/Deepractice) AI infrastructure:

- **[AgentVM](https://github.com/Deepractice/AgentVM)** - AI Agent runtime
- **[AgentX](https://github.com/Deepractice/AgentX)** - AI Agent framework
- **ResourceX** - Resource management (this project)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [Development Guide](./docs/contributing/development.md).

## License

[MIT](./LICENSE)

---

<div align="center">
  Built with care by <a href="https://github.com/Deepractice">Deepractice</a>
</div>
