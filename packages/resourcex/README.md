# resourcexjs

Resource management protocol for AI Agents. Like npm for AI resources (prompts, tools, agents, configs).

## Installation

```bash
npm install resourcexjs @resourcexjs/node-provider
# or
bun add resourcexjs @resourcexjs/node-provider
```

**Requirements:** Node.js 22+ or Bun

## Quick Start

```typescript
import { createResourceX, setProvider } from "resourcexjs";
import { NodeProvider } from "@resourcexjs/node-provider";

// Configure provider before creating client
setProvider(new NodeProvider());

const rx = createResourceX();

// Add a resource from local directory
await rx.add("./my-prompt");

// Resolve and execute
const result = await rx.resolve("my-prompt:1.0.0");
const content = await result.execute();
console.log(content);
```

## Core Concepts

ResourceX uses five core primitives:

| Primitive | Description                                         |
| --------- | --------------------------------------------------- |
| **RXI**   | Resource Identifier - structured `{ registry?, path?, name, tag }` |
| **RXL**   | Resource Locator - unified locator string (RXI string, path, or URL) |
| **RXM**   | Resource Manifest - metadata (name, type, version)  |
| **RXA**   | Resource Archive - content container (tar.gz)       |
| **RXR**   | Resource - complete object (RXI + RXM + RXA)        |

### Locator Format

ResourceX uses a Docker-style locator format:

```
[registry/][path/]name[:tag]
```

- `name` - Resource name (required)
- `tag` - Version or label (optional, defaults to "latest")
- `registry` - Registry host (optional, e.g., `registry.example.com` or `localhost:3098`)
- `path` - Path within registry (optional)

Examples:

- `hello` - local resource with default tag "latest"
- `hello:1.0.0` - local resource with version
- `prompts/hello:1.0.0` - with path
- `registry.example.com/hello:1.0.0` - remote resource
- `localhost:3098/org/hello:latest` - with port and path

**Note:** The resource type (e.g., "text", "json") is specified in `resource.json`, not in the locator.

### Resource Directory Structure

A resource directory contains:

```
my-prompt/
├── resource.json    # Resource metadata (required)
└── content          # Resource content (required for text/json/binary)
```

Example `resource.json`:

```json
{
  "name": "my-prompt",
  "type": "text",
  "tag": "1.0.0"
}
```

### Storage Layout

Resources are stored using content-addressable storage (CAS) in `~/.resourcex/`:

```
~/.resourcex/
├── blobs/                        # Content-addressable blob storage
│   └── ab/
│       └── sha256:abcd1234...    # Archive data (tar.gz)
└── manifests/
    ├── _local/                   # Local resources (no registry)
    │   └── my-prompt/
    │       └── 1.0.0.json        # Manifest with digest reference
    └── registry.example.com/     # Cached remote resources
        └── hello/
            └── 1.0.0.json
```

## Provider Configuration

ResourceX requires a platform provider to be configured before use. The provider handles platform-specific storage operations.

```typescript
import { setProvider, hasProvider, clearProvider } from "resourcexjs";
import { NodeProvider } from "@resourcexjs/node-provider";

// Set provider (required before createResourceX)
setProvider(new NodeProvider());

// Check if provider is configured
if (hasProvider()) {
  const rx = createResourceX();
}

// Clear provider (useful for testing)
clearProvider();
```

## API Reference

### createResourceX(config?)

Create a ResourceX client instance. Requires a provider to be set first.

```typescript
import { createResourceX, setProvider } from "resourcexjs";
import { NodeProvider } from "@resourcexjs/node-provider";

setProvider(new NodeProvider());

const rx = createResourceX({
  path: "~/.resourcex", // Storage path (default: ~/.resourcex)
  registry: "https://...", // Central registry URL (for push/pull)
  types: [myCustomType], // Custom resource types
  isolator: "none", // Sandbox: none | srt | cloudflare | e2b
});
```

### Local Operations

#### rx.add(path)

Add a resource from a local directory to local storage.

```typescript
const resource = await rx.add("./my-prompt");
console.log(resource.locator); // "my-prompt:1.0.0"
```

#### rx.has(locator)

Check if a resource exists locally.

```typescript
const exists = await rx.has("hello:1.0.0");
```

#### rx.info(locator)

Get detailed resource information.

```typescript
const info = await rx.info("hello:1.0.0");
console.log(info);
// {
//   locator: "hello:1.0.0",
//   name: "hello",
//   type: "text",
//   tag: "1.0.0",
//   files: ["content"]
// }
```

#### rx.remove(locator)

Remove a resource from local storage.

```typescript
await rx.remove("hello:1.0.0");
```

#### rx.resolve(locator)

Load and prepare a resource for execution from an RXL locator string.

```typescript
const executable = await rx.resolve<string>("hello:1.0.0");

// Execute with optional arguments
const content = await executable.execute();

// Access schema (if defined by the type)
console.log(executable.schema);
```

Resolution order:

1. Local storage
2. Cache (previously pulled)
3. Remote registry (auto-pull if configured)

#### rx.search(query?)

Search local resources.

```typescript
// Search all
const all = await rx.search();

// Search by keyword
const results = await rx.search("prompt");
// ["my-prompt:1.0.0", "system-prompt:2.0.0"]
```

### Remote Operations

#### rx.push(locator)

Push a local resource to the remote registry.

