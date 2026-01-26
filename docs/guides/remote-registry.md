# Remote Registry Usage Guide

The DefaultRegistry automatically fetches resources from remote registries when they're not found locally. This guide explains how remote fetch works and how to configure it.

## Overview

Remote fetch is useful when:

- You need resources from a centralized registry
- You want to share resources across teams
- You want automatic caching of remote resources

**Key characteristics:**

- Automatic remote fetch for non-localhost domains
- Local caching of fetched resources
- Optional mirror configuration for faster access
- Well-known discovery for finding registry endpoints

## How Remote Fetch Works

When you request a resource with a domain other than `localhost`, the registry follows this flow:

1. **Check local storage** - If found, return immediately
2. **Try mirror** - If mirror is configured, try fetching from it
3. **Discover endpoint** - Use well-known discovery (`https://{domain}/.well-known/resourcex`)
4. **Fetch from source** - Fetch manifest and content from discovered endpoint
5. **Cache locally** - Store in local storage for future access

```typescript
import { createRegistry } from "resourcexjs";

const registry = createRegistry();

// This triggers remote fetch for deepractice.ai domain
const resolved = await registry.resolve("deepractice.ai/hello.text@1.0.0");
// 1. Check ~/.resourcex/deepractice.ai/hello.text/1.0.0/
// 2. (No mirror configured, skip)
// 3. Fetch https://deepractice.ai/.well-known/resourcex
// 4. Fetch from discovered endpoint
// 5. Cache to local storage
```

## Configuration

### Basic Usage (No Configuration)

```typescript
import { createRegistry } from "resourcexjs";

// Creates registry with automatic remote fetch
const registry = createRegistry();

// Remote fetch happens automatically
const resolved = await registry.resolve("example.com/resource.text@1.0.0");
```

### With Mirror

Configure a mirror for faster remote access:

```typescript
const registry = createRegistry({
  mirror: "https://mirror.example.com/v1",
});

// Flow: Local -> Mirror -> Well-known -> Source
const resolved = await registry.resolve("example.com/resource.text@1.0.0");
```

### Custom Local Path

```typescript
const registry = createRegistry({
  path: "./custom-cache",
  mirror: "https://mirror.example.com/v1",
});
```

## HTTP API Endpoints

The registry expects remote endpoints to implement these HTTP endpoints:

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

## Well-Known Discovery

### How It Works

1. Domain owner publishes a well-known file at `https://{domain}/.well-known/resourcex`
2. File lists authorized registries for that domain
3. Registry fetches this file to discover the endpoint

### Well-Known File Format

```json
// https://example.com/.well-known/resourcex
{
  "version": "1.0",
  "registries": ["https://registry.example.com/v1"]
}
```

The first registry in the array is used as the primary endpoint.

### Using discoverRegistry

You can manually discover registries:

```typescript
import { discoverRegistry } from "resourcexjs";

const discovery = await discoverRegistry("deepractice.ai");
console.log(discovery.domain); // "deepractice.ai"
console.log(discovery.registries); // ["https://registry.deepractice.ai/v1"]
```

## Operations

### Resolving Remote Resources

```typescript
const resolved = await registry.resolve("deepractice.ai/hello.text@1.0.0");
const content = await resolved.execute();
console.log(content);
```

### Getting Raw Resources

```typescript
const rxr = await registry.get("deepractice.ai/hello.text@1.0.0");
console.log(rxr.manifest.name); // "hello"

// Access content
const pkg = await rxr.archive.extract();
const files = await pkg.files();
```

### Checking Existence

```typescript
// Note: exists() only checks local storage for non-localhost domains
// Use get() to trigger remote fetch
const exists = await registry.exists("deepractice.ai/hello.text@1.0.0");
if (!exists) {
  // Resource not in local cache - try fetching
  try {
    await registry.get("deepractice.ai/hello.text@1.0.0");
    console.log("Fetched and cached");
  } catch (error) {
    console.log("Not available remotely either");
  }
}
```

### Searching Resources

Search only works on local storage:

```typescript
// Search local cache
const results = await registry.search({ query: "prompt" });

// With pagination
const page = await registry.search({
  query: "tool",
  limit: 20,
  offset: 0,
});
```

### Write Operations

Write operations only work on local storage:

```typescript
// These work - writing to local storage
await registry.add(resource);
await registry.link("./my-resource");
await registry.delete("localhost/resource.text@1.0.0");

// Note: There's no direct "push to remote" functionality yet
// Resources are cached locally when fetched from remote
```

## Caching Behavior

### Automatic Caching

Remote resources are automatically cached to local storage:

```typescript
// First call: fetches from remote, caches locally
await registry.get("deepractice.ai/hello.text@1.0.0");

// Second call: served from local cache
await registry.get("deepractice.ai/hello.text@1.0.0");
```

### Cache Location

Remote resources are cached at:

