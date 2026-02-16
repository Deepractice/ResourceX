# @resourcexjs/node-provider

Node.js/Bun platform provider for ResourceX.

## Installation

```bash
bun add @resourcexjs/node-provider
# or
npm install @resourcexjs/node-provider
```

## Usage

### With ResourceX Client

```typescript
import { createResourceX, setProvider } from "resourcexjs";
import { NodeProvider } from "@resourcexjs/node-provider";

// Register the provider before creating client
setProvider(new NodeProvider());

const rx = createResourceX({
  path: "~/.resourcex", // optional, defaults to ~/.resourcex
  registry: "https://registry.example.com",
});

// Now use ResourceX
await rx.add("./my-prompt");
const result = await rx.resolve("my-prompt:1.0.0");
```

### With ResourceX Server

```typescript
import { createRegistryServer } from "@resourcexjs/server";
import { FileSystemRXAStore, FileSystemRXMStore } from "@resourcexjs/node-provider";

const server = createRegistryServer({
  rxaStore: new FileSystemRXAStore("./data/blobs"),
  rxmStore: new FileSystemRXMStore("./data/manifests"),
});

// Deploy with any runtime
Bun.serve({ fetch: server.fetch, port: 3000 });
```

## Exports

### NodeProvider

Full provider implementation for Node.js/Bun platform.

```typescript
import { NodeProvider } from "@resourcexjs/node-provider";

const provider = new NodeProvider();
provider.platform; // "node"
provider.createStores({ path: "~/.resourcex" }); // { rxaStore, rxmStore }
provider.createLoader({}); // FolderLoader
```

### FileSystemRXAStore

Content-addressable blob storage using filesystem.

```typescript
import { FileSystemRXAStore } from "@resourcexjs/node-provider";

const store = new FileSystemRXAStore("./data/blobs");

// Store blob, returns digest
const digest = await store.put(buffer);

// Get blob by digest
const data = await store.get(digest);

// Check existence
const exists = await store.has(digest);

// Delete blob
await store.delete(digest);

// List all digests
const digests = await store.list();
```

**Storage structure:**

```
./data/blobs/
├── ab/
│   └── sha256:abcd1234...
├── cd/
│   └── sha256:cdef5678...
└── ...
```

### FileSystemRXMStore

Manifest storage using JSON files.

```typescript
import { FileSystemRXMStore } from "@resourcexjs/node-provider";

const store = new FileSystemRXMStore("./data/manifests");

// Store manifest
await store.put(storedRxm);

// Get manifest
const manifest = await store.get("my-prompt", "1.0.0");

// Get cached manifest (with registry)
const cached = await store.get("my-prompt", "1.0.0", "registry.example.com");

// Check existence
const exists = await store.has("my-prompt", "1.0.0");

// List all tags for a resource
const tags = await store.listTags("my-prompt");

// Search manifests
const results = await store.search({ query: "prompt", limit: 10 });

// Delete by registry (clear cache)
await store.deleteByRegistry("registry.example.com");
```

**Storage structure:**

```
./data/manifests/
├── _local/              # Local resources (no registry)
│   └── my-prompt/
│       └── 1.0.0.json
└── registry.example.com/ # Cached resources (with registry)
    └── shared-prompt/
        └── 1.0.0.json
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Applications                        │
├─────────────────────┬───────────────────────────────────┤
│   resourcexjs       │   @resourcexjs/server             │
│   (Client SDK)      │   (Registry Server)               │
├─────────────────────┴───────────────────────────────────┤
│              @resourcexjs/node-provider                  │
│   ┌─────────────────┬─────────────────┬──────────────┐  │
│   │  NodeProvider   │FileSystemRXAStore│FileSystemRXMStore│
│   └─────────────────┴─────────────────┴──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                   @resourcexjs/core                      │
│        (CASRegistry, RXAStore/RXMStore interfaces)       │
└─────────────────────────────────────────────────────────┘
```

## License

Apache-2.0
