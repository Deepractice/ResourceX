# ARP Protocol Usage Guide

ARP (Agent Resource Protocol) is the low-level I/O layer of ResourceX. It provides a unified interface for accessing resources across different transports (file, http, rxr) with semantic interpretation (text, binary).

## Overview

ARP URLs follow this format:

```
arp:{semantic}:{transport}://{location}
```

For example:

- `arp:text:file:///path/to/file.txt` - Read a local file as text
- `arp:binary:https://example.com/data.bin` - Download binary from HTTPS
- `arp:text:rxr://localhost/my-prompt.text@1.0.0/content` - Read file from a ResourceX resource

**Key components:**

- **Semantic**: How to interpret the content (text, binary)
- **Transport**: How to access the content (file, http, https, rxr)
- **Location**: Where the content is located

## Creating an ARP Instance

### Basic ARP (from @resourcexjs/arp)

The base ARP package includes file, http, and https transports:

```typescript
import { createARP } from "@resourcexjs/arp";

const arp = createARP();

// Parse and use URLs
const arl = arp.parse("arp:text:file:///path/to/file.txt");
const resource = await arl.resolve();
console.log(resource.content); // File content as string
```

### Enhanced ARP (from resourcexjs)

The main package includes the RxrTransport for ResourceX integration:

```typescript
import { createARP } from "resourcexjs/arp";

const arp = createARP();

// All transports available: file, http, https, rxr
const arl = arp.parse("arp:text:rxr://localhost/hello.text@1.0.0/content");
const resource = await arl.resolve();
```

### Custom Configuration

```typescript
import { createARP, fileTransport, textSemantic } from "@resourcexjs/arp";

const arp = createARP({
  transports: [fileTransport], // Only file transport
  semantics: [textSemantic], // Only text semantic
});
```

## Core Operations

### Parsing ARP URLs

```typescript
const arl = arp.parse("arp:text:file:///path/to/file.txt");

console.log(arl.semantic); // "text"
console.log(arl.transport); // "file"
console.log(arl.location); // "/path/to/file.txt"
console.log(arl.toString()); // "arp:text:file:///path/to/file.txt"
```

### Resolving Resources

```typescript
const arl = arp.parse("arp:text:file://./data/message.txt");
const resource = await arl.resolve();

console.log(resource.type); // "text"
console.log(resource.content); // String content
console.log(resource.meta); // { semantic: "text", transport: "file", ... }
```

### Depositing (Writing) Resources

```typescript
const arl = arp.parse("arp:text:file://./output/result.txt");

await arl.deposit("Hello, World!");
// File created at ./output/result.txt
```

### Checking Existence

```typescript
const arl = arp.parse("arp:text:file://./data/config.json");

const exists = await arl.exists();
if (exists) {
  const resource = await arl.resolve();
}
```

### Deleting Resources

```typescript
const arl = arp.parse("arp:binary:file://./temp/cache.bin");

await arl.delete();
// File deleted (or ignored if doesn't exist)
```

### Listing Directories

```typescript
const arl = arp.parse("arp:text:file://./data");

// List files in directory
const files = await arl.list();
// ["file1.txt", "file2.json", "subdir"]

// Recursive listing
const allFiles = await arl.list({ recursive: true });
// ["file1.txt", "file2.json", "subdir/nested.txt"]

// Filter by pattern
const jsonFiles = await arl.list({ pattern: "*.json" });
// ["file2.json"]
```

### Creating Directories

```typescript
const arl = arp.parse("arp:binary:file://./new/nested/directory");

await arl.mkdir();
// Directory created recursively
```

## Built-in Transports

### File Transport

Read-write access to local filesystem.

```typescript
// Read file
const arl = arp.parse("arp:text:file://./config.json");
const resource = await arl.resolve();

// Write file (creates parent directories)
await arp.parse("arp:text:file://./output/result.txt").deposit("Result");

// Delete file or directory
await arp.parse("arp:binary:file://./temp").delete();

// List directory
const files = await arp.parse("arp:text:file://./src").list({
  recursive: true,
  pattern: "*.ts",
});
```

**Special behaviors:**

- Resolving a directory returns JSON array of filenames
- `set` automatically creates parent directories
- `delete` is recursive for directories
- Supports `recursive` and `pattern` parameters

### HTTP/HTTPS Transport

Read-only access to web resources.

```typescript
// Download text
const arl = arp.parse("arp:text:https://api.example.com/data");
const resource = await arl.resolve();

// With query parameters (merged with URL params)
const resource = await arl.resolve({ page: "1", limit: "10" });
```

**Characteristics:**

- Read-only (`deposit` and `delete` throw errors)
- `exists` uses HEAD request
- Runtime params merged with URL query params
- Returns metadata from response headers (content-type, size, etc.)

### RXR Transport

Access files inside ResourceX resources (resourcexjs package only).

