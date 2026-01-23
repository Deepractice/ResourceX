# Semantic Layer

The Semantic Layer in ARP defines how raw bytes are interpreted and transformed. While the Transport Layer handles **where** data is accessed, the Semantic Layer handles **what** the data means.

## SemanticHandler Interface

Every semantic implements the `SemanticHandler` interface:

```typescript
interface SemanticHandler<T = unknown> {
  readonly name: string;

  // Core operations
  resolve(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<Resource<T>>;

  deposit?(
    transport: TransportHandler,
    location: string,
    data: T,
    context: SemanticContext
  ): Promise<void>;

  // Optional operations (fallback to transport if not implemented)
  exists?(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<boolean>;

  delete?(transport: TransportHandler, location: string, context: SemanticContext): Promise<void>;
}
```

**Key points:**

- Semantics orchestrate transport operations
- `resolve` transforms raw bytes into typed content
- `deposit` transforms typed content into bytes for storage
- `exists` and `delete` are optional (fall back to transport)

## SemanticContext

Operations receive context about the request:

```typescript
interface SemanticContext {
  url: string; // Original ARP URL
  semantic: string; // Semantic type (e.g., "text")
  transport: string; // Transport type (e.g., "file")
  location: string; // Resource location
  timestamp: Date; // Request timestamp
  params?: TransportParams; // Runtime parameters
}
```

## Resource Object

Semantics return a `Resource` object from `resolve`:

```typescript
interface Resource<T = unknown> {
  type: string; // Semantic type
  content: T; // Interpreted content
  meta: ResourceMeta;
}

interface ResourceMeta {
  url: string;
  semantic: string;
  transport: string;
  location: string;
  size: number;
  encoding?: string;
  mimeType?: string;
  resolvedAt: string;
  type?: "file" | "directory";
}
```

## Built-in Semantics

ARP provides two built-in semantics:

### text

Interprets content as UTF-8 encoded text.

**Resolve behavior:**

- Decodes bytes as UTF-8 string
- For directories: Returns JSON array of filenames as string

**Deposit behavior:**

- Encodes string as UTF-8 bytes

```typescript
const arl = arp.parse("arp:text:file://./hello.txt");

// Resolve returns string content
const resource = await arl.resolve();
console.log(typeof resource.content); // "string"
console.log(resource.content); // "Hello, World!"
console.log(resource.type); // "text"
console.log(resource.meta.encoding); // "utf-8"
console.log(resource.meta.mimeType); // "text/plain"

// Deposit accepts string
await arl.deposit("New content");
```

**Directory handling:**

```typescript
const dirArl = arp.parse("arp:text:file://./src");
const resource = await dirArl.resolve();

console.log(resource.content); // '["index.ts","utils.ts","types.ts"]'
console.log(resource.meta.type); // "directory"
console.log(resource.meta.mimeType); // "application/json"

// Parse as array
const files = JSON.parse(resource.content);
```

### binary

Handles raw binary data without transformation.

**Resolve behavior:**

- Returns content as Buffer directly
- No encoding or transformation applied

**Deposit behavior:**

- Accepts Buffer, Uint8Array, ArrayBuffer, or number array
- Writes raw bytes without transformation

```typescript
const arl = arp.parse("arp:binary:file://./image.png");

// Resolve returns Buffer
const resource = await arl.resolve();
console.log(Buffer.isBuffer(resource.content)); // true
console.log(resource.type); // "binary"
console.log(resource.meta.size); // 1234

// Deposit accepts various binary types
await arl.deposit(Buffer.from([0x89, 0x50, 0x4e, 0x47])); // Buffer
await arl.deposit(new Uint8Array([1, 2, 3, 4])); // Uint8Array
await arl.deposit(arrayBuffer); // ArrayBuffer
await arl.deposit([0x48, 0x45, 0x4c, 0x4c, 0x4f]); // number[]
```

**Supported input types for deposit:**

```typescript
type BinaryInput = Buffer | Uint8Array | ArrayBuffer | number[];
```

## Custom Semantics

Create custom semantics by implementing `SemanticHandler`:

### JSON Semantic Example

```typescript
import type {
  SemanticHandler,
  TransportHandler,
  SemanticContext,
  Resource,
  ResourceMeta,
} from "@resourcexjs/arp";

interface JsonResource extends Resource<unknown> {
  type: "json";
  content: unknown;
}

class JsonSemanticHandler implements SemanticHandler<unknown> {
  readonly name = "json";

  async resolve(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<JsonResource> {
    const result = await transport.get(location, context.params);

    // Parse JSON content
    const text = result.content.toString("utf-8");
    const content = JSON.parse(text);

    const meta: ResourceMeta = {
      url: context.url,
      semantic: context.semantic,
      transport: context.transport,
      location: context.location,
      size: result.content.length,
      encoding: "utf-8",
      mimeType: "application/json",
      resolvedAt: context.timestamp.toISOString(),
      type: "file",
    };

    return { type: "json", content, meta };
  }

  async deposit(
    transport: TransportHandler,
    location: string,
    data: unknown,
    context: SemanticContext
  ): Promise<void> {
    // Serialize JSON with pretty printing
    const json = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(json, "utf-8");
    await transport.set(location, buffer, context.params);
  }
}

const jsonSemantic = new JsonSemanticHandler();
```

### Package Semantic Example

A more complex semantic that handles multi-file packages:

