# @resourcexjs/arp API Reference

The ARP (Agent Resource Protocol) package provides low-level I/O primitives for resource access with the URL format: `arp:{semantic}:{transport}://{location}`

## Installation

```bash
bun add @resourcexjs/arp
```

## createARP

Factory function to create an ARP instance.

```typescript
function createARP(config?: ARPConfig): ARP;
```

**Parameters:**

| Name     | Type                     | Description            |
| -------- | ------------------------ | ---------------------- |
| `config` | `ARPConfig \| undefined` | Optional configuration |

**Returns:** `ARP` - ARP instance with default transports and semantics

**Example:**

```typescript
import { createARP } from "@resourcexjs/arp";

// Create with defaults (file, http, https transports; text, binary semantics)
const arp = createARP();

// Create with custom handlers
const custom = createARP({
  transports: [myCustomTransport],
  semantics: [myCustomSemantic],
});
```

---

## ARPConfig

Configuration for ARP instance.

```typescript
interface ARPConfig {
  transports?: TransportHandler[];
  semantics?: SemanticHandler[];
}
```

**Properties:**

| Property     | Type                              | Description               |
| ------------ | --------------------------------- | ------------------------- |
| `transports` | `TransportHandler[] \| undefined` | Custom transport handlers |
| `semantics`  | `SemanticHandler[] \| undefined`  | Custom semantic handlers  |

---

## ARP Class

Main class for parsing ARP URLs and managing handlers.

```typescript
class ARP {
  constructor(config?: ARPConfig);
  parse(url: string): ARL;
  registerTransport(handler: TransportHandler): void;
  registerSemantic(handler: SemanticHandler): void;
  getTransportHandler(name: string): TransportHandler;
  getSemanticHandler(name: string): SemanticHandler;
}
```

### parse

Parse an ARP URL into an ARL (Agent Resource Locator) object.

```typescript
parse(url: string): ARL
```

**Parameters:**

| Name  | Type     | Description    |
| ----- | -------- | -------------- |
| `url` | `string` | ARP URL string |

**Returns:** `ARL` - Parsed locator with operations

**Throws:** `ParseError` if URL format is invalid

**Example:**

```typescript
const arp = createARP();

// Parse file URL
const fileArl = arp.parse("arp:text:file:///path/to/file.txt");
console.log(fileArl.semantic); // "text"
console.log(fileArl.transport); // "file"
console.log(fileArl.location); // "/path/to/file.txt"

// Parse HTTP URL
const httpArl = arp.parse("arp:binary:https://example.com/data.bin");
console.log(httpArl.transport); // "https"
console.log(httpArl.location); // "example.com/data.bin"
```

### registerTransport

Register a custom transport handler.

```typescript
registerTransport(handler: TransportHandler): void
```

**Parameters:**

| Name      | Type               | Description                   |
| --------- | ------------------ | ----------------------------- |
| `handler` | `TransportHandler` | Transport handler to register |

**Example:**

```typescript
const arp = createARP();

arp.registerTransport({
  name: "s3",
  async get(location, params) {
    // Implement S3 fetch
    return { content: Buffer.from("...") };
  },
  async set(location, content, params) {
    // Implement S3 upload
  },
  async exists(location) {
    return true;
  },
  async delete(location) {
    // Implement S3 delete
  },
});

// Now can use: arp.parse("arp:binary:s3://bucket/key")
```

### registerSemantic

Register a custom semantic handler.

```typescript
registerSemantic(handler: SemanticHandler): void
```

**Parameters:**

| Name      | Type              | Description                  |
| --------- | ----------------- | ---------------------------- |
| `handler` | `SemanticHandler` | Semantic handler to register |

### getTransportHandler

Get a transport handler by name.

```typescript
getTransportHandler(name: string): TransportHandler
```

**Throws:** `TransportError` if handler not found

### getSemanticHandler

Get a semantic handler by name.

```typescript
getSemanticHandler(name: string): SemanticHandler
```

**Throws:** `SemanticError` if handler not found

---

## ARI Interface

Agent Resource Identifier - identifies resource type without location.

```typescript
interface ARI {
  readonly semantic: string;
  readonly transport: string;
}
```