```typescript
import { createARP } from "resourcexjs/arp";

const arp = createARP();

// Access single file in resource
const arl = arp.parse("arp:text:rxr://localhost/my-prompt.text@1.0.0/content");
const resource = await arl.resolve();

// Access nested file in multi-file resource
const arl2 = arp.parse("arp:text:rxr://deepractice.ai/project.text@1.0.0/src/index.ts");
const sourceFile = await arl2.resolve();
```

**Location format:**

```
{domain}/{path}/{name}.{type}@{version}/{internal-path}
```

Examples:

- `localhost/hello.text@1.0.0/content`
- `deepractice.ai/nuwa.role@1.0.0/thought/first-principles.md`

**Automatic registry selection:**

- `localhost` domain uses LocalRegistry
- Other domains use well-known discovery to find registry

**Read-only:** `deposit` and `delete` operations throw errors.

## Built-in Semantics

### Text Semantic

Interprets content as UTF-8 text.

```typescript
const arl = arp.parse("arp:text:file://./message.txt");
const resource = await arl.resolve();

console.log(typeof resource.content); // "string"
console.log(resource.meta.encoding); // "utf-8"
```

### Binary Semantic

Returns raw bytes as Buffer.

```typescript
const arl = arp.parse("arp:binary:file://./image.png");
const resource = await arl.resolve();

console.log(resource.content); // Buffer
console.log(resource.content.length); // Byte length
```

**Accepts multiple input types for deposit:**

- `Buffer`
- `Uint8Array`
- `ArrayBuffer`
- `number[]` (byte array)

## Custom Transports

Create custom transports for specialized protocols.

### Transport Interface

```typescript
interface TransportHandler {
  readonly name: string;

  // Core operations
  get(location: string, params?: TransportParams): Promise<TransportResult>;
  set(location: string, content: Buffer, params?: TransportParams): Promise<void>;
  exists(location: string): Promise<boolean>;
  delete(location: string): Promise<void>;

  // Optional operations
  list?(location: string, options?: ListOptions): Promise<string[]>;
  mkdir?(location: string): Promise<void>;
}

interface TransportResult {
  content: Buffer;
  metadata?: {
    type?: "file" | "directory";
    size?: number;
    modifiedAt?: Date;
    [key: string]: unknown;
  };
}
```

### Example: S3 Transport

```typescript
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

class S3TransportHandler implements TransportHandler {
  readonly name = "s3";
  private client: S3Client;

  constructor() {
    this.client = new S3Client({ region: "us-east-1" });
  }

  async get(location: string): Promise<TransportResult> {
    const [bucket, ...keyParts] = location.split("/");
    const key = keyParts.join("/");

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await this.client.send(command);

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

  async set(location: string, content: Buffer): Promise<void> {
    const [bucket, ...keyParts] = location.split("/");
    const key = keyParts.join("/");

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
    });

    await this.client.send(command);
  }

  async exists(location: string): Promise<boolean> {
    try {
      await this.get(location);
      return true;
    } catch {
      return false;
    }
  }

  async delete(location: string): Promise<void> {
    // Implementation...
  }
}

// Register the transport
const arp = createARP();
arp.registerTransport(new S3TransportHandler());

// Use it
const arl = arp.parse("arp:binary:s3://my-bucket/path/to/file.bin");
const resource = await arl.resolve();
```

### Registering Custom Transports

```typescript
const arp = createARP();

// Register at runtime
arp.registerTransport(new S3TransportHandler());
arp.registerTransport(new FTPTransportHandler());

// Or provide at creation
const arp2 = createARP({
  transports: [new S3TransportHandler(), new FTPTransportHandler()],
});
```

## Custom Semantics

Create custom semantics for specialized content interpretation.

### Semantic Interface

```typescript
interface SemanticHandler {
  readonly name: string;

  resolve(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<Resource>;

  deposit?(
    transport: TransportHandler,
    location: string,
    data: unknown,
    context: SemanticContext
  ): Promise<void>;

  exists?(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<boolean>;

  delete?(transport: TransportHandler, location: string, context: SemanticContext): Promise<void>;
}
```

### Example: JSON Semantic

```typescript
class JsonSemanticHandler implements SemanticHandler {
  readonly name = "json";

  async resolve(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<Resource> {
    const result = await transport.get(location, context.params);
    const content = JSON.parse(result.content.toString("utf-8"));

    return {
      type: "json",
      content,
      meta: {
        semantic: this.name,
        transport: context.transport,
        encoding: "utf-8",
        timestamp: context.timestamp,
      },
    };
  }

  async deposit(
    transport: TransportHandler,
    location: string,
    data: unknown,
    context: SemanticContext
  ): Promise<void> {
    const content = Buffer.from(JSON.stringify(data, null, 2), "utf-8");
    await transport.set(location, content, context.params);
  }
}

// Register the semantic
const arp = createARP();
arp.registerSemantic(new JsonSemanticHandler());

// Use it
const arl = arp.parse("arp:json:file://./config.json");
const resource = await arl.resolve();
console.log(resource.content.key); // Parsed JSON object
```

## Error Handling

