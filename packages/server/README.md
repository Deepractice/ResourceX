# @resourcexjs/server

ResourceX Registry Server - HTTP API server for hosting and serving ResourceX resources.

## Installation

```bash
bun add @resourcexjs/server @resourcexjs/node-provider
# or
npm install @resourcexjs/server @resourcexjs/node-provider
```

## Overview

This package provides three levels of abstraction for building a ResourceX registry server:

1. **Hono Server** - Ready-to-use server with all endpoints configured
2. **Handlers** - Framework-agnostic request handlers for custom integrations
3. **Protocol** - Type definitions and constants for building clients

## Quick Start

```typescript
import { createRegistryServer } from "@resourcexjs/server";
import { FileSystemRXAStore, FileSystemRXMStore } from "@resourcexjs/node-provider";

const server = createRegistryServer({
  rxaStore: new FileSystemRXAStore("./data/blobs"),
  rxmStore: new FileSystemRXMStore("./data/manifests"),
});

// Bun
Bun.serve({ fetch: server.fetch, port: 3000 });

// Node.js (with @hono/node-server)
import { serve } from "@hono/node-server";
serve({ fetch: server.fetch, port: 3000 });
```

## API

### `createRegistryServer(config)`

Creates a Hono app with all registry endpoints configured.

```typescript
import { createRegistryServer } from "@resourcexjs/server";
import { FileSystemRXAStore, FileSystemRXMStore } from "@resourcexjs/node-provider";

const server = createRegistryServer({
  rxaStore: new FileSystemRXAStore("./data/blobs"),
  rxmStore: new FileSystemRXMStore("./data/manifests"),
  basePath: "", // Optional: API route prefix (default: "")
  cors: true, // Optional: Enable CORS (default: true)
});
```

#### Config Interface

```typescript
interface RegistryServerConfig {
  rxaStore: RXAStore; // Content-addressable blob storage
  rxmStore: RXMStore; // Manifest storage
  basePath?: string; // API route prefix (default: "")
  cors?: boolean; // Enable CORS (default: true)
}
```

## Handlers

Framework-agnostic handlers for custom server integrations (Next.js, Express, etc.).

```typescript
import {
  handlePublish,
  handleGetResource,
  handleHeadResource,
  handleDeleteResource,
  handleGetContent,
  handleSearch,
  CASRegistry,
} from "@resourcexjs/server";
import { FileSystemRXAStore, FileSystemRXMStore } from "@resourcexjs/node-provider";

const registry = new CASRegistry(
  new FileSystemRXAStore("./data/blobs"),
  new FileSystemRXMStore("./data/manifests")
);

// Next.js Route Handler example
export async function POST(request: Request) {
  return handlePublish(request, registry);
}
```

### Handler Functions

| Handler                                        | Description                            |
| ---------------------------------------------- | -------------------------------------- |
| `handlePublish(request, registry)`             | Process multipart form publish request |
| `handleGetResource(locator, registry)`         | Get resource manifest                  |
| `handleHeadResource(locator, registry)`        | Check resource existence               |
| `handleDeleteResource(locator, registry)`      | Delete a resource                      |
| `handleGetContent(locator, registry)`          | Download resource archive              |
| `handleSearch(query, limit, offset, registry)` | Search resources                       |

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### `GET /api/v1/health`

Health check endpoint.

**Response:**

```json
{ "status": "ok" }
```

### `POST /api/v1/publish`

Publish a resource to the registry.

**Content-Type:** `multipart/form-data`

**Fields:**

- `locator` (string) - Resource locator (e.g., `hello:1.0.0`)
- `manifest` (file) - JSON manifest file
- `content` (file) - Archive file (tar.gz)

**Response (201):**

```json
{ "locator": "hello:1.0.0" }
```

### `GET /api/v1/resource/:locator`

Get resource manifest.

**Response (200):**

```json
{
  "name": "hello",
  "type": "text",
  "tag": "1.0.0",
  "path": "prompts"
}
```

