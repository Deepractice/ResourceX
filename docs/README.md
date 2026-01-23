# ResourceX Documentation

Welcome to the ResourceX documentation. ResourceX is a resource management protocol for AI Agents - think of it as **npm for AI resources**.

## What is ResourceX?

ResourceX provides a unified way to manage, version, and share AI resources such as prompts, tools, agents, and configurations. Just like npm revolutionized JavaScript package management, ResourceX aims to standardize how AI resources are created, stored, and distributed.

## Documentation Structure

### Getting Started

- [Introduction](./getting-started/introduction.md) - What problem does ResourceX solve and why it exists
- [Installation](./getting-started/installation.md) - How to install ResourceX packages
- [Quick Start](./getting-started/quick-start.md) - Create and use your first resource in 5 minutes

### Core Concepts

- [RXL - Resource Locator](./concepts/rxl.md) - Unique resource identifier format
- [RXM - Resource Manifest](./concepts/rxm.md) - Resource metadata description
- [RXC - Resource Content](./concepts/rxc.md) - Archive-based content storage
- [RXR - Complete Resource](./concepts/rxr.md) - Locator + Manifest + Content

### Guides

- [Registry Usage](./guides/registry.md) - How to use resource registries
- [Type System](./guides/type-system.md) - Built-in and custom types
- [ARP Protocol](./guides/arp.md) - Low-level I/O protocol

### API Reference

- [Core API](./api/core.md) - Core package API
- [Registry API](./api/registry.md) - Registry package API
- [ARP API](./api/arp.md) - ARP package API

### Contributing

- [Development Guide](./contributing/development.md) - How to contribute
- [Design Documents](./design/) - Architecture design documents

## Core Features

| Feature         | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| Unified Locator | `domain/path/name.type@version` format for resource identification |
| Type System     | Built-in types (text, json, binary) plus custom type support       |
| Registry        | Local cache + remote publishing, similar to npm registry           |
| ARP Protocol    | Low-level I/O primitives with file, http, https, rxr transports    |

## Package Structure

```
resourcexjs           # Main package - includes everything
@resourcexjs/core     # Core types: RXL, RXM, RXC, RXR
@resourcexjs/registry # Registry implementations
@resourcexjs/arp      # ARP protocol
```

## Quick Example

```typescript
import { createRegistry, parseRXL, createRXM, createRXC } from "resourcexjs";

// Create local registry
const registry = createRegistry();

// Create a resource
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

// Link to local registry
await registry.link(rxr);

// Resolve the resource
const resource = await registry.resolve("localhost/my-prompt.text@1.0.0");
const text = await resource.execute();
console.log(text); // "You are a helpful assistant."
```

## Quick Links

- [GitHub Repository](https://github.com/Deepractice/ResourceX)
- [npm Package](https://www.npmjs.com/package/resourcexjs)
- [Deepractice Organization](https://github.com/Deepractice)

## Related Projects

ResourceX is part of the Deepractice AI infrastructure:

- **[AgentVM](https://github.com/Deepractice/AgentVM)** - AI Agent runtime environment
- **[AgentX](https://github.com/Deepractice/AgentX)** - AI Agent execution runtime
