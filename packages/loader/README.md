# @resourcexjs/loader

Resource loading system for ResourceX.

## Installation

```bash
bun add @resourcexjs/loader
```

## Overview

The `@resourcexjs/loader` package provides a pluggable system for loading resources from various sources (folders, URLs, etc.).

### Key Concepts

- **ResourceLoader**: Strategy interface for loading resources from different sources
- **FolderLoader**: Builtin loader for loading resources from local folders
- **loadResource()**: High-level function that auto-detects and uses appropriate loader

## Usage

### Load Resource from Folder

The simplest way to load a resource:

```typescript
import { loadResource } from "@resourcexjs/loader";

// Load from folder (auto-detects FolderLoader)
const rxr = await loadResource("/path/to/my-prompt");

console.log(rxr.manifest.name); // "my-prompt"
console.log(await rxr.content.text()); // Resource content
```

### Folder Structure

A valid resource folder must contain:

1. **resource.json** - Manifest file with metadata
2. **content** - Content file

Example folder structure:

```
my-prompt/
├── resource.json
└── content
```

**resource.json** format:

```json
{
  "name": "my-prompt",
  "type": "text",
  "version": "1.0.0",
  "domain": "localhost",
  "path": "optional/path",
  "description": "Optional description",
  "tags": ["optional", "tags"]
}
```

### Using FolderLoader Directly

```typescript
import { FolderLoader } from "@resourcexjs/loader";

const loader = new FolderLoader();

// Check if loader can handle source
if (await loader.canLoad("/path/to/resource")) {
  // Load resource
  const rxr = await loader.load("/path/to/resource");
}
```

### Custom Loaders

Implement the `ResourceLoader` interface to create custom loaders:

```typescript
import type { ResourceLoader, RXR } from "@resourcexjs/loader";

class UrlLoader implements ResourceLoader {
  canLoad(source: string): boolean {
    return source.startsWith("http://") || source.startsWith("https://");
  }

  async load(source: string): Promise<RXR> {
    // Fetch and parse resource from URL
    const response = await fetch(source);
    // ... implementation
    return rxr;
  }
}

// Use custom loader
import { loadResource } from "@resourcexjs/loader";

const rxr = await loadResource("https://example.com/resource", {
  loaders: [new UrlLoader(), new FolderLoader()],
});
```

## API Reference

### `loadResource(source, config?)`

Load a resource from a source using auto-detected loader.

**Parameters:**

- `source: string` - Path or identifier to load from
- `config?: LoadResourceConfig` - Optional configuration
  - `loaders?: ResourceLoader[]` - Custom loaders (defaults to `[new FolderLoader()]`)

**Returns**: `Promise<RXR>`

**Throws**: `ResourceXError` if no loader can handle the source or loading fails

```typescript
// With default FolderLoader
const rxr = await loadResource("/path/to/resource");

// With custom loaders
const rxr = await loadResource("https://example.com/resource", {
  loaders: [new UrlLoader(), new FolderLoader()],
});
```

### `FolderLoader`

Loads resources from local filesystem folders.

#### Constructor

```typescript
const loader = new FolderLoader();
```

#### Methods

##### `canLoad(source: string): Promise<boolean>`

Check if source is a valid folder with resource.json.

```typescript
if (await loader.canLoad("/path/to/folder")) {
  // Can load
}
```

##### `load(source: string): Promise<RXR>`

Load resource from folder.

**Throws**: `ResourceXError` if folder structure is invalid

```typescript
const rxr = await loader.load("/path/to/folder");
```

### `ResourceLoader` Interface

Interface for implementing custom loaders.

```typescript
interface ResourceLoader {
  /**
   * Check if this loader can handle the source.
   */
  canLoad(source: string): boolean | Promise<boolean>;

  /**
   * Load resource from source.
   * @throws ResourceXError if loading fails
   */
  load(source: string): Promise<RXR>;
}
```

## Folder Resource Format

### Minimal Example

**resource.json:**

```json
{
  "name": "hello",
  "type": "text",
  "version": "1.0.0"
}
```

**content:**

```
Hello, World!
```

### Full Example

**resource.json:**

```json
{
  "domain": "deepractice.ai",
  "path": "prompts/assistants",
  "name": "chat-assistant",
  "type": "prompt",
  "version": "1.0.0",
  "description": "A helpful chat assistant prompt",
  "tags": ["assistant", "chat", "helpful"]
}
```

**content:**

```
You are a helpful assistant. Be concise and clear.

When asked a question:
1. Understand the context
2. Provide accurate information
3. Be friendly and professional
```

### Default Values

If not specified in resource.json:

- `domain`: defaults to `"localhost"`
- `path`: defaults to `undefined`
- `description`: defaults to `undefined`
- `tags`: defaults to `undefined`

### Required Fields

- `name` (string)
- `type` (string)
- `version` (string)

## Error Handling

```typescript
import { ResourceXError } from "@resourcexjs/loader";

try {
  const rxr = await loadResource("/path/to/resource");
} catch (error) {
  if (error instanceof ResourceXError) {
    console.error("Loading failed:", error.message);
  }
}
```

### Common Errors

**Missing resource.json:**

```
Cannot find resource.json in folder: /path/to/resource
```

**Invalid resource.json:**

```
Invalid resource.json: missing required field 'name'
```

**Missing content file:**

```
Cannot find content file in folder: /path/to/resource
```

## Examples

### Load and Use

```typescript
import { loadResource } from "@resourcexjs/loader";
import { createRegistry } from "@resourcexjs/registry";

// Load resource from folder
const rxr = await loadResource("./my-prompts/assistant");

// Link to registry
const registry = createRegistry();
await registry.link(rxr);

// Resolve later
const resolved = await registry.resolve("localhost/assistant.prompt@1.0.0");
console.log(await resolved.content.text());
```

### Validate Before Loading

```typescript
import { FolderLoader } from "@resourcexjs/loader";

const loader = new FolderLoader();

if (await loader.canLoad("./my-resource")) {
  const rxr = await loader.load("./my-resource");
  console.log("Loaded:", rxr.manifest.name);
} else {
  console.error("Not a valid resource folder");
}
```

### Batch Loading

```typescript
import { loadResource } from "@resourcexjs/loader";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const resourcesDir = "./resources";
const folders = await readdir(resourcesDir);

const resources = await Promise.all(
  folders.map((folder) => loadResource(join(resourcesDir, folder)))
);

console.log(`Loaded ${resources.length} resources`);
```

## Architecture

```
┌─────────────────────────────────────┐
│        loadResource()               │
│  (Auto-detect & delegate)           │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌─────▼──────┐
│FolderLoader │  │UrlLoader   │
│             │  │(custom)    │
└─────────────┘  └────────────┘
```

## Type Safety

All loaders return fully-typed RXR objects:

```typescript
import type { RXR } from "@resourcexjs/loader";

const rxr: RXR = await loadResource("./my-resource");

// TypeScript knows the structure
rxr.locator; // RXL
rxr.manifest; // RXM
rxr.archive; // RXA
```

## License

MIT