### `HEAD /api/v1/resource/:locator`

Check if resource exists.

**Response:** `200` if exists, `404` if not.

### `DELETE /api/v1/resource/:locator`

Delete a resource.

**Response:** `204` on success.

### `GET /api/v1/content/:locator`

Download resource archive.

**Response:** Binary `application/gzip` content.

### `GET /api/v1/search`

Search for resources.

**Query Parameters:**

- `q` (string, optional) - Search query
- `limit` (number, default: 100) - Max results
- `offset` (number, default: 0) - Pagination offset

**Response (200):**

```json
{
  "results": [
    {
      "locator": "hello:1.0.0",
      "name": "hello",
      "type": "text",
      "tag": "1.0.0"
    }
  ],
  "total": 1
}
```

## Protocol

Type definitions and constants for building clients.

```typescript
import {
  API_VERSION, // "v1"
  API_PREFIX, // "/api/v1"
  ENDPOINTS, // { publish, resource, content, search, health }
  CONTENT_TYPES, // { json, binary, formData }
  ERROR_CODES, // Error code constants
  buildResourceUrl, // Build resource URL
  buildContentUrl, // Build content URL
  buildPublishUrl, // Build publish URL
  buildSearchUrl, // Build search URL with params
} from "@resourcexjs/server";

// Types
import type {
  ManifestData,
  SearchQuery,
  PublishResponse,
  GetResourceResponse,
  SearchResultItem,
  SearchResponse,
  ErrorResponse,
  ErrorCode,
} from "@resourcexjs/server";
```

### URL Builders

```typescript
import { buildResourceUrl, buildSearchUrl } from "@resourcexjs/server";

const url = buildResourceUrl("https://registry.example.com", "hello:1.0.0");
// "https://registry.example.com/api/v1/resource/hello%3A1.0.0"

const searchUrl = buildSearchUrl("https://registry.example.com", {
  q: "prompt",
  limit: 10,
});
// "https://registry.example.com/api/v1/search?q=prompt&limit=10"
```

## Error Handling

All error responses follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code                 | Status | Description             |
| -------------------- | ------ | ----------------------- |
| `LOCATOR_REQUIRED`   | 400    | Missing locator field   |
| `MANIFEST_REQUIRED`  | 400    | Missing manifest file   |
| `CONTENT_REQUIRED`   | 400    | Missing content file    |
| `INVALID_MANIFEST`   | 400    | Invalid manifest format |
| `INVALID_LOCATOR`    | 400    | Invalid locator format  |
| `RESOURCE_NOT_FOUND` | 404    | Resource does not exist |
| `INTERNAL_ERROR`     | 500    | Internal server error   |

## Re-exports

For convenience, this package re-exports commonly used classes:

```typescript
import { CASRegistry, FileSystemRXAStore, FileSystemRXMStore } from "@resourcexjs/server";

import type { RXAStore, RXMStore, Registry } from "@resourcexjs/server";
```

## Storage Architecture

The server uses content-addressable storage (CAS) for efficient deduplication:

```
./data/
├── blobs/                        # Content-addressable blob storage
│   └── ab/
│       └── sha256:abcd1234...    # Archive data (tar.gz)
└── manifests/
    └── _local/                   # Resources stored on this server
        └── my-prompt/
            └── 1.0.0.json        # Manifest with digest reference
```

**Note:** The server stores resources without registry prefix. When a resource is published to `registry.example.com/hello:1.0.0`, it's stored as `hello:1.0.0` on the server. The registry prefix is added by clients when they pull resources.

## Related Packages

| Package                      | Description                     |
| ---------------------------- | ------------------------------- |
| `resourcexjs`                | Client SDK                      |
| `@resourcexjs/core`          | Core primitives and CASRegistry |
| `@resourcexjs/node-provider` | Node.js/Bun storage providers   |

## License

Apache-2.0
