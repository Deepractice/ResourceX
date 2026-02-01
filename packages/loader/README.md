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
- **FolderLoader**: Built-in loader for loading resources from local folders
- **loadResource()**: High-level function that uses a loader to create RXR objects

## Usage

### Load Resource from Folder

The simplest way to load a resource:

```typescript
import { loadResource } from "@resourcexjs/loader";

// Load from folder (uses FolderLoader by default)
const rxr = await loadResource("./my-prompt");

console.log(rxr.manifest.name); // "my-prompt"
console.log(rxr.manifest.type); // "text"
```

### Folder Structure

A valid resource folder must contain:

1. **resource.json** - Manifest file with metadata
2. **Any other files** - Content files (all files except resource.json are packaged)

Example folder structure:

```
my-prompt/
├── resource.json
└── content
```

Or with multiple files:

```
my-component/
├── resource.json
├── index.ts
├── styles.css
└── utils/
    └── helper.ts
```

**resource.json** format:

```json
{
  "name": "my-prompt",
  "type": "text",
  "version": "1.0.0",
  "domain": "localhost",
  "path": "optional/path"
}
```

### Using FolderLoader Directly

```typescript
import { FolderLoader } from "@resourcexjs/loader";

const loader = new FolderLoader();

// Check if loader can handle source
if (await loader.canLoad("./my-resource")) {
  const rxr = await loader.load("./my-resource");
  console.log(rxr.manifest.name);
}
```

### Custom Loaders

Implement the `ResourceLoader` interface to create custom loaders:

```typescript
import type { ResourceLoader } from "@resourcexjs/loader";
import type { RXR } from "@resourcexjs/core";

class UrlLoader implements ResourceLoader {
  async canLoad(source: string): Promise<boolean> {
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
  loader: new UrlLoader(),
});
```

## API Reference

### `loadResource(source, config?)`

Load a resource from a source using a loader.

**Parameters:**

- `source: string` - Path or identifier to load from
- `config?: LoadResourceConfig` - Optional configuration
  - `loader?: ResourceLoader` - Custom loader (defaults to `FolderLoader`)

**Returns**: `Promise<RXR>`

**Throws**: `ResourceXError` if the source cannot be loaded

```typescript
// With default FolderLoader
const rxr = await loadResource("./my-resource");

// With custom loader
const rxr = await loadResource("https://example.com/resource", {
  loader: new UrlLoader(),
});
```

### `FolderLoader`

Loads resources from local filesystem folders.

#### Methods

##### `canLoad(source: string): Promise<boolean>`

Check if source is a valid folder with resource.json.

```typescript
const loader = new FolderLoader();
if (await loader.canLoad("./my-resource")) {
  // Can load
}
```

##### `load(source: string): Promise<RXR>`

Load resource from folder. Reads all files in the folder (except resource.json) into the archive.

**Throws**: `ResourceXError` if folder structure is invalid

```typescript
const rxr = await loader.load("./my-resource");
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
  "version": "1.0.0"
}
```

**content:**

```
You are a helpful assistant. Be concise and clear.
```

### Required Fields

- `name` (string)
- `type` (string)
- `version` (string)

### Optional Fields

- `domain` - defaults to `"localhost"`
- `path` - defaults to `undefined`

## Error Handling

```typescript
import { loadResource } from "@resourcexjs/loader";
import { ResourceXError } from "@resourcexjs/core";

try {
  const rxr = await loadResource("./my-resource");
} catch (error) {
  if (error instanceof ResourceXError) {
    console.error("Loading failed:", error.message);
  }
}
```

### Common Errors

**Cannot load resource:**

```
ResourceXError: Cannot load resource from: /path/to/resource
```

**Missing resource.json:**

```
ResourceXError: Failed to read resource.json: ...
```

**Invalid resource.json:**

```
ResourceXError: Invalid resource.json: missing required field 'name'
```

**No content files:**

```
ResourceXError: No content files found in resource folder
```

## Examples

### Load and Store in Registry

```typescript
import { loadResource } from "@resourcexjs/loader";
import { LocalRegistry } from "@resourcexjs/registry";
import { FileSystemStorage } from "@resourcexjs/storage";

// Load resource from folder
const rxr = await loadResource("./my-prompts/assistant");

// Store in registry
const storage = new FileSystemStorage("./resources");
const registry = new LocalRegistry(storage);
await registry.put(rxr);

// Retrieve later
const resource = await registry.get(rxr.locator);
console.log(resource.manifest.name);
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

## License

Apache-2.0