**Properties:**

| Property    | Type     | Description                            |
| ----------- | -------- | -------------------------------------- |
| `semantic`  | `string` | Semantic type (e.g., "text", "binary") |
| `transport` | `string` | Transport type (e.g., "file", "https") |

---

## ARL Interface

Agent Resource Locator - full resource locator with operations.

```typescript
interface ARL extends ARI {
  readonly location: string;
  resolve(params?: TransportParams): Promise<Resource>;
  deposit(data: unknown, params?: TransportParams): Promise<void>;
  exists(): Promise<boolean>;
  delete(): Promise<void>;
  list(options?: ListOptions): Promise<string[]>;
  mkdir(): Promise<void>;
  toString(): string;
}
```

### resolve

Resolve and fetch the resource.

```typescript
resolve(params?: TransportParams): Promise<Resource>
```

**Parameters:**

| Name     | Type                           | Description        |
| -------- | ------------------------------ | ------------------ |
| `params` | `TransportParams \| undefined` | Runtime parameters |

**Returns:** `Promise<Resource>` - Resolved resource with content and metadata

**Example:**

```typescript
const arl = arp.parse("arp:text:file:///path/to/file.txt");
const resource = await arl.resolve();

console.log(resource.type); // "text"
console.log(resource.content); // "file contents as string"
console.log(resource.meta.size); // file size in bytes
```

### deposit

Write data to the resource location.

```typescript
deposit(data: unknown, params?: TransportParams): Promise<void>
```

**Parameters:**

| Name     | Type                           | Description        |
| -------- | ------------------------------ | ------------------ |
| `data`   | `unknown`                      | Data to write      |
| `params` | `TransportParams \| undefined` | Runtime parameters |

**Throws:** `SemanticError` if semantic does not support deposit

**Example:**

```typescript
const arl = arp.parse("arp:text:file:///path/to/output.txt");
await arl.deposit("Hello, World!");

const binaryArl = arp.parse("arp:binary:file:///path/to/data.bin");
await binaryArl.deposit(Buffer.from([0x00, 0x01, 0x02]));
```

### exists

Check if the resource exists.

```typescript
exists(): Promise<boolean>
```

**Returns:** `Promise<boolean>` - True if resource exists

**Example:**

```typescript
const arl = arp.parse("arp:text:file:///path/to/file.txt");
if (await arl.exists()) {
  console.log("File exists!");
}
```

### delete

Delete the resource.

```typescript
delete(): Promise<void>
```

**Throws:** `TransportError` if transport is read-only

**Example:**

```typescript
const arl = arp.parse("arp:binary:file:///path/to/file.txt");
await arl.delete();
```

### list

List directory contents (transport-specific).

```typescript
list(options?: ListOptions): Promise<string[]>
```

**Parameters:**

| Name      | Type                       | Description  |
| --------- | -------------------------- | ------------ |
| `options` | `ListOptions \| undefined` | List options |

**Returns:** `Promise<string[]>` - Array of file/directory paths

**Throws:** `TransportError` if transport does not support list

**Example:**

```typescript
const arl = arp.parse("arp:binary:file:///path/to/dir");

// List all files
const files = await arl.list();

// List recursively with pattern
const jsonFiles = await arl.list({
  recursive: true,
  pattern: "*.json",
});
```

### mkdir

Create a directory (transport-specific).

```typescript
mkdir(): Promise<void>
```

**Throws:** `TransportError` if transport does not support mkdir

**Example:**

```typescript
const arl = arp.parse("arp:binary:file:///path/to/new/dir");
await arl.mkdir();
```

### toString

Convert to ARP URL string.

```typescript
toString(): string
```

**Returns:** `string` - Full ARP URL

**Example:**

```typescript
const arl = arp.parse("arp:text:file:///path/to/file.txt");
console.log(arl.toString()); // "arp:text:file:///path/to/file.txt"
```

---

## TransportHandler Interface

Interface for implementing custom transports.

