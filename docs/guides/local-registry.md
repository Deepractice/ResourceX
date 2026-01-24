# Local Registry Usage Guide

The LocalRegistry provides filesystem-based storage for ResourceX resources. It's the primary registry for local development and serves as a cache for resources pulled from remote registries.

## Creating a Local Registry

### Default Configuration

The simplest way to create a local registry uses the default storage path (`~/.resourcex`):

```typescript
import { createRegistry } from "@resourcexjs/registry";

const registry = createRegistry();
```

### Custom Storage Path

For development or testing, you can specify a custom storage path:

```typescript
const registry = createRegistry({ path: "./my-resources" });
```

### With Custom Resource Types

If you need to handle custom resource types beyond the built-in ones (text, json, binary):

```typescript
import { createRegistry } from "@resourcexjs/registry";
import { myCustomType } from "./my-custom-type";

const registry = createRegistry({
  path: "./resources",
  types: [myCustomType],
});

// Or add types dynamically after creation
registry.supportType(anotherCustomType);
```

## Storage Structure

LocalRegistry organizes resources into two areas:

```
~/.resourcex/
├── local/                              # Development resources (no domain)
│   └── {name}.{type}/
│       └── {version}/
│           ├── manifest.json
│           └── archive.tar.gz
│
└── cache/                              # Remote cached resources (with domain)
    └── {domain}/
        └── {path}/
            └── {name}.{type}/
                └── {version}/
                    ├── manifest.json
                    └── archive.tar.gz
```

