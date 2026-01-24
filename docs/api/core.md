# @resourcexjs/core API Reference

The core package provides the fundamental building blocks for ResourceX: locators (RXL), manifests (RXM), archives (RXA), packages (RXP), and resources (RXR).

## Installation

```bash
bun add @resourcexjs/core
```

## RXL (Resource Locator)

RXL represents a resource locator with the format: `[domain/path/]name[.type][@version]`

### parseRXL

Parses a resource locator string into an RXL object.

```typescript
function parseRXL(locator: string): RXL;
```

**Parameters:**

| Name      | Type     | Description             |
| --------- | -------- | ----------------------- |
| `locator` | `string` | Resource locator string |

**Returns:** `RXL` - Parsed locator object

**Example:**

```typescript
import { parseRXL } from "@resourcexjs/core";

// Full locator with all parts
const rxl = parseRXL("deepractice.ai/sean/assistant.prompt@1.0.0");
console.log(rxl.domain); // "deepractice.ai"
console.log(rxl.path); // "sean"
console.log(rxl.name); // "assistant"
console.log(rxl.type); // "prompt"
console.log(rxl.version); // "1.0.0"
console.log(rxl.toString()); // "deepractice.ai/sean/assistant.prompt@1.0.0"

// Simple locator (name only)
const simple = parseRXL("my-resource");
console.log(simple.name); // "my-resource"

// Locator with type and version
const typed = parseRXL("config.json@2.0.0");
console.log(typed.name); // "config"
console.log(typed.type); // "json"
console.log(typed.version); // "2.0.0"
```

### RXL Interface

```typescript
interface RXL {
  readonly domain?: string;
  readonly path?: string;
  readonly name: string;
  readonly type?: string;
  readonly version?: string;
  toString(): string;
}
```

**Properties:**

| Property  | Type                  | Description                                  |
| --------- | --------------------- | -------------------------------------------- |
| `domain`  | `string \| undefined` | Domain (e.g., "deepractice.ai", "localhost") |
| `path`    | `string \| undefined` | Path within domain (e.g., "sean/tools")      |
| `name`    | `string`              | Resource name (required)                     |
| `type`    | `string \| undefined` | Resource type (e.g., "text", "json")         |
| `version` | `string \| undefined` | Semantic version                             |

**Methods:**

| Method       | Returns  | Description                    |
| ------------ | -------- | ------------------------------ |
| `toString()` | `string` | Convert back to locator string |

---

## RXM (Resource Manifest)

RXM represents resource metadata with all required fields.

### createRXM

Creates a manifest from a data object.

```typescript
function createRXM(data: ManifestData): RXM;
```

**Parameters:**

| Name   | Type           | Description          |
| ------ | -------------- | -------------------- |
| `data` | `ManifestData` | Manifest data object |

**Returns:** `RXM` - Created manifest

**Throws:** `ManifestError` if required fields are missing

**Example:**

```typescript
import { createRXM } from "@resourcexjs/core";

const manifest = createRXM({
  domain: "deepractice.ai",
  path: "tools",
  name: "calculator",
  type: "json",
  version: "1.0.0",
});

console.log(manifest.domain); // "deepractice.ai"
console.log(manifest.toLocator()); // "deepractice.ai/tools/calculator.json@1.0.0"
console.log(manifest.toJSON());
// { domain: "deepractice.ai", path: "tools", name: "calculator", type: "json", version: "1.0.0" }
```

### ManifestData Interface

```typescript
interface ManifestData {
  domain?: string;
  path?: string;
  name?: string;
  type?: string;
  version?: string;
}
```

**Properties:**

| Property  | Type     | Required | Description        |
| --------- | -------- | -------- | ------------------ |
| `domain`  | `string` | Yes      | Domain identifier  |
| `path`    | `string` | No       | Path within domain |
| `name`    | `string` | Yes      | Resource name      |
| `type`    | `string` | Yes      | Resource type      |
| `version` | `string` | Yes      | Semantic version   |

### RXM Interface

```typescript
interface RXM {
  readonly domain: string;
  readonly path?: string;
  readonly name: string;
  readonly type: string;
  readonly version: string;
  toLocator(): string;
  toJSON(): ManifestData;
}
```

**Methods:**

| Method        | Returns        | Description               |
| ------------- | -------------- | ------------------------- |
| `toLocator()` | `string`       | Convert to locator string |
| `toJSON()`    | `ManifestData` | Convert to plain object   |

---

## RXA (Resource Archive)

RXA represents a tar.gz archive container for storage and transfer.

### createRXA

Creates an archive from files or an existing buffer.

```typescript
function createRXA(input: RXAInput): Promise<RXA>;
```

**Parameters:**

| Name    | Type       | Description                    |
| ------- | ---------- | ------------------------------ |
| `input` | `RXAInput` | Files record or archive buffer |

**Returns:** `Promise<RXA>` - Created archive object

**Example:**

```typescript
import { createRXA } from "@resourcexjs/core";

// Single file (stored as "content" internally)
const singleFile = await createRXA({ content: "Hello, World!" });

// Multiple files
const multiFile = await createRXA({
  "index.ts": "export default 42;",
  "styles.css": "body { margin: 0; }",
  "config.json": JSON.stringify({ enabled: true }),
});

// Nested directory structure
const nested = await createRXA({
  "src/index.ts": "// main entry",
  "src/utils/helper.ts": "// helper functions",
  "README.md": "# Documentation",
});

// From existing tar.gz buffer
const fromBuffer = await createRXA({ buffer: tarGzBuffer });
```

### RXAInput Type

```typescript
type RXAInput =
  | Record<string, Buffer | Uint8Array | string> // Files
  | { buffer: Buffer }; // Existing archive
```

### RXA Interface