```typescript
interface TransportHandler {
  readonly name: string;
  get(location: string, params?: TransportParams): Promise<TransportResult>;
  set(location: string, content: Buffer, params?: TransportParams): Promise<void>;
  exists(location: string): Promise<boolean>;
  delete(location: string): Promise<void>;
  list?(location: string, options?: ListOptions): Promise<string[]>;
  mkdir?(location: string): Promise<void>;
}
```

**Properties:**

| Property | Type     | Description          |
| -------- | -------- | -------------------- |
| `name`   | `string` | Transport identifier |

**Methods:**

| Method   | Description                        |
| -------- | ---------------------------------- |
| `get`    | Retrieve content from location     |
| `set`    | Store content at location          |
| `exists` | Check if location exists           |
| `delete` | Remove resource at location        |
| `list`   | List directory contents (optional) |
| `mkdir`  | Create directory (optional)        |

---

## TransportResult

Result from transport get operation.

```typescript
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

**Properties:**

| Property              | Type                    | Description            |
| --------------------- | ----------------------- | ---------------------- |
| `content`             | `Buffer`                | Raw content bytes      |
| `metadata`            | `object \| undefined`   | Optional metadata      |
| `metadata.type`       | `"file" \| "directory"` | Resource type          |
| `metadata.size`       | `number`                | Size in bytes          |
| `metadata.modifiedAt` | `Date`                  | Last modification time |

---

## TransportParams

Runtime parameters passed to transport operations.

```typescript
type TransportParams = Record<string, string>;
```

---

## ListOptions

Options for the list operation.

```typescript
interface ListOptions {
  recursive?: boolean;
  pattern?: string;
}
```

**Properties:**

| Property    | Type                   | Description                    |
| ----------- | ---------------------- | ------------------------------ |
| `recursive` | `boolean \| undefined` | Whether to list recursively    |
| `pattern`   | `string \| undefined`  | Glob pattern to filter results |

---

## SemanticHandler Interface

Interface for implementing custom semantics.

```typescript
interface SemanticHandler<T = unknown> {
  readonly name: string;
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
  exists?(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<boolean>;
  delete?(transport: TransportHandler, location: string, context: SemanticContext): Promise<void>;
}
```

**Properties:**

| Property | Type     | Description         |
| -------- | -------- | ------------------- |
| `name`   | `string` | Semantic identifier |

**Methods:**

| Method    | Description                                         |
| --------- | --------------------------------------------------- |
| `resolve` | Fetch and parse resource                            |
| `deposit` | Serialize and store data (optional)                 |
| `exists`  | Check existence (optional, falls back to transport) |
| `delete`  | Delete resource (optional, falls back to transport) |

---

## Resource Interface

Result from semantic resolve operation.

```typescript
interface Resource<T = unknown> {
  type: string;
  content: T;
  meta: ResourceMeta;
}
```

**Properties:**

| Property  | Type           | Description        |
| --------- | -------------- | ------------------ |
| `type`    | `string`       | Semantic type name |
| `content` | `T`            | Parsed content     |
| `meta`    | `ResourceMeta` | Resource metadata  |

---

## ResourceMeta Interface

Metadata about a resolved resource.

```typescript
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

---

## SemanticContext Interface

Context passed to semantic handlers.

```typescript
interface SemanticContext {
  url: string;
  semantic: string;
  transport: string;
  location: string;
  timestamp: Date;
  params?: TransportParams;
}
```

---

## Built-in Transports

### fileTransport

Local filesystem transport (read-write).

```typescript
const fileTransport: TransportHandler;
```

**Name:** `"file"`

**Features:**

- Returns file content or directory listing (JSON array)
- Supports `recursive` and `pattern` parameters for listing
- Full CRUD operations
- Creates parent directories automatically

**Example:**

```typescript
const arl = arp.parse("arp:text:file:///path/to/file.txt");
const resource = await arl.resolve();
```

### httpTransport / httpsTransport

HTTP/HTTPS transport (read-only).

```typescript
const httpTransport: TransportHandler;
const httpsTransport: TransportHandler;
```

**Name:** `"http"` / `"https"`

**Features:**

- Merges URL query params with runtime params
- Throws "not supported" error for set/delete/list/mkdir operations

**Example:**

```typescript
const arl = arp.parse("arp:binary:https://example.com/data.json");
const resource = await arl.resolve();
```

---

## Built-in Semantics

### textSemantic

UTF-8 text semantic.

```typescript
const textSemantic: SemanticHandler<string>;
```

**Name:** `"text"`

**Features:**

- Resolves to string content
- Deposits string data

**Example:**

```typescript
const arl = arp.parse("arp:text:file:///path/to/file.txt");
const resource = await arl.resolve();
console.log(resource.content); // string
```

### binarySemantic

Binary data semantic.

```typescript
const binarySemantic: SemanticHandler<Buffer>;
```

**Name:** `"binary"`

**Features:**

- Resolves to Buffer content
- Accepts Buffer, Uint8Array, ArrayBuffer, or number[] for deposit

**Example:**

```typescript
const arl = arp.parse("arp:binary:file:///path/to/data.bin");
const resource = await arl.resolve();
console.log(resource.content); // Buffer
```

---

## Errors

### ARPError

Base error class for all ARP errors.

```typescript
class ARPError extends Error {
  constructor(message: string, options?: ErrorOptions);
}
```

### ParseError

Thrown when ARP URL parsing fails.

```typescript
class ParseError extends ARPError {
  constructor(message: string, url?: string);
  readonly url?: string;
}
```

**Example:**

```typescript
import { createARP, ParseError } from "@resourcexjs/arp";

const arp = createARP();

try {
  arp.parse("invalid-url");
} catch (error) {
  if (error instanceof ParseError) {
    console.error("Parse failed:", error.message);
    console.error("URL:", error.url);
  }
}
```

### TransportError

Thrown when transport operations fail.

```typescript
class TransportError extends ARPError {
  constructor(message: string, transport?: string, options?: ErrorOptions);
  readonly transport?: string;
}
```

### SemanticError

Thrown when semantic operations fail.

```typescript
class SemanticError extends ARPError {
  constructor(message: string, semantic?: string, options?: ErrorOptions);
  readonly semantic?: string;
}
```

---

## Complete Example

```typescript
import {
  createARP,
  type ARP,
  type ARL,
  type Resource,
  ParseError,
  TransportError,
} from "@resourcexjs/arp";

async function main() {
  // Create ARP instance
  const arp: ARP = createARP();

  // Parse and resolve a text file
  const textArl: ARL = arp.parse("arp:text:file:///tmp/hello.txt");

  // Check if file exists
  if (!(await textArl.exists())) {
    // Create the file
    await textArl.deposit("Hello, ARP!");
  }

  // Resolve the file
  const resource: Resource<string> = await textArl.resolve();
  console.log("Type:", resource.type); // "text"
  console.log("Content:", resource.content); // "Hello, ARP!"
  console.log("Size:", resource.meta.size); // 11

  // List directory
  const dirArl = arp.parse("arp:binary:file:///tmp");
  const files = await dirArl.list({ pattern: "*.txt" });
  console.log("Text files:", files);

  // Clean up
  await textArl.delete();
}

main().catch(console.error);
```

---

## RxrTransport (Main Package)

The main `resourcexjs` package includes an enhanced ARP with RxrTransport for accessing files inside resources.

```typescript
import { createARP, RxrTransport } from "resourcexjs/arp";

// createARP() auto-registers RxrTransport
const arp = createARP(); // file, http, https, rxr

// Access files inside resources
const arl = arp.parse("arp:text:rxr://localhost/hello.text@1.0.0/content");
const resource = await arl.resolve();
console.log(resource.content); // Content from RXA archive

// Manual registry injection (for testing)
import { createRegistry } from "resourcexjs";

const registry = createRegistry();
const rxrTransport = new RxrTransport(registry);
const customArp = createARP({ transports: [rxrTransport] });
```

**RxrTransport Features:**

- Format: `arp:{semantic}:rxr://{rxl}/{internal-path}`
- Auto-creates Registry based on domain:
  - `localhost` - LocalRegistry (filesystem)
  - Other domains - RemoteRegistry (via well-known discovery)
- Read-only (set/delete throw "read-only" error)
- List: Supported (lists files in resource)

**Note:** RxrTransport is only available in the main `resourcexjs` package, not in `@resourcexjs/arp`.
