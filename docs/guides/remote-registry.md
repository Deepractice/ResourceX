# Remote Registry Usage Guide

RemoteRegistry provides HTTP-based access to resources hosted on a remote server. It's ideal for accessing resources over the network when you have a dedicated registry server.

## Overview

RemoteRegistry is useful when:

- You have a centralized resource server
- You need HTTP-based access (REST API)
- You want to integrate with existing HTTP infrastructure

**Key characteristics:**

- Read-only (link/delete operations not supported)
- Uses HTTP API for all operations
- Supports search with pagination
- Works with any HTTP server implementing the registry API

## Basic Usage

### Creating a Remote Registry

```typescript
import { createRegistry } from "@resourcexjs/registry";

const registry = createRegistry({
  endpoint: "https://registry.deepractice.ai/v1",
});
```

The endpoint should point to the base URL of the registry API.

### Configuration

```typescript
interface RemoteRegistryConfig {
  endpoint: string; // Base URL for the registry API
}
```

### Examples

```typescript
// Production registry
const prodRegistry = createRegistry({
  endpoint: "https://registry.mycompany.com/api/v1",
});

// Development/staging registry
const devRegistry = createRegistry({
  endpoint: "http://localhost:3000/registry",
});
```

## HTTP API Endpoints

RemoteRegistry expects the server to implement these endpoints:

### GET /resource

Fetch resource manifest.

**Request:**

```
GET /resource?locator=domain/name.type@version
```

**Response (200):**

```json
{
  "domain": "deepractice.ai",
  "name": "hello",
  "type": "text",
  "version": "1.0.0"
}
```

**Response (404):**
Resource not found.

### GET /content

Fetch resource content (tar.gz archive).

**Request:**

```
GET /content?locator=domain/name.type@version
```

**Response (200):**
Binary content (application/gzip)

### GET /exists

Check if resource exists.

**Request:**

```
GET /exists?locator=domain/name.type@version
```

**Response (200):**

```json
{
  "exists": true
}
```

### GET /search

Search for resources.

**Request:**

```
GET /search?query=foo&limit=10&offset=0
```

**Response (200):**

```json
{
  "results": ["domain/foo-tool.text@1.0.0", "domain/foo-prompt.text@1.0.0"]
}
```

## Operations

### Resolving Resources

```typescript
const resolved = await registry.resolve("deepractice.ai/hello.text@1.0.0");
const content = await resolved.execute();
console.log(content);
```

Under the hood, this:

1. Fetches manifest from `/resource?locator=...`
2. Fetches content from `/content?locator=...`
3. Deserializes using TypeHandlerChain
4. Returns ResolvedResource with lazy execute()

### Getting Raw Resources

```typescript
const rxr = await registry.get("deepractice.ai/hello.text@1.0.0");
console.log(rxr.manifest.name); // "hello"

// Access content
const files = await rxr.content.files();
```

### Checking Existence

```typescript
const exists = await registry.exists("deepractice.ai/hello.text@1.0.0");
if (exists) {
  // Resource is available
}
```

### Searching Resources

```typescript
// Basic search
const results = await registry.search({ query: "prompt" });

// With pagination
const page = await registry.search({
  query: "tool",
  limit: 20,
  offset: 0,
});

// Iterate through results
for (const rxl of results) {
  console.log(rxl.toString());
  console.log(`  Name: ${rxl.name}`);
  console.log(`  Type: ${rxl.type}`);
  console.log(`  Version: ${rxl.version}`);
}
```

### Read-Only Restrictions

RemoteRegistry is read-only. These operations throw errors:

```typescript
// All of these throw RegistryError
await registry.link(resource);
// "Cannot link to remote registry - use local registry for linking"

await registry.delete("domain/resource.text@1.0.0");
// "Cannot delete from remote registry - use local registry for deletion"

await registry.publish(resource, options);
// "Remote registry publish not implemented yet"
```

## Caching Strategy

RemoteRegistry doesn't cache resources locally. If you need caching:

1. **Use LocalRegistry for caching**: Fetch from remote, then link to local

```typescript
const remote = createRegistry({
  endpoint: "https://registry.example.com/v1",
});

const local = createRegistry();

// Fetch from remote
const rxr = await remote.get("example.com/tool.text@1.0.0");

// Cache locally
await local.link(rxr);

// Now available locally
await local.resolve("example.com/tool.text@1.0.0");
```

2. **Use RxrTransport** which handles caching automatically (see ARP Protocol guide)

## Error Handling

### Resource Not Found

```typescript
try {
  await registry.resolve("domain/not-exist.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.log(error.message); // "Resource not found: domain/not-exist.text@1.0.0"
  }
}
```

### Network Errors

```typescript
try {
  await registry.resolve("domain/resource.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    // Could be network error, server error, etc.
    console.log(error.message); // "Failed to fetch resource: ..."
  }
}
```

### Search Errors

