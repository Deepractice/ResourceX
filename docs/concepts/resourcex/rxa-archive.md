# RXA - Resource Archive

RXA (ResourceX Archive) is a tar.gz archive container used for storage and transfer. It provides the compressed representation of resource content that can be extracted to an RXP (Package) for runtime file access.

## Interface

```typescript
interface RXA {
  /** Archive as a readable stream (tar.gz format) */
  readonly stream: ReadableStream<Uint8Array>;

  /** Get raw archive buffer (tar.gz format) */
  buffer(): Promise<Buffer>;

  /** Extract archive to a package for file access */
  extract(): Promise<RXP>;
}
```

## Creating Archives

### Single File (Default)

The simplest case creates a single file named "content":

```typescript
import { createRXA } from "resourcexjs";

// String content
const archive = await createRXA({ content: "Hello World" });

// Extract and read back
const pkg = await archive.extract();
const buffer = await pkg.file("content");
console.log(buffer.toString()); // "Hello World"
```

### Named Single File

You can use any filename:

```typescript
const archive = await createRXA({ "index.ts": "export const foo = 1;" });

const pkg = await archive.extract();
const buffer = await pkg.file("index.ts");
```

### Multiple Files

Pass an object with multiple file paths:

```typescript
const archive = await createRXA({
  "index.ts": "export default main;",
  "styles.css": "body { margin: 0; }",
  "README.md": "# My Resource",
});

const pkg = await archive.extract();

// Read single file
const indexBuffer = await pkg.file("index.ts");

// Read all files
const allFiles = await pkg.files();
// Map { "index.ts" => Buffer, "styles.css" => Buffer, "README.md" => Buffer }
```

### Nested Directory Structure

Paths can include directories:

```typescript
const archive = await createRXA({
  "src/index.ts": "main code",
  "src/utils/helper.ts": "helper code",
  "styles/main.css": "css styles",
});

const pkg = await archive.extract();
const helper = await pkg.file("src/utils/helper.ts");
```

### From Existing Archive Buffer

If you already have a tar.gz buffer:

```typescript
const existingArchive = await fetchArchiveFromSomewhere();

const archive = await createRXA({ buffer: existingArchive });
```

### Buffer Content

Files can be strings or Buffers:

```typescript
const archive = await createRXA({
  "text.txt": "plain text",
  "binary.bin": Buffer.from([0x00, 0x01, 0x02, 0x03]),
});
```

## Accessing Archive Data

### Raw Archive Buffer

Use `buffer()` to get the raw tar.gz data for storage:

```typescript
const archive = await createRXA({ content: "test" });

const tarGzBuffer = await archive.buffer();
// Can be stored to file, transmitted over network, etc.
```

### Stream

Access the tar.gz stream for efficient streaming:

```typescript
const archive = await createRXA({ content: "large content..." });

const stream = archive.stream;
// Use with streaming APIs
```

### Extract to Package

Use `extract()` to get an RXP for file access:

```typescript
const archive = await createRXA({
  "data.json": '{"key": "value"}',
});

const pkg = await archive.extract();
const buffer = await pkg.file("data.json");
const data = JSON.parse(buffer.toString());
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

### Why Separate RXA and RXP?

The separation provides clear responsibilities:

- **RXA** is optimized for storage/transfer (compressed)
- **RXP** is optimized for runtime access (extracted)

This mirrors common patterns like downloading a .tar.gz file and extracting it before use.

## Caching

RXA caches the extracted package internally:

```typescript
const archive = await createRXA({ "file.txt": "data" });

// First call: extracts archive
const pkg1 = await archive.extract();

// Second call: returns cached package (instant)
const pkg2 = await archive.extract();

// Same instance
console.log(pkg1 === pkg2); // true
```

## API Reference

```typescript
import { createRXA, ContentError } from "@resourcexjs/core";
// or
import { createRXA, ContentError } from "resourcexjs";

// Create from files
const rxa: RXA = await createRXA(files: Record<string, Buffer | Uint8Array | string>);

// Create from existing archive buffer
const rxa: RXA = await createRXA({ buffer: Buffer });

// Type definitions
type RXAInput =
  | Record<string, Buffer | Uint8Array | string>
  | { buffer: Buffer };
```

## See Also

- [RXP - Resource Package](./rxp-package.md) - Extracted package for file access
- [RXM - Resource Manifest](./rxm-manifest.md) - Metadata paired with archive
- [RXR - Complete Resource](./rxr-resource.md) - How archive combines with manifest
- [Type System](./type-system.md) - How content is serialized and resolved
