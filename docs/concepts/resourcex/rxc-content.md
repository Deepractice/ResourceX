# RXC - Resource Content

RXC (ResourceX Content) is an archive-based content container. Internally it uses tar.gz format, but externally provides a clean file access API. This unified approach handles both single-file and multi-file resources consistently.

## Interface

```typescript
interface RXC {
  /** Content as a readable stream (tar.gz format) */
  readonly stream: ReadableStream<Uint8Array>;

  /** Get raw archive buffer (tar.gz format) */
  buffer(): Promise<Buffer>;

  /** Read a specific file from the archive */
  file(path: string): Promise<Buffer>;

  /** Read all files from the archive */
  files(): Promise<Map<string, Buffer>>;
}
```

## Creating Content

### Single File

The simplest case - a single file named "content":

```typescript
import { createRXC } from "resourcexjs";

// String content
const content = await createRXC({ content: "Hello World" });

// Reading back
const buffer = await content.file("content");
console.log(buffer.toString()); // "Hello World"
```

### Named Single File

You can use any filename:

```typescript
const content = await createRXC({ "index.ts": "export const foo = 1;" });

const buffer = await content.file("index.ts");
```

### Multiple Files

Pass an object with multiple file paths:

```typescript
const content = await createRXC({
  "index.ts": "export default main;",
  "styles.css": "body { margin: 0; }",
  "README.md": "# My Resource",
});

// Read single file
const indexBuffer = await content.file("index.ts");

// Read all files
const allFiles = await content.files();
// Map { "index.ts" => Buffer, "styles.css" => Buffer, "README.md" => Buffer }
```

### Nested Directory Structure

Paths can include directories:

```typescript
const content = await createRXC({
  "src/index.ts": "main code",
  "src/utils/helper.ts": "helper code",
  "styles/main.css": "css styles",
});

// Access nested files
const helper = await content.file("src/utils/helper.ts");
```

### From Existing Archive

If you already have a tar.gz buffer:

```typescript
const existingArchive = await fetchArchiveFromSomewhere();

const content = await createRXC({ archive: existingArchive });
```

### Buffer Content

Files can be strings or Buffers:

```typescript
const content = await createRXC({
  "text.txt": "plain text",
  "binary.bin": Buffer.from([0x00, 0x01, 0x02, 0x03]),
});
```

## Reading Content

### Single File

Use `file(path)` to read a specific file:

```typescript
const content = await createRXC({
  "data.json": '{"key": "value"}',
});

const buffer = await content.file("data.json");
const data = JSON.parse(buffer.toString());
```

### All Files

Use `files()` to get all files as a Map:

```typescript
const content = await createRXC({
  "a.txt": "aaa",
  "b.txt": "bbb",
});

const allFiles = await content.files();

for (const [path, buffer] of allFiles) {
  console.log(`${path}: ${buffer.toString()}`);
}
// a.txt: aaa
// b.txt: bbb
```

### Raw Archive Buffer

Use `buffer()` to get the raw tar.gz data:

```typescript
const content = await createRXC({ content: "test" });

const tarGzBuffer = await content.buffer();
// Can be stored, transmitted, etc.
```

### Stream

Access the tar.gz stream for efficient processing:

```typescript
const content = await createRXC({ content: "large content..." });

const stream = content.stream;
// Use with streaming APIs
```

## Error Handling

### File Not Found

Attempting to read a non-existent file throws `ContentError`:

```typescript
import { ContentError } from "resourcexjs";

const content = await createRXC({ "exists.txt": "data" });

try {
  await content.file("not-exists.txt");
} catch (error) {
  if (error instanceof ContentError) {
    console.log(error.message); // "file not found: not-exists.txt"
  }
}
```

## Design Decisions

### Why tar.gz?

1. **Standard format**: Widely supported, well-understood
2. **Preserves structure**: Maintains directory hierarchy
3. **Compression**: Efficient storage and transmission
4. **Streaming**: Can be processed without loading entirely into memory

### Why Archive for Single Files?

Using archives even for single files provides:

1. **Consistency**: Same API for all resources
2. **Future-proofing**: Easy to add files later
3. **Metadata**: tar format includes file metadata
4. **Unified storage**: Registry stores all content the same way

### Why Lazy Loading?

The `file()` and `files()` methods are async because:

1. Content is decompressed on demand
2. Results are cached after first read
3. Supports streaming from remote sources

## Content Caching

RXC caches the decompressed file map internally:

```typescript
const content = await createRXC({ "file.txt": "data" });

// First call: decompresses archive
const files1 = await content.files();

// Second call: returns cached result (instant)
const files2 = await content.files();
```

## Built-in Type Conventions

Built-in types expect specific file names:

| Type     | Expected File |
| -------- | ------------- |
| `text`   | `content`     |
| `json`   | `content`     |
| `binary` | `content`     |

Custom types can define their own conventions.

```typescript
// For text type
const textContent = await createRXC({ content: "Hello" });
const text = (await textContent.file("content")).toString();

// For json type
const jsonContent = await createRXC({ content: '{"key": "value"}' });
const obj = JSON.parse((await jsonContent.file("content")).toString());
```

## Common Patterns

### Creating from JSON

```typescript
const data = { users: ["alice", "bob"], count: 2 };
const content = await createRXC({
  content: JSON.stringify(data, null, 2),
});
```

### Multi-File Resource

```typescript
// A prompt resource with template and schema
const promptContent = await createRXC({
  "template.txt": "Hello, {{name}}!",
  "schema.json": JSON.stringify({
    type: "object",
    properties: { name: { type: "string" } },
  }),
});
```

### Binary Resource

```typescript
import { readFile } from "node:fs/promises";

const imageBuffer = await readFile("./image.png");
const content = await createRXC({
  content: imageBuffer,
});
```

## API Reference

```typescript
import { createRXC, ContentError } from "@resourcexjs/core";
// or
import { createRXC, ContentError } from "resourcexjs";

// Create from files
const rxc: RXC = await createRXC(files: Record<string, Buffer | Uint8Array | string>);

// Create from existing archive
const rxc: RXC = await createRXC({ archive: Buffer });

// Type definitions
type RXCInput =
  | Record<string, Buffer | Uint8Array | string>
  | { archive: Buffer };
```

## See Also

- [RXM - Resource Manifest](./rxm-manifest.md) - Metadata paired with content
- [RXR - Complete Resource](./rxr-resource.md) - How content combines with manifest
- [Type System](./type-system.md) - How content is serialized and resolved