```typescript
try {
  await registry.search({ query: "test" });
} catch (error) {
  if (error instanceof RegistryError) {
    console.log(error.message); // "Search failed: ..."
  }
}
```

## Custom Resource Types

Register custom types to handle specialized resources:

```typescript
import { createRegistry } from "@resourcexjs/registry";
import { myCustomType } from "./my-types";

const registry = createRegistry({
  endpoint: "https://registry.example.com/v1",
});

// Register custom type
registry.supportType(myCustomType);

// Now can resolve custom type resources
const resolved = await registry.resolve("domain/resource.custom@1.0.0");
```

## Integration Patterns

### With Well-Known Discovery

Combine with well-known discovery for dynamic endpoint resolution:

```typescript
import { discoverRegistry, createRegistry } from "@resourcexjs/registry";

async function getRegistryForDomain(domain: string) {
  const discovery = await discoverRegistry(domain);
  const registryUrl = discovery.registries[0];

  // Check if it's an HTTP endpoint (not git)
  if (!registryUrl.startsWith("git@") && !registryUrl.endsWith(".git")) {
    return createRegistry({ endpoint: registryUrl });
  }

  // Otherwise use git registry
  return createRegistry({
    type: "git",
    url: registryUrl,
    domain: discovery.domain,
  });
}
```

### Pull-Through Cache Pattern

Create a local cache that pulls from remote on miss:

```typescript
class CachingRegistry {
  constructor(
    private local: Registry,
    private remote: Registry
  ) {}

  async resolve(locator: string) {
    // Try local first
    if (await this.local.exists(locator)) {
      return this.local.resolve(locator);
    }

    // Pull from remote
    const rxr = await this.remote.get(locator);
    await this.local.link(rxr);

    return this.local.resolve(locator);
  }
}

// Usage
const cache = new CachingRegistry(
  createRegistry(), // local
  createRegistry({ endpoint: "https://registry.example.com/v1" }) // remote
);
```

### Multiple Registry Fallback

Try multiple registries in order:

```typescript
async function resolveWithFallback(locator: string, registries: Registry[]) {
  for (const registry of registries) {
    try {
      if (await registry.exists(locator)) {
        return registry.resolve(locator);
      }
    } catch {
      // Try next registry
    }
  }
  throw new Error(`Resource not found in any registry: ${locator}`);
}

// Usage
const resolved = await resolveWithFallback("domain/tool.text@1.0.0", [
  createRegistry(), // Local first
  createRegistry({ endpoint: "https://primary.example.com/v1" }),
  createRegistry({ endpoint: "https://backup.example.com/v1" }),
]);
```

## Implementing a Registry Server

To implement a compatible registry server, you need these endpoints:

```typescript
// Express.js example
import express from "express";
import { LocalRegistry } from "@resourcexjs/registry";

const app = express();
const registry = new LocalRegistry({ path: "./server-resources" });

// GET /resource - Fetch manifest
app.get("/resource", async (req, res) => {
  const { locator } = req.query;

  try {
    const rxr = await registry.get(locator as string);
    res.json(rxr.manifest.toJSON());
  } catch (error) {
    res.status(404).json({ error: "Resource not found" });
  }
});

// GET /content - Fetch content
app.get("/content", async (req, res) => {
  const { locator } = req.query;

  try {
    const rxr = await registry.get(locator as string);
    const buffer = await rxr.content.buffer();
    res.type("application/gzip").send(buffer);
  } catch (error) {
    res.status(404).json({ error: "Resource not found" });
  }
});

// GET /exists - Check existence
app.get("/exists", async (req, res) => {
  const { locator } = req.query;
  const exists = await registry.exists(locator as string);
  res.json({ exists });
});

// GET /search - Search resources
app.get("/search", async (req, res) => {
  const { query, limit, offset } = req.query;

  const results = await registry.search({
    query: query as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  });

  res.json({
    results: results.map((rxl) => rxl.toString()),
  });
});

app.listen(3000, () => {
  console.log("Registry server running on port 3000");
});
```

## Complete Example

```typescript
import { createRegistry, RegistryError } from "@resourcexjs/registry";

async function main() {
  // Create remote registry
  const registry = createRegistry({
    endpoint: "https://registry.example.com/v1",
  });

  // Search for available resources
  console.log("Searching for resources...");
  const results = await registry.search({ limit: 10 });
  console.log(`Found ${results.length} resources:`);

  for (const rxl of results) {
    console.log(`  - ${rxl.toString()}`);
  }

  // Resolve a specific resource
  if (results.length > 0) {
    const locator = results[0].toString();
    console.log(`\nResolving: ${locator}`);

    try {
      const resolved = await registry.resolve(locator);
      const content = await resolved.execute();

      console.log("Content type:", typeof content);
      console.log("Content preview:", String(content).slice(0, 100));
    } catch (error) {
      if (error instanceof RegistryError) {
        console.error("Registry error:", error.message);
      } else {
        throw error;
      }
    }
  }
}

main().catch(console.error);
```
