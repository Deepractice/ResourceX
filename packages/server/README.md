# @resourcexjs/server

ResourceX Registry Server - HTTP API server for hosting and serving ResourceX resources.

## Installation

```bash
bun add @resourcexjs/server
```

## Overview

This package provides three levels of abstraction for building a ResourceX registry server:

1. **Hono Server** - Ready-to-use server with all endpoints configured
2. **Handlers** - Framework-agnostic request handlers for custom integrations
3. **Protocol** - Type definitions and constants for building clients

## Quick Start

```typescript
import { createRegistryServer } from "@resourcexjs/server";

const server = createRegistryServer({
  storagePath: "./data",
});

// Bun
Bun.serve({ fetch: server.fetch, port: 3000 });

// Node.js (with @hono/node-server)
import { serve } from "@hono/node-server";
serve({ fetch: server.fetch, port: 3000 });
```

## API

### `createRegistryServer(config?)`

Creates a Hono app with all registry endpoints configured.

```typescript
interface RegistryServerConfig {
  storagePath?: string; // Default: "./data"
  basePath?: string; // Default: ""
  cors?: boolean; // Default: true
}
```

### `createRegistry(config)`

Creates a registry instance for use with handlers.

```typescript
import { createRegistry } from "@resourcexjs/server";

const registry = createRegistry({ storagePath: "./data" });
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
  createRegistry,
} from "@resourcexjs/server";

const registry = createRegistry({ storagePath: "./data" });

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

- `locator` (string) - Resource locator (e.g., `hello.text@1.0.0`)
- `manifest` (file) - JSON manifest file
- `content` (file) - Archive file (tar.gz)

**Response (201):**

```json
{ "locator": "hello.text@1.0.0" }
```

### `GET /api/v1/resource/:locator`

Get resource manifest.

**Response (200):**

```json
{
  "name": "hello",
  "type": "text",
  "tag": "1.0.0",
  "registry": "example.com",
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
      "locator": "hello.text@1.0.0",
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

const url = buildResourceUrl("https://registry.example.com", "hello.text@1.0.0");
// "https://registry.example.com/api/v1/resource/hello.text%401.0.0"

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
import { LocalRegistry, FileSystemStorage, MemoryStorage } from "@resourcexjs/server";
```

## License

Apache-2.0
