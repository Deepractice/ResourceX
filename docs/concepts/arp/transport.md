# Transport Layer

The Transport Layer in ARP handles the low-level I/O operations - moving bytes to and from storage locations. It is responsible for **where** and **how** to access data, not what the data means.

## TransportHandler Interface

Every transport implements the `TransportHandler` interface:

```typescript
interface TransportHandler {
  readonly name: string;

  // Core operations
  get(location: string, params?: TransportParams): Promise<TransportResult>;
  set(location: string, content: Buffer, params?: TransportParams): Promise<void>;
  exists(location: string): Promise<boolean>;
  delete(location: string): Promise<void>;

  // Extended operations (optional)
  list?(location: string, options?: ListOptions): Promise<string[]>;
  mkdir?(location: string): Promise<void>;
}
```

**Core operations:**

| Operation | Description                      |
| --------- | -------------------------------- |
| `get`     | Retrieve raw bytes from location |
| `set`     | Store raw bytes at location      |
| `exists`  | Check if resource exists         |
| `delete`  | Remove resource from location    |

**Extended operations (transport-dependent):**

| Operation | Description             |
| --------- | ----------------------- |
| `list`    | List directory contents |
| `mkdir`   | Create directory        |

## TransportResult

The `get` operation returns a `TransportResult`:

```typescript
interface TransportResult {
  content: Buffer;
  metadata?: {
    type?: "file" | "directory";
    size?: number;
    modifiedAt?: Date;
    [key: string]: unknown; // Transport-specific metadata
  };
}
```

**Example:**

```typescript
const result = await transport.get("./data/config.json");

console.log(result.content); // <Buffer ...>
console.log(result.metadata?.type); // "file"
console.log(result.metadata?.size); // 1234
console.log(result.metadata?.modifiedAt); // Date object
```

## Built-in Transports

ARP provides four built-in transports:

### file

Local filesystem access. Supports read, write, and directory operations.

**Location format:** File path (relative or absolute)

```typescript
// Relative path
"arp:text:file://./config/settings.json";

// Absolute path
"arp:text:file:///home/user/data/file.txt";
```

**Capabilities:**

- Read files and directories
- Write files (creates parent directories automatically)
- Delete files and directories (recursive)
- List directory contents
- Create directories

**Parameters:**

- `recursive`: `"true"` - List directories recursively (for directory get)
- `pattern`: Glob pattern - Filter files by pattern (e.g., `"*.json"`)

```typescript
// Read file
const fileArl = arp.parse("arp:text:file://./hello.txt");
const resource = await fileArl.resolve();

// Read directory listing
const dirArl = arp.parse("arp:text:file://./src");
const dirResource = await dirArl.resolve();
console.log(dirResource.content); // JSON array: '["index.ts","utils.ts"]'

// Read directory with options
const filteredResource = await dirArl.resolve({
  recursive: "true",
  pattern: "*.ts",
});

// Write file (creates parent directories)
await fileArl.deposit("Hello, World!");

// Delete
await fileArl.delete();

// List and mkdir
const files = await dirArl.list({ recursive: true });
await arp.parse("arp:binary:file://./new-dir").mkdir();
```

### http / https

HTTP network access. Read-only transport.

**Location format:** `hostname/path[?query]`

```typescript
"arp:text:https://api.example.com/users";
"arp:text:http://localhost:3000/status";
"arp:text:https://api.example.com/search?q=test&limit=10";
```

**Capabilities:**

- Read remote resources (GET request)
- Check existence (HEAD request)

**Not supported:**

- Write (`set`) - throws "read-only" error
- Delete - throws "read-only" error
- List / mkdir - not applicable

**Parameters:**

- Any key-value pairs are added as query parameters
- Runtime params override URL query params on conflict

```typescript
// Basic GET request
const arl = arp.parse("arp:text:https://api.example.com/users");
const resource = await arl.resolve();

// With query parameters from URL
const urlArl = arp.parse("arp:text:https://api.example.com/search?q=test");
await urlArl.resolve(); // GET /search?q=test

// Add runtime parameters
await urlArl.resolve({ limit: "10" }); // GET /search?q=test&limit=10

// Override URL parameters
await urlArl.resolve({ q: "override" }); // GET /search?q=override

// Check if resource exists (HEAD request)
const exists = await arl.exists();

// Attempting write throws error
await arl.deposit("content"); // TransportError: HTTP transport is read-only
```

**Metadata from HTTP headers:**

```typescript
const resource = await httpArl.resolve();
console.log(resource.meta.size); // From Content-Length header
console.log(resource.meta.modifiedAt); // From Last-Modified header
console.log(resource.meta.contentType); // From Content-Type header
```

### rxr

Access files inside ResourceX resources. Read-only transport.

**Location format:** `{domain}/{path}/{name}.{type}@{version}/{internal-path}`

```typescript
// Single-file resource
"arp:text:rxr://localhost/hello.text@1.0.0/content";

// Multi-file resource
"arp:text:rxr://deepractice.ai/nuwa.role@1.0.0/thought/first-principles.md";
"arp:binary:rxr://localhost/assets.binary@1.0.0/images/logo.png";
```

**Capabilities:**

- Read files from inside resources
- Check file existence within resources

**Not supported:**

- Write (`set`) - throws "read-only" error
- Delete - throws "read-only" error
- List / mkdir - not applicable