```typescript
import { createResourceX, setProvider } from "resourcexjs";
import { NodeProvider } from "@resourcexjs/node-provider";

setProvider(new NodeProvider());

const rx = createResourceX({
  registry: "https://registry.example.com",
});

await rx.add("./my-prompt");
await rx.push("my-prompt:1.0.0");
```

#### rx.pull(locator)

Pull a resource from the remote registry to local cache.

```typescript
await rx.pull("hello:1.0.0");
// Resource is now cached locally
```

### Cache Operations

#### rx.clearCache(registry?)

Clear cached resources.

```typescript
// Clear all cache
await rx.clearCache();

// Clear cache for specific registry
await rx.clearCache("registry.example.com");
```

### Extension

#### rx.supportType(type)

Add support for a custom resource type.

```typescript
rx.supportType({
  name: "prompt",
  aliases: ["ai-prompt"],
  description: "AI prompt template",
  code: `({
    async resolve(ctx) {
      const template = new TextDecoder().decode(ctx.files["content"]);
      return {
        template,
        render: (vars) => template.replace(/\\{\\{(\\w+)\\}\\}/g, (_, k) => vars[k])
      };
    }
  })`,
});

const result = await rx.resolve("greeting:1.0.0");
const { template, render } = await result.execute();
console.log(render({ name: "World" }));
```

## Built-in Types

| Type     | Aliases          | Description        | Output       |
| -------- | ---------------- | ------------------ | ------------ |
| `text`   | txt, plaintext   | Plain text content | `string`     |
| `json`   | config, manifest | JSON content       | `unknown`    |
| `binary` | bin, blob, raw   | Binary content     | `Uint8Array` |

## Core Primitives

For advanced use cases, you can work with core primitives directly:

```typescript
import { parse, format, manifest, archive, resource, extract, wrap } from "resourcexjs";

// Parse locator string to RXI
const rxi = parse("hello:1.0.0");
console.log(rxi.name); // "hello"
console.log(rxi.tag); // "1.0.0"

// Format RXI back to string
const str = format(rxi); // "hello:1.0.0"

// Create manifest from definition
const rxm = manifest({
  name: "hello",
  type: "text",
  tag: "1.0.0",
});

// Create archive from files
const rxa = await archive({
  content: Buffer.from("Hello, World!"),
});

// Create complete resource
const rxr = resource(rxm, rxa);

// Extract files from archive
const files = await extract(rxa); // Record<string, Buffer>

// Wrap raw buffer as archive
const wrapped = wrap(Buffer.from(tarGzData));
```

## ARP - Low-level I/O

ResourceX includes ARP (Agent Resource Protocol) for direct file/network operations:

```typescript
import { createARP } from "resourcexjs/arp";

const arp = createARP();

// File operations
const fileArl = arp.parse("arp:text:file:///path/to/file.txt");
const { content } = await fileArl.resolve();
await fileArl.deposit("new content");
await fileArl.exists();

// HTTP operations
const httpArl = arp.parse("arp:json:https://api.example.com/data");
const { content: data } = await httpArl.resolve();
```

## Configuration Options

```typescript
interface ResourceXConfig {
  /**
   * Base path for local storage.
   * Default: ~/.resourcex
   */
  path?: string;

  /**
   * Central registry URL for push/pull operations.
   */
  registry?: string;

  /**
   * Custom resource types to register.
   */
  types?: BundledType[];

  /**
   * Isolator type for resolver execution.
   * - "none": No isolation (default, fastest)
   * - "srt": OS-level isolation
   * - "cloudflare": Container isolation
   * - "e2b": MicroVM isolation
   */
  isolator?: IsolatorType;
}
```

## Types

### Resource

User-facing resource object returned by `add()` and `info()`.

```typescript
interface Resource {
  locator: string; // Full locator string
  registry?: string; // Registry host (if remote)
  path?: string; // Path within registry
  name: string; // Resource name
  type: string; // Resource type
  tag: string; // Version tag
  files?: string[]; // Files in archive
}
```

### Executable

Result of `use()`.

```typescript
interface Executable<T = unknown> {
  execute: (args?: unknown) => Promise<T>;
  schema?: unknown; // JSON schema for arguments
}
```

### BundledType

Custom resource type definition.

```typescript
interface BundledType {
  name: string; // Type name
  aliases?: string[]; // Alternative names
  description: string; // Human-readable description
  schema?: JSONSchema; // Schema for resolver arguments
  code: string; // Bundled resolver code
}
```

## Error Handling

```typescript
import { RegistryError, ResourceTypeError } from "resourcexjs";

try {
  await rx.resolve("unknown:1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.error("Resource not found:", error.message);
  }
}
```

Error hierarchy:

```
ResourceXError (base)
├── LocatorError      # RXI parsing errors
├── ManifestError     # RXM validation errors
├── ContentError      # RXA operations errors
└── DefinitionError   # RXD validation errors

RegistryError         # Registry operations
ResourceTypeError     # Type not found

ARPError (base)
├── ParseError        # URL parsing
├── TransportError    # Transport operations
└── SemanticError     # Semantic operations
```

## Related Packages

| Package                      | Description                     |
| ---------------------------- | ------------------------------- |
| `@resourcexjs/core`          | Core primitives and CASRegistry |
| `@resourcexjs/node-provider` | Node.js/Bun platform provider   |
| `@resourcexjs/server`        | Registry server                 |
| `@resourcexjs/arp`           | Low-level I/O protocol          |

## License

Apache-2.0