```typescript
interface RXA {
  readonly stream: ReadableStream<Uint8Array>;
  buffer(): Promise<Buffer>;
  extract(): Promise<RXP>;
}
```

**Properties:**

| Property | Type                         | Description                  |
| -------- | ---------------------------- | ---------------------------- |
| `stream` | `ReadableStream<Uint8Array>` | Raw tar.gz content as stream |

**Methods:**

| Method      | Returns           | Description                        |
| ----------- | ----------------- | ---------------------------------- |
| `buffer()`  | `Promise<Buffer>` | Get raw tar.gz archive buffer      |
| `extract()` | `Promise<RXP>`    | Extract to package for file access |

**Example:**

```typescript
// Create archive
const archive = await createRXA({ content: "Hello" });

// Get raw buffer for storage
const buffer = await archive.buffer();

// Extract to package for reading files
const pkg = await archive.extract();
const content = await pkg.file("content");
console.log(content.toString()); // "Hello"
```

---

## RXP (Resource Package)

RXP represents an extracted package for runtime file access.

### RXP Interface

```typescript
interface RXP {
  paths(): string[];
  tree(): PathNode[];
  file(path: string): Promise<Buffer>;
  files(): Promise<Map<string, Buffer>>;
  pack(): Promise<RXA>;
}

interface PathNode {
  name: string;
  type: "file" | "directory";
  children?: PathNode[];
}
```

**Methods:**

| Method       | Returns                        | Description                     |
| ------------ | ------------------------------ | ------------------------------- |
| `paths()`    | `string[]`                     | Get flat list of all file paths |
| `tree()`     | `PathNode[]`                   | Get hierarchical tree structure |
| `file(path)` | `Promise<Buffer>`              | Read a specific file            |
| `files()`    | `Promise<Map<string, Buffer>>` | Read all files as a map         |
| `pack()`     | `Promise<RXA>`                 | Pack back into an archive       |

**Example:**

```typescript
const archive = await createRXA({
  "src/index.ts": "main code",
  "src/utils.ts": "utils",
  "README.md": "docs",
});

const pkg = await archive.extract();

// Get file paths
console.log(pkg.paths());
// ["src/index.ts", "src/utils.ts", "README.md"]

// Get tree structure
console.log(pkg.tree());
// [{ name: "src", type: "directory", children: [...] }, { name: "README.md", type: "file" }]

// Read single file
const indexContent = await pkg.file("src/index.ts");

// Read all files
const allFiles = await pkg.files();
```

---

## RXR (Resource)

RXR is a complete resource combining locator, manifest, and archive. It is a pure data transfer object (DTO).

### RXR Interface

```typescript
interface RXR {
  locator: RXL;
  manifest: RXM;
  archive: RXA;
}
```

**Properties:**

| Property   | Type  | Description              |
| ---------- | ----- | ------------------------ |
| `locator`  | `RXL` | Resource locator         |
| `manifest` | `RXM` | Resource metadata        |
| `archive`  | `RXA` | Resource content archive |

**Example:**

```typescript
import { parseRXL, createRXM, createRXA, type RXR } from "@resourcexjs/core";

// Create a complete resource
const locator = parseRXL("localhost/hello.text@1.0.0");
const manifest = createRXM({
  domain: "localhost",
  name: "hello",
  type: "text",
  version: "1.0.0",
});
const archive = await createRXA({ content: "Hello, World!" });

const resource: RXR = {
  locator,
  manifest,
  archive,
};

// Access components
console.log(resource.manifest.toLocator()); // "localhost/hello.text@1.0.0"

// Read content
const pkg = await resource.archive.extract();
const text = await pkg.file("content");
console.log(text.toString()); // "Hello, World!"
```

---

## Errors

### ResourceXError

Base error class for all ResourceX errors.

```typescript
class ResourceXError extends Error {
  constructor(message: string, options?: ErrorOptions);
}
```

### LocatorError

Thrown when RXL parsing fails.

```typescript
class LocatorError extends ResourceXError {
  constructor(message: string, locator?: string);
  readonly locator?: string;
}
```

### ManifestError

Thrown when manifest validation fails.

```typescript
class ManifestError extends ResourceXError {
  constructor(message: string);
}
```

### ContentError

Thrown when archive/package operations fail.

```typescript
class ContentError extends ResourceXError {
  constructor(message: string);
}
```

**Example:**

```typescript
import { createRXM, ManifestError } from "@resourcexjs/core";

try {
  createRXM({ name: "test" }); // Missing required fields
} catch (error) {
  if (error instanceof ManifestError) {
    console.error("Manifest validation failed:", error.message);
  }
}
```

---

## Complete Example

```typescript
import {
  parseRXL,
  createRXM,
  createRXA,
  type RXR,
  type RXL,
  type RXM,
  type RXA,
  type RXP,
} from "@resourcexjs/core";

// Parse a locator
const locator: RXL = parseRXL("deepractice.ai/tools/calculator.json@1.0.0");

// Create manifest
const manifest: RXM = createRXM({
  domain: locator.domain!,
  path: locator.path,
  name: locator.name,
  type: locator.type!,
  version: locator.version!,
});

// Create multi-file archive
const archive: RXA = await createRXA({
  content: JSON.stringify({
    name: "Calculator",
    operations: ["add", "subtract", "multiply", "divide"],
  }),
  "schema.json": JSON.stringify({
    type: "object",
    properties: {
      a: { type: "number" },
      b: { type: "number" },
    },
  }),
});

// Assemble resource
const resource: RXR = { locator, manifest, archive };

// Use the resource
const pkg: RXP = await resource.archive.extract();
const files = await pkg.files();
const config = JSON.parse(files.get("content")!.toString());
console.log(config.name); // "Calculator"
```