```
~/.resourcex/{domain}/{path}/{name}.{type}/{version}/
```

Example:

```
~/.resourcex/deepractice.ai/tools/calculator.text/1.0.0/
  ├── manifest.json
  └── archive.tar.gz
```

### Pre-populating Cache

You can manually add resources to the cache:

```typescript
import { createRegistry, createRXM, createRXA, parseRXL } from "resourcexjs";

const registry = createRegistry();

const manifest = createRXM({
  domain: "deepractice.ai", // Remote domain
  name: "hello",
  type: "text",
  version: "1.0.0",
});

const archive = await createRXA({ content: "Hello" });

// This stores in the cache area (not local)
await registry.add({
  locator: parseRXL(manifest.toLocator()),
  manifest,
  archive,
});
```

## Error Handling

### Resource Not Found

```typescript
import { RegistryError } from "resourcexjs";

try {
  await registry.resolve("domain/not-exist.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.log(error.message); // "Resource not found: domain/not-exist.text@1.0.0"
  }
}
```

### Well-Known Discovery Failed

```typescript
try {
  await registry.resolve("unknown-domain.com/resource.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    // Could be network error or invalid well-known response
    console.log(error.message); // "Well-known discovery failed for unknown-domain.com: ..."
  }
}
```

### Network Errors

```typescript
try {
  await registry.resolve("domain/resource.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.log(error.message); // "Failed to fetch resource: ..."
  }
}
```

## Custom Resource Types

Register custom types to handle specialized remote resources:

```typescript
import { createRegistry, bundleResourceType } from "resourcexjs";

const promptType = await bundleResourceType("./prompt.type.ts");

const registry = createRegistry({
  types: [promptType],
});

// Now can resolve custom type resources from remote
const resolved = await registry.resolve("domain/my-prompt.prompt@1.0.0");
```

## Integration Patterns

### Fallback Pattern

Try local first, then remote:

```typescript
async function resolveWithFallback(locator: string) {
  const registry = createRegistry();

  // Check local first
  if (await registry.exists(locator)) {
    return registry.resolve(locator);
  }

  // Try remote (this is automatic for non-localhost domains)
  return registry.resolve(locator);
}
```

### Multiple Mirrors

Use a custom wrapper to try multiple mirrors:

```typescript
class MultiMirrorRegistry {
  private registries: Registry[];

  constructor(mirrors: string[]) {
    this.registries = mirrors.map((mirror) => createRegistry({ mirror }));
    // Also include default (no mirror) as fallback
    this.registries.push(createRegistry());
  }

  async resolve(locator: string) {
    for (const registry of this.registries) {
      try {
        return await registry.resolve(locator);
      } catch {
        // Try next
      }
    }
    throw new Error(`Resource not found: ${locator}`);
  }
}
```

### Pre-warming Cache

Fetch resources before they're needed:

```typescript
async function prewarmCache(locators: string[]) {
  const registry = createRegistry();

  for (const locator of locators) {
    try {
      await registry.get(locator);
      console.log(`Cached: ${locator}`);
    } catch (error) {
      console.log(`Failed to cache: ${locator}`);
    }
  }
}

// Usage
await prewarmCache([
  "deepractice.ai/prompt-a.text@1.0.0",
  "deepractice.ai/prompt-b.text@1.0.0",
  "deepractice.ai/tool-c.text@1.0.0",
]);
```

## Implementing a Registry Server

To implement a compatible registry server:

```typescript
// Express.js example
import express from "express";
import { createRegistry } from "resourcexjs";

const app = express();
const registry = createRegistry({ path: "./server-resources" });

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
    const buffer = await rxr.archive.buffer();
    res.type("application/gzip").send(buffer);
  } catch (error) {
    res.status(404).json({ error: "Resource not found" });
  }
});

app.listen(3000, () => {
  console.log("Registry server running on port 3000");
});
```

## Complete Example

```typescript
import { createRegistry, RegistryError } from "resourcexjs";

async function main() {
  // Create registry with mirror
  const registry = createRegistry({
    mirror: "https://mirror.example.com/v1",
  });

  // Search local cache
  console.log("Searching local cache...");
  const localResults = await registry.search({ limit: 10 });
  console.log(`Found ${localResults.length} local resources`);

  // Resolve a remote resource
  const locator = "deepractice.ai/hello.text@1.0.0";
  console.log(`\nResolving: ${locator}`);

  try {
    const resolved = await registry.resolve(locator);
    const content = await resolved.execute();

    console.log("Content type:", typeof content);
    console.log("Content preview:", String(content).slice(0, 100));

    // Now it's cached locally
    const exists = await registry.exists(locator);
    console.log("Cached locally:", exists); // true
  } catch (error) {
    if (error instanceof RegistryError) {
      console.error("Registry error:", error.message);
    } else {
      throw error;
    }
  }
}

main().catch(console.error);
```