```typescript
interface PackageContent {
  manifest: object;
  files: Map<string, Buffer>;
}

class PackageSemanticHandler implements SemanticHandler<PackageContent> {
  readonly name = "package";

  async resolve(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<Resource<PackageContent>> {
    // Read manifest
    const manifestResult = await transport.get(`${location}/package.json`, context.params);
    const manifest = JSON.parse(manifestResult.content.toString("utf-8"));

    // Read all files in package
    const files = new Map<string, Buffer>();
    if (transport.list) {
      const fileList = await transport.list(location, { recursive: true });
      for (const file of fileList) {
        const fileResult = await transport.get(`${location}/${file}`);
        files.set(file, fileResult.content);
      }
    }

    const meta: ResourceMeta = {
      url: context.url,
      semantic: context.semantic,
      transport: context.transport,
      location: context.location,
      size: files.size,
      mimeType: "application/x-package",
      resolvedAt: context.timestamp.toISOString(),
      type: "directory",
    };

    return {
      type: "package",
      content: { manifest, files },
      meta,
    };
  }

  async deposit(
    transport: TransportHandler,
    location: string,
    data: PackageContent,
    context: SemanticContext
  ): Promise<void> {
    // Write manifest
    const manifestBuffer = Buffer.from(JSON.stringify(data.manifest, null, 2));
    await transport.set(`${location}/package.json`, manifestBuffer);

    // Write all files
    for (const [path, content] of data.files) {
      await transport.set(`${location}/${path}`, content);
    }
  }
}
```

### Registering Custom Semantics

**At creation time:**

```typescript
const arp = createARP({
  semantics: [jsonSemantic],
});

const arl = arp.parse("arp:json:file://./config.json");
```

**After creation:**

```typescript
const arp = createARP();
arp.registerSemantic(jsonSemantic);

const arl = arp.parse("arp:json:file://./config.json");
```

### Semantic Override

Registering a semantic with an existing name replaces the previous handler:

```typescript
const customTextSemantic = new CustomTextHandler();
customTextSemantic.name = "text";

const arp = createARP({
  semantics: [customTextSemantic],
});

// Uses custom text handler
arp.parse("arp:text:file://./data.txt");
```

## Semantic and Transport Interaction

Semantics orchestrate transport operations. The relationship:

```
Application calls ARL.resolve()
         │
         ▼
┌─────────────────────────────────────────────────┐
│              Semantic Handler                    │
│  1. Create context                               │
│  2. Call transport.get(location, params)         │
│  3. Transform bytes → typed content              │
│  4. Build metadata                               │
│  5. Return Resource object                       │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│              Transport Handler                   │
│  1. Access storage (filesystem, network, etc.)   │
│  2. Return raw bytes + metadata                  │
└─────────────────────────────────────────────────┘
```

**Example flow for `arp:text:file://./hello.txt`:**

1. Application calls `arl.resolve()`
2. ARL gets `textSemantic` and `fileTransport` from ARP
3. ARL calls `textSemantic.resolve(fileTransport, "./hello.txt", context)`
4. Text semantic calls `fileTransport.get("./hello.txt")`
5. File transport reads file, returns `{ content: Buffer, metadata: {...} }`
6. Text semantic converts `Buffer` to UTF-8 string
7. Text semantic builds `Resource<string>` with metadata
8. Application receives `{ type: "text", content: "Hello", meta: {...} }`

## Error Handling

Semantics throw `SemanticError` for operation failures:

```typescript
import { SemanticError } from "@resourcexjs/arp";

try {
  const arl = arp.parse("arp:json:file://./invalid.json");
  await arl.resolve();
} catch (error) {
  if (error instanceof SemanticError) {
    console.error("Semantic:", error.semantic); // "json"
    console.error("Message:", error.message); // JSON parse error
  }
}
```

**Semantic errors vs Transport errors:**

- `SemanticError`: Data interpretation failed (e.g., invalid JSON)
- `TransportError`: I/O operation failed (e.g., file not found)

```typescript
// Transport error - file doesn't exist
arp.parse("arp:json:file://./not-found.json").resolve();
// → TransportError: File get error: ENOENT

// Semantic error - file exists but invalid JSON
arp.parse("arp:json:file://./invalid.json").resolve();
// → SemanticError: Failed to parse JSON
```

## Comparison: text vs binary

| Aspect             | text                      | binary                                    |
| ------------------ | ------------------------- | ----------------------------------------- |
| Content type       | `string`                  | `Buffer`                                  |
| Encoding           | UTF-8                     | None                                      |
| Transformation     | Decode/encode             | Pass-through                              |
| Directory handling | JSON array string         | Raw listing buffer                        |
| Deposit input      | `string`                  | Buffer, Uint8Array, ArrayBuffer, number[] |
| Use case           | Text files, configs, JSON | Images, archives, executables             |

## Best Practices

**1. Choose the right semantic:**

- Use `text` for human-readable content
- Use `binary` for files that shouldn't be decoded

**2. Handle errors gracefully:**

- Wrap transport calls in try-catch
- Provide meaningful error messages

**3. Include comprehensive metadata:**

- Size, encoding, MIME type when known
- Timestamp for cache management

**4. Consider directory handling:**

- Decide how your semantic handles directories
- Text returns JSON array; binary returns raw buffer

## Next Steps

- [Transport Layer](./transport.md) - How transports handle I/O
- [ARL - Agent Resource Locator](./arl.md) - Working with parsed URLs
- [ARP Protocol Overview](./protocol.md) - High-level architecture