- **local/**: Resources without a domain (or with `localhost` domain) are stored here. Used primarily for local development.
- **cache/**: Resources with a domain are stored here. This area caches resources pulled from remote registries.

## Linking Resources

Use `link()` to add resources to the local registry. This is the primary way to store resources during development.

### Basic Text Resource

```typescript
import { createRegistry } from "@resourcexjs/registry";
import { createRXM, createRXA, parseRXL } from "@resourcexjs/core";

const registry = createRegistry();

// Create manifest
const manifest = createRXM({
  domain: "localhost",
  name: "my-prompt",
  type: "text",
  version: "1.0.0",
});

// Create content
const content = await createRXA({ content: "Hello, {{name}}!" });

// Create resource object (RXR)
const resource = {
  locator: parseRXL(manifest.toLocator()),
  manifest,
  content,
};

// Link to registry
await registry.add(resource);
```

### Multi-File Resource

Resources can contain multiple files:

```typescript
const content = await createRXA({
  "src/index.ts": 'console.log("Hello");',
  "src/utils.ts": "export const helper = () => {};",
  "README.md": "# My Project",
});

const manifest = createRXM({
  domain: "localhost",
  name: "my-project",
  type: "text",
  version: "1.0.0",
});

await registry.add({
  locator: parseRXL(manifest.toLocator()),
  manifest,
  content,
});
```

### Resource with Domain (for caching)

When linking resources with a domain (other than localhost), they're stored in the cache area:

```typescript
const manifest = createRXM({
  domain: "deepractice.ai",
  path: "sean",
  name: "assistant",
  type: "text",
  version: "2.0.0",
});

const content = await createRXA({ content: "You are an assistant" });

await registry.add({
  locator: parseRXL(manifest.toLocator()),
  manifest,
  content,
});
// Stored at: ~/.resourcex/cache/deepractice.ai/sean/assistant.text/2.0.0/
```

## Resolving Resources

### Using resolve() - For Executing Resources

The `resolve()` method returns a `ResolvedResource` with an `execute()` function. This is the recommended way to use resources:

```typescript
const resolved = await registry.resolve("localhost/hello.text@1.0.0");

// Get the content lazily
const content = await resolved.execute();
console.log(content); // "Hello, World!"

// Access original resource metadata
console.log(resolved.resource.manifest.name); // "hello"
console.log(resolved.resource.manifest.version); // "1.0.0"
```

The `execute()` function is lazy - content is only read when called, not when resolved.

### Using get() - For Raw Resource Access

Use `get()` when you need access to the raw RXR object without resolving:

```typescript
const rxr = await registry.get("localhost/project.text@1.0.0");

// Access raw content
const files = await rxr.archive.extract().then(pkg => pkg.files();
const indexFile = files.get("src/index.ts");
console.log(indexFile.toString()); // Raw file content

// Or read a single file
const readme = await rxr.archive.extract().then(pkg => pkg.file("README.md");
```

### Locator Formats

Both `resolve()` and `get()` accept locator strings in various formats:

```typescript
// Full format with domain
await registry.resolve("deepractice.ai/sean/assistant.text@1.0.0");

// Local resource (no domain)
await registry.resolve("my-prompt.text@1.0.0");

// With localhost domain (equivalent to no domain)
await registry.resolve("localhost/my-prompt.text@1.0.0");
```

## Checking Resource Existence

```typescript
const exists = await registry.exists("localhost/hello.text@1.0.0");
if (exists) {
  const resolved = await registry.resolve("localhost/hello.text@1.0.0");
  // ...
}
```

## Deleting Resources

```typescript
// Delete from local area (no domain or localhost)
await registry.delete("my-prompt.text@1.0.0");

// Delete from cache area (with domain)
await registry.delete("deepractice.ai/assistant.text@1.0.0");

// Deleting non-existent resources doesn't throw an error
await registry.delete("not-exist.text@1.0.0"); // No error
```

## Searching Resources

Search for resources using query strings and pagination:

### Search by Query

```typescript
// Find all resources containing "prompt"
const results = await registry.search({ query: "prompt" });

for (const rxl of results) {
  console.log(rxl.toString()); // e.g., "localhost/my-prompt.text@1.0.0"
}
```

### Pagination

```typescript
// Get first 10 results
const page1 = await registry.search({ limit: 10 });

// Get next 10 results
const page2 = await registry.search({ limit: 10, offset: 10 });
```

### Combined Options

```typescript
const results = await registry.search({
  query: "foo",
  limit: 5,
  offset: 0,
});
```

### Search All Resources

Omit options to get all resources:

```typescript
const allResources = await registry.search();
```

## Working with Resource Types

### Built-in Types

LocalRegistry supports three built-in types by default:

- **text** (aliases: txt, plaintext) - Returns string content
- **json** (aliases: config, manifest) - Returns parsed JSON
- **binary** (aliases: bin, blob, raw) - Returns Buffer

```typescript
// Text resource
const textResolved = await registry.resolve("my-text.text@1.0.0");
const text: string = await textResolved.execute();

// JSON resource
const jsonResolved = await registry.resolve("config.json@1.0.0");
const data: unknown = await jsonResolved.execute();

// Binary resource
const binaryResolved = await registry.resolve("image.binary@1.0.0");
const buffer: Buffer = await binaryResolved.execute();
```

### Type Aliases

Type aliases are interchangeable:

```typescript
// These all resolve the same way:
await registry.resolve("file.text@1.0.0");
await registry.resolve("file.txt@1.0.0");
await registry.resolve("file.plaintext@1.0.0");
```

## Common Issues and Solutions

### Resource Not Found

```typescript
try {
  await registry.resolve("not-exist.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.log(error.message); // "Resource not found: not-exist.text@1.0.0"
  }
}
```

### Unsupported Type

When trying to link a resource with an unsupported type:

```typescript
import { ResourceTypeError } from "@resourcexjs/type";

try {
  // Assuming "custom" type is not registered
  await registry.add(resourceWithCustomType);
} catch (error) {
  if (error instanceof ResourceTypeError) {
    console.log(error.message); // "Unsupported resource type: custom"

    // Solution: Register the type first
    registry.supportType(customType);
    await registry.add(resourceWithCustomType);
  }
}
```

### Storage Path Issues

If you're having permission issues with the default path:

```typescript
// Use a custom path you have write access to
const registry = createRegistry({ path: "./local-resources" });
```

## Complete Example

```typescript
import { createRegistry } from "@resourcexjs/registry";
import { createRXM, createRXA, parseRXL } from "@resourcexjs/core";

async function main() {
  // Create registry
  const registry = createRegistry();

  // Create and link a resource
  const manifest = createRXM({
    domain: "localhost",
    name: "greeting",
    type: "text",
    version: "1.0.0",
  });

  const content = await createRXA({ content: "Hello, ResourceX!" });

  await registry.add({
    locator: parseRXL(manifest.toLocator()),
    manifest,
    content,
  });

  // Check it exists
  const exists = await registry.exists("localhost/greeting.text@1.0.0");
  console.log("Exists:", exists); // true

  // Resolve and execute
  const resolved = await registry.resolve("localhost/greeting.text@1.0.0");
  const text = await resolved.execute();
  console.log("Content:", text); // "Hello, ResourceX!"

  // Search
  const results = await registry.search({ query: "greeting" });
  console.log("Found:", results.length, "resources");

  // Clean up
  await registry.delete("localhost/greeting.text@1.0.0");
}

main();
```
