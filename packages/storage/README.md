# @resourcexjs/storage

Low-level key-value storage backends for ResourceX.

## Installation

```bash
bun add @resourcexjs/storage
```

## Overview

This package provides a pure key-value storage abstraction layer. It deals only with raw bytes (`Buffer`), leaving higher-level object handling to the Registry layer.

## Storage Interface

All storage implementations conform to this interface:

```typescript
interface Storage {
  get(key: string): Promise<Buffer>;
  put(key: string, data: Buffer): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
}
```

## Implementations

### FileSystemStorage

Local filesystem storage. Keys are treated as relative paths within a base directory.

```typescript
import { FileSystemStorage } from "@resourcexjs/storage";

const storage = new FileSystemStorage("/path/to/storage");

// Store data
await storage.put("resources/hello/manifest.json", Buffer.from('{"name":"hello"}'));

// Retrieve data
const data = await storage.get("resources/hello/manifest.json");

// Check existence
const exists = await storage.exists("resources/hello/manifest.json");

// List keys with prefix
const keys = await storage.list("resources/hello");
// → ["resources/hello/manifest.json", "resources/hello/archive.tar.gz"]

// Delete (supports recursive directory deletion)
await storage.delete("resources/hello");
```

Features:

- Automatic parent directory creation on `put()`
- Recursive directory deletion on `delete()`
- Recursive file listing with `list()`

### MemoryStorage

In-memory storage for testing and ephemeral use cases.

```typescript
import { MemoryStorage } from "@resourcexjs/storage";

const storage = new MemoryStorage();

await storage.put("key", Buffer.from("value"));
const data = await storage.get("key");

// Test utilities
storage.size(); // Get number of stored keys
storage.clear(); // Clear all data
```

## Error Handling

All storage errors throw `StorageError` with a specific error code:

```typescript
import { StorageError } from "@resourcexjs/storage";

try {
  await storage.get("nonexistent");
} catch (error) {
  if (error instanceof StorageError) {
    console.log(error.code); // "NOT_FOUND" | "READ_ERROR" | "WRITE_ERROR" | "DELETE_ERROR"
    console.log(error.message);
  }
}
```

## API Reference

### `FileSystemStorage`

```typescript
constructor(basePath: string)
```

Creates a storage instance backed by the local filesystem.

| Method           | Description                                                                      |
| ---------------- | -------------------------------------------------------------------------------- |
| `get(key)`       | Read file contents. Throws `StorageError` with code `NOT_FOUND` or `READ_ERROR`. |
| `put(key, data)` | Write data. Creates parent directories automatically.                            |
| `delete(key)`    | Delete file or directory recursively.                                            |
| `exists(key)`    | Check if file exists.                                                            |
| `list(prefix?)`  | List all files under prefix recursively.                                         |

### `MemoryStorage`

```typescript
constructor();
```

Creates an in-memory storage instance.

| Method           | Description                                                    |
| ---------------- | -------------------------------------------------------------- |
| `get(key)`       | Get stored value. Throws `StorageError` with code `NOT_FOUND`. |
| `put(key, data)` | Store value.                                                   |
| `delete(key)`    | Delete key and all keys with matching prefix.                  |
| `exists(key)`    | Check if key exists.                                           |
| `list(prefix?)`  | List all keys matching prefix.                                 |
| `clear()`        | Clear all stored data.                                         |
| `size()`         | Get number of stored keys.                                     |

### `StorageError`

```typescript
class StorageError extends Error {
  code: "NOT_FOUND" | "WRITE_ERROR" | "READ_ERROR" | "DELETE_ERROR";
}
```

## Planned Implementations

- `S3Storage` - AWS S3
- `R2Storage` - Cloudflare R2

## License

Apache-2.0
