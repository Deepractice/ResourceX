# Introduction to ResourceX

## The Problem

AI Agents work with many different types of resources: prompts, tools, configurations, agent definitions, and more. Managing these resources presents several challenges:

1. **No Standard Format** - Every team invents their own way to store and version prompts and tools
2. **No Distribution Mechanism** - Sharing resources between projects or teams is ad-hoc
3. **No Type System** - Resources lack metadata about what they are and how to use them
4. **No Versioning** - Tracking changes to prompts and configurations is difficult

## The Solution

ResourceX provides a unified protocol for AI resource management, similar to how npm solved package management for JavaScript.

### Core Philosophy

**1. Unified Locator Format**

Every resource has a unique address:

```
domain/path/name.type@version
```

Examples:

- `localhost/my-prompt.text@1.0.0` - Local development resource
- `deepractice.ai/sean/assistant.prompt@2.0.0` - Published resource

**2. Content as Archive**

Resources can contain single or multiple files, stored as tar.gz internally:

```typescript
// Single file resource
await createRXA({ content: "You are a helpful assistant." });

// Multi-file resource
await createRXA({
  "prompt.txt": "Main prompt content",
  "examples/greeting.txt": "Hello example",
  "examples/farewell.txt": "Goodbye example",
});
```

**3. Pluggable Type System**

Built-in types handle common cases:

- `text` (aliases: `txt`, `plaintext`) - Plain text content
- `json` (aliases: `config`, `manifest`) - JSON data
- `binary` (aliases: `bin`, `blob`, `raw`) - Raw binary data

Custom types can define how resources are serialized and resolved:

```typescript
defineResourceType({
  name: 'prompt',
  aliases: ['deepractice-prompt'],
  description: 'AI Prompt template',
  serializer: { ... },
  resolver: { ... }
});
```

**4. Maven-style Registry**

Resources are cached locally (`~/.resourcex`) and fetched from remote registries on demand:

```
resolve("deepractice.ai/assistant.prompt@1.0.0")
    |
    v
Check local cache (~/.resourcex)
    |
    +-- Found? Return immediately
    |
    +-- Not found? Fetch from remote, cache, then return
```

## Comparison with npm

| Aspect   | npm                  | ResourceX                       |
| -------- | -------------------- | ------------------------------- |
| Target   | JavaScript packages  | AI resources                    |
| Locator  | `package@version`    | `domain/path/name.type@version` |
| Content  | Files + package.json | Archive (tar.gz) + manifest     |
| Registry | registry.npmjs.org   | Local + Remote + Git            |
| Types    | N/A                  | text, json, binary, custom      |

Key differences:

- ResourceX includes domain in the locator for multi-registry support
- ResourceX has a type system for different resource kinds
- ResourceX supports Git-based registries out of the box
- ResourceX is optimized for AI resource patterns (prompts, tools, etc.)

## Architecture Overview

ResourceX has two layers:

### High-level: ResourceX

The main API for working with resources:

- **RXL (Locator)** - Parse and create resource addresses
- **RXM (Manifest)** - Resource metadata (domain, name, type, version)
- **RXA (Archive)** - Archive-based content with file access
- **RXR (Resource)** - Complete resource combining locator, manifest, and content
- **Registry** - Store, retrieve, and search resources
- **TypeSystem** - Define how resource types are handled

### Low-level: ARP (Agent Resource Protocol)

Direct I/O primitives for file and network access:

```
arp:semantic:transport://location

Examples:
- arp:text:file://./config.txt
- arp:binary:https://example.com/data.bin
- arp:text:rxr://localhost/my-prompt.text@1.0.0/content
```

Most users only need the high-level ResourceX API. ARP is useful for advanced scenarios requiring direct I/O control.

## Next Steps

- [Installation](./installation.md) - Install ResourceX packages
- [Quick Start](./quick-start.md) - Create your first resource
