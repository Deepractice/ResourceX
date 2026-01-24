# RXP - Resource Package

RXP (ResourceX Package) represents an extracted package that provides runtime file access. It's created by extracting an RXA (Archive) and provides methods to browse and read files.

## Interface

```typescript
interface RXP {
  /** Get flat list of all file paths */
  paths(): string[];

  /** Get hierarchical tree structure of files */
  tree(): PathNode[];

  /** Read a specific file by path */
  file(path: string): Promise<Buffer>;

  /** Read all files as a map */
  files(): Promise<Map<string, Buffer>>;

  /** Pack back into an archive */
  pack(): Promise<RXA>;
}

interface PathNode {
  name: string;
  type: "file" | "directory";
  children?: PathNode[];
}
```

## Creating a Package

Packages are created by extracting an archive:

```typescript
import { createRXA } from "resourcexjs";

const archive = await createRXA({
  "src/index.ts": "export default main;",
  "src/utils/helper.ts": "helper code",
  "styles.css": "body { margin: 0; }",
});

const pkg = await archive.extract();
```

## Browsing Files

### Flat Path List

Use `paths()` to get all file paths as a flat array:

```typescript
const paths = pkg.paths();
// ["src/index.ts", "src/utils/helper.ts", "styles.css"]
```

### Tree Structure

Use `tree()` to get a hierarchical view:

```typescript
const tree = pkg.tree();
// [
//   {
//     name: "src",
//     type: "directory",
//     children: [
//       { name: "index.ts", type: "file" },
//       {
//         name: "utils",
//         type: "directory",
//         children: [
//           { name: "helper.ts", type: "file" }
//         ]
//       }
//     ]
//   },
//   { name: "styles.css", type: "file" }
// ]
```

## Reading Files

### Single File

Use `file(path)` to read a specific file:

```typescript
const buffer = await pkg.file("src/index.ts");
const code = buffer.toString();
console.log(code); // "export default main;"
```

### All Files

Use `files()` to get all files as a Map:

```typescript
const allFiles = await pkg.files();

for (const [path, buffer] of allFiles) {
  console.log(`${path}: ${buffer.length} bytes`);
}
// src/index.ts: 20 bytes
// src/utils/helper.ts: 11 bytes
// styles.css: 18 bytes
```

## Packing Back to Archive

Use `pack()` to create an archive from the package:

```typescript
const archive = await createRXA({ content: "original" });
const pkg = await archive.extract();

// ... modify or process files ...

// Pack back to archive
const newArchive = await pkg.pack();
const buffer = await newArchive.buffer();
```

## Error Handling

### File Not Found

Attempting to read a non-existent file throws `ContentError`:

```typescript
import { ContentError } from "resourcexjs";

const pkg = await archive.extract();

try {
  await pkg.file("not-exists.txt");
} catch (error) {
  if (error instanceof ContentError) {
    console.log(error.message); // "file not found: not-exists.txt"
  }
}
```

## Caching

RXP caches file contents internally for efficient repeated access:

```typescript
const pkg = await archive.extract();

// First call: reads from internal storage
const files1 = await pkg.files();

// Second call: returns cached result (instant)
const files2 = await pkg.files();
```

## Built-in Type Conventions

Built-in types expect a specific file named "content":

| Type     | Expected File | Result Type |
| -------- | ------------- | ----------- |
| `text`   | `content`     | `string`    |
| `json`   | `content`     | `unknown`   |
| `binary` | `content`     | `Buffer`    |

```typescript
// For text type
const archive = await createRXA({ content: "Hello" });
const pkg = await archive.extract();
const text = (await pkg.file("content")).toString();

// For json type
const jsonArchive = await createRXA({ content: '{"key": "value"}' });
const jsonPkg = await jsonArchive.extract();
const obj = JSON.parse((await jsonPkg.file("content")).toString());
```

Custom types can define their own file conventions.

## Common Patterns

### Iterating Directory Structure

```typescript
function printTree(nodes: PathNode[], indent = 0) {
  for (const node of nodes) {
    const prefix = "  ".repeat(indent);
    const icon = node.type === "directory" ? "📁" : "📄";
    console.log(`${prefix}${icon} ${node.name}`);
    if (node.children) {
      printTree(node.children, indent + 1);
    }
  }
}

printTree(pkg.tree());
// 📁 src
//   📄 index.ts
//   📁 utils
//     📄 helper.ts
// 📄 styles.css
```

### Finding Files by Extension

```typescript
const paths = pkg.paths();
const tsFiles = paths.filter((p) => p.endsWith(".ts"));
// ["src/index.ts", "src/utils/helper.ts"]
```

### Loading JSON Configuration

```typescript
const configBuffer = await pkg.file("config.json");
const config = JSON.parse(configBuffer.toString());
```

## API Reference

```typescript
import { createRXA, ContentError } from "@resourcexjs/core";
// or
import { createRXA, ContentError } from "resourcexjs";

// Create package by extracting archive
const archive = await createRXA({ ... });
const pkg: RXP = await archive.extract();

// Package methods
pkg.paths(): string[]
pkg.tree(): PathNode[]
pkg.file(path: string): Promise<Buffer>
pkg.files(): Promise<Map<string, Buffer>>
pkg.pack(): Promise<RXA>
```

## See Also

- [RXA - Resource Archive](./rxa-archive.md) - Compressed archive for storage
- [RXM - Resource Manifest](./rxm-manifest.md) - Metadata paired with content
- [RXR - Complete Resource](./rxr-resource.md) - How package combines with manifest
- [Type System](./type-system.md) - How content is serialized and resolved
