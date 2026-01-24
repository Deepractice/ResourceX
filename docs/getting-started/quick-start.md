# Quick Start

This guide will help you create and use your first ResourceX resource in about 5 minutes.

## Prerequisites

Make sure you have [installed ResourceX](./installation.md):

```bash
npm install resourcexjs
# or
bun add resourcexjs
```

## Step 1: Create a Resource

A resource in ResourceX consists of three parts:

- **Locator (RXL)** - The address: `domain/path/name.type@version`
- **Manifest (RXM)** - Metadata about the resource
- **Archive (RXA)** - The actual content

Let's create a simple text resource:

```typescript
import { parseRXL, createRXM, createRXA } from "resourcexjs";

// Create the manifest (metadata)
const manifest = createRXM({
  domain: "localhost", // Use 'localhost' for local development
  name: "greeting",
  type: "text",
  version: "1.0.0",
});

// Create the content
const content = await createRXA({
  content: "Hello! I am a helpful AI assistant.",
});

// Combine into a complete resource (RXR)
const resource = {
  locator: parseRXL(manifest.toLocator()),
  manifest,
  content,
};

console.log("Resource created:", resource.locator.toString());
// Output: localhost/greeting.text@1.0.0
```

## Step 2: Link to Local Registry

Link the resource to your local registry so it can be resolved later:

```typescript
import { createRegistry } from "resourcexjs";

// Create a registry (uses ~/.resourcex by default)
const registry = createRegistry();

// Link the resource
await registry.add(resource);

console.log("Resource linked successfully!");
```

The resource is now stored at:

```
~/.resourcex/localhost/greeting.text/1.0.0/
├── manifest.json
└── archive.tar.gz
```

## Step 3: Resolve the Resource

Retrieve and use the resource by its locator:

```typescript
// Resolve by locator string
const resolved = await registry.resolve("localhost/greeting.text@1.0.0");

// Execute to get the content (lazy loading)
const text = await resolved.execute();

console.log("Content:", text);
// Output: Hello! I am a helpful AI assistant.
```

## Step 4: Check and Delete

```typescript
// Check if a resource exists
const exists = await registry.exists("localhost/greeting.text@1.0.0");
console.log("Exists:", exists); // true

// Delete the resource
await registry.delete("localhost/greeting.text@1.0.0");

// Verify deletion
const stillExists = await registry.exists("localhost/greeting.text@1.0.0");
console.log("Still exists:", stillExists); // false
```

## Complete Example

Here's the full code combining all steps:

```typescript
import { createRegistry, parseRXL, createRXM, createRXA } from "resourcexjs";

async function main() {
  // 1. Create the resource
  const manifest = createRXM({
    domain: "localhost",
    name: "greeting",
    type: "text",
    version: "1.0.0",
  });

  const content = await createRXA({
    content: "Hello! I am a helpful AI assistant.",
  });

  const resource = {
    locator: parseRXL(manifest.toLocator()),
    manifest,
    content,
  };

  // 2. Link to registry
  const registry = createRegistry();
  await registry.add(resource);
  console.log("Linked:", resource.locator.toString());

  // 3. Resolve and use
  const resolved = await registry.resolve("localhost/greeting.text@1.0.0");
  const text = await resolved.execute();
  console.log("Content:", text);

  // 4. Search for resources
  const results = await registry.search({ query: "greeting" });
  console.log("Found:", results.length, "resources");

  // 5. Clean up
  await registry.delete("localhost/greeting.text@1.0.0");
  console.log("Deleted");
}

main().catch(console.error);
```

## Working with Multi-File Resources

Resources can contain multiple files:

```typescript
const content = await createRXA({
  "main.txt": "Main content here",
  "examples/example1.txt": "First example",
  "examples/example2.txt": "Second example",
});

// Read a specific file
const mainBuffer = await content.file("main.txt");
console.log(mainBuffer.toString());

// Read all files
const files = await content.files();
for (const [path, buffer] of files) {
  console.log(`${path}: ${buffer.toString()}`);
}
```

## Loading Resources from Folders

For easier development, organize resources in folders:

```
my-prompt/
├── resource.json    # Manifest
└── content          # Content file
```

`resource.json`:

```json
{
  "name": "my-prompt",
  "type": "text",
  "version": "1.0.0",
  "domain": "localhost"
}
```

Load and link:

```typescript
import { loadResource, createRegistry } from "resourcexjs";

const resource = await loadResource("./my-prompt");
const registry = createRegistry();
await registry.add(resource);
```

## Next Steps

Now that you understand the basics, explore:

- [Introduction](./introduction.md) - Deep dive into core concepts
- **Core Concepts** - RXL, RXM, RXA, RXP, RXR in detail
- **Registry** - Local, Remote, and Git registries
- **Type System** - Custom resource types