**Registry selection:**

- `localhost` domain: Uses LocalRegistry (filesystem)
- Other domains: Uses well-known discovery to find remote registry

```typescript
// Access file in local resource
const localArl = arp.parse("arp:text:rxr://localhost/hello.text@1.0.0/content");
const resource = await localArl.resolve();

// Access file in remote resource (auto-discovers registry)
const remoteArl = arp.parse("arp:text:rxr://deepractice.ai/nuwa.role@1.0.0/config.json");
const remoteResource = await remoteArl.resolve();

// Check existence
const exists = await localArl.exists();

// Write throws error
await localArl.deposit("new content"); // TransportError: RXR transport is read-only
```

**Note:** The `rxr` transport is only available in the `resourcexjs/arp` package, not the base `@resourcexjs/arp` package.

```typescript
// Base package - no rxr transport
import { createARP } from "@resourcexjs/arp";
const arp = createARP(); // file, http, https only

// Enhanced package - includes rxr transport
import { createARP } from "resourcexjs/arp";
const arp = createARP(); // file, http, https, rxr
```

## Custom Transports

You can create custom transports by implementing the `TransportHandler` interface:

```typescript
import type { TransportHandler, TransportResult, TransportParams } from "@resourcexjs/arp";

class S3TransportHandler implements TransportHandler {
  readonly name = "s3";

  async get(location: string, params?: TransportParams): Promise<TransportResult> {
    // Parse location: bucket/key
    const [bucket, ...keyParts] = location.split("/");
    const key = keyParts.join("/");

    // Fetch from S3
    const response = await s3Client.getObject({ Bucket: bucket, Key: key });
    const content = Buffer.from(await response.Body!.transformToByteArray());

    return {
      content,
      metadata: {
        type: "file",
        size: response.ContentLength,
        modifiedAt: response.LastModified,
        contentType: response.ContentType,
      },
    };
  }

  async set(location: string, content: Buffer, params?: TransportParams): Promise<void> {
    const [bucket, ...keyParts] = location.split("/");
    const key = keyParts.join("/");

    await s3Client.putObject({
      Bucket: bucket,
      Key: key,
      Body: content,
    });
  }

  async exists(location: string): Promise<boolean> {
    const [bucket, ...keyParts] = location.split("/");
    const key = keyParts.join("/");

    try {
      await s3Client.headObject({ Bucket: bucket, Key: key });
      return true;
    } catch {
      return false;
    }
  }

  async delete(location: string): Promise<void> {
    const [bucket, ...keyParts] = location.split("/");
    const key = keyParts.join("/");

    await s3Client.deleteObject({ Bucket: bucket, Key: key });
  }
}

const s3Transport = new S3TransportHandler();
```

### Registering Custom Transports

**At creation time:**

```typescript
const arp = createARP({
  transports: [s3Transport],
});

// Now you can use s3 transport
const arl = arp.parse("arp:binary:s3://my-bucket/path/to/file.dat");
```

**After creation:**

```typescript
const arp = createARP();
arp.registerTransport(s3Transport);

const arl = arp.parse("arp:binary:s3://my-bucket/path/to/file.dat");
```

### Transport Override

When registering a transport with an existing name, the new handler replaces the old one:

```typescript
const customFileTransport = new CustomFileHandler();
customFileTransport.name = "file"; // Same name as built-in

const arp = createARP({
  transports: [customFileTransport],
});

// Uses custom file handler, not built-in
arp.parse("arp:text:file://./data.txt");
```

## Error Handling

Transports throw `TransportError` for operation failures:

```typescript
import { TransportError } from "@resourcexjs/arp";

try {
  const arl = arp.parse("arp:text:file://./non-existent.txt");
  await arl.resolve();
} catch (error) {
  if (error instanceof TransportError) {
    console.error("Transport:", error.transport); // "file"
    console.error("Message:", error.message); // "File get error: ENOENT - ..."
    console.error("Cause:", error.cause); // Original error
  }
}
```

**Common transport errors:**

| Transport | Error Condition      | Message                                          |
| --------- | -------------------- | ------------------------------------------------ |
| file      | File not found       | `File get error: ENOENT - /path/to/file`         |
| file      | Permission denied    | `File get error: EACCES - /path/to/file`         |
| http      | HTTP error           | `HTTP 404: Not Found - https://...`              |
| http      | Network error        | `Network error: https://...`                     |
| http      | Write attempt        | `HTTP transport is read-only, set not supported` |
| rxr       | File not in resource | `File not found in resource: path/to/file`       |
| rxr       | Write attempt        | `RXR transport is read-only`                     |

## Transport Comparison

| Feature     | file               | http/https   | rxr  |
| ----------- | ------------------ | ------------ | ---- |
| Read (get)  | Yes                | Yes          | Yes  |
| Write (set) | Yes                | No           | No   |
| Exists      | Yes                | Yes (HEAD)   | Yes  |
| Delete      | Yes                | No           | No   |
| List        | Yes                | No           | No   |
| Mkdir       | Yes                | No           | No   |
| Params      | recursive, pattern | Query params | None |

## Next Steps

- [Semantic Layer](./semantic.md) - How data is interpreted
- [ARL - Agent Resource Locator](./arl.md) - Working with parsed URLs
- [ARP Protocol Overview](./protocol.md) - High-level architecture