### Parse Errors

```typescript
import { ParseError } from "@resourcexjs/arp";

try {
  arp.parse("invalid-url");
} catch (error) {
  if (error instanceof ParseError) {
    console.log(error.message); // "Invalid ARP URL: must start with 'arp:'"
    console.log(error.url); // "invalid-url"
  }
}
```

### Transport Errors

```typescript
import { TransportError } from "@resourcexjs/arp";

try {
  arp.parse("arp:text:ftp://example.com/file.txt");
} catch (error) {
  if (error instanceof TransportError) {
    console.log(error.message); // "Unsupported transport type: ftp"
    console.log(error.transport); // "ftp"
  }
}
```

### Semantic Errors

```typescript
import { SemanticError } from "@resourcexjs/arp";

try {
  arp.parse("arp:xml:file://./data.xml");
} catch (error) {
  if (error instanceof SemanticError) {
    console.log(error.message); // "Unsupported semantic type: xml"
    console.log(error.semantic); // "xml"
  }
}
```

### Read-Only Transport Errors

```typescript
try {
  const arl = arp.parse("arp:text:https://example.com/data");
  await arl.deposit("new content");
} catch (error) {
  console.log(error.message); // "HTTP transport is read-only, set not supported"
}
```

## Using RxrTransport with Custom Registry

For testing or custom scenarios, inject a specific registry:

```typescript
import { createARP, RxrTransport } from "resourcexjs/arp";
import { createRegistry } from "@resourcexjs/registry";

// Create custom registry
const registry = createRegistry({ path: "./test-resources" });

// Create RxrTransport with custom registry
const rxrTransport = new RxrTransport(registry);

// Create ARP with custom transport
const arp = createARP({
  transports: [rxrTransport],
});

// Now uses the custom registry
const arl = arp.parse("arp:text:rxr://localhost/test.text@1.0.0/content");
```

## Complete Examples

### Reading and Processing Files

```typescript
import { createARP } from "@resourcexjs/arp";

async function processFiles() {
  const arp = createARP();

  // List all TypeScript files
  const srcArl = arp.parse("arp:text:file://./src");
  const files = await srcArl.list({ recursive: true, pattern: "*.ts" });

  // Process each file
  for (const file of files) {
    const fileArl = arp.parse(`arp:text:file://./src/${file}`);
    const resource = await fileArl.resolve();

    console.log(`Processing ${file}:`);
    console.log(`  Lines: ${resource.content.split("\n").length}`);
  }
}
```

### Download and Cache Remote Resources

```typescript
import { createARP } from "@resourcexjs/arp";

async function downloadAndCache(url: string, cachePath: string) {
  const arp = createARP();

  // Check if cached
  const cacheArl = arp.parse(`arp:binary:file://${cachePath}`);
  if (await cacheArl.exists()) {
    console.log("Using cached version");
    return cacheArl.resolve();
  }

  // Download
  console.log("Downloading...");
  const remoteArl = arp.parse(`arp:binary:${url}`);
  const resource = await remoteArl.resolve();

  // Cache
  await cacheArl.deposit(resource.content);
  console.log("Cached");

  return resource;
}

// Usage
const resource = await downloadAndCache("https://example.com/data.bin", "./cache/data.bin");
```

### Accessing ResourceX Resource Files

```typescript
import { createARP } from "resourcexjs/arp";
import { createRegistry, createRXM, createRXA, parseRXL } from "resourcexjs";

async function accessResourceFiles() {
  // First, create and link a multi-file resource
  const registry = createRegistry();

  const manifest = createRXM({
    domain: "localhost",
    name: "docs",
    type: "text",
    version: "1.0.0",
  });

  const content = await createRXA({
    "getting-started.md": "# Getting Started\n...",
    "advanced/configuration.md": "# Configuration\n...",
    "advanced/plugins.md": "# Plugins\n...",
  });

  await registry.add({
    locator: parseRXL(manifest.toLocator()),
    manifest,
    content,
  });

  // Now access files via ARP
  const arp = createARP();

  // Access specific file
  const arl = arp.parse("arp:text:rxr://localhost/docs.text@1.0.0/getting-started.md");
  const resource = await arl.resolve();
  console.log(resource.content);

  // Check if file exists
  const advancedArl = arp.parse("arp:text:rxr://localhost/docs.text@1.0.0/advanced/plugins.md");
  const exists = await advancedArl.exists();
  console.log(`Plugins doc exists: ${exists}`);
}
```

### Round-Trip: Deposit and Resolve

```typescript
import { createARP } from "@resourcexjs/arp";

async function roundTrip() {
  const arp = createARP();
  const arl = arp.parse("arp:text:file://./test/roundtrip.txt");

  // Write
  const originalContent = "Hello, ARP! 你好 世界";
  await arl.deposit(originalContent);

  // Read back
  const resource = await arl.resolve();

  // Verify
  console.log(resource.content === originalContent); // true

  // Cleanup
  await arl.delete();
}
```
