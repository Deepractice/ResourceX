# Git Registry Usage Guide

GitRegistry provides read-only access to resources stored in a Git repository. It clones the repository locally and serves resources from the cloned copy, fetching updates on each access.

## Overview

GitRegistry is ideal for:

- Publishing resources through Git workflows (PRs, code review)
- Sharing resources across teams via existing Git infrastructure
- Accessing resources without running a dedicated server

**Key characteristics:**

- Read-only (link/delete operations not supported)
- Automatically clones and updates repository
- Supports domain binding for security
- Caches repository at `~/.resourcex/.git-cache/`

## Basic Usage

### Creating a Git Registry

```typescript
import { createRegistry } from "@resourcexjs/registry";

// For remote repositories, domain binding is required
const registry = createRegistry({
  type: "git",
  url: "git@github.com:Deepractice/Registry.git",
  domain: "deepractice.dev", // Required for security
});
```

### Configuration Options

```typescript
interface GitRegistryConfig {
  type: "git"; // Required: identifies as git registry
  url: string; // Git repository URL (SSH or HTTPS)
  domain?: string; // Trusted domain (required for remote URLs)
  ref?: string; // Branch/tag/commit (default: "main")
  basePath?: string; // Resource path in repo (default: ".resourcex")
}
```

### Example Configurations

```typescript
// SSH URL with domain binding
const registry1 = createRegistry({
  type: "git",
  url: "git@github.com:MyOrg/Resources.git",
  domain: "myorg.com",
});

// HTTPS URL with custom branch
const registry2 = createRegistry({
  type: "git",
  url: "https://github.com/MyOrg/Resources.git",
  domain: "myorg.com",
  ref: "production",
});

// Local path (no domain required for development)
const registry3 = createRegistry({
  type: "git",
  url: "./local-repo",
  // domain not required for local paths
});
```

## Domain Binding (Security)

### Why Domain Binding Matters

Without domain binding, a malicious registry could:

- Claim to provide resources for any domain
- Impersonate trusted sources (e.g., `deepractice.ai/official-tool`)
- Deliver malicious content under a trusted namespace

Domain binding ensures resources from a registry can only claim their authorized domain.

### How It Works

When you create a GitRegistry with a `domain` parameter, the registry is automatically wrapped with DomainValidation middleware:

```typescript
// Creates GitRegistry wrapped with DomainValidation
const registry = createRegistry({
  type: "git",
  url: "git@github.com:Deepractice/Registry.git",
  domain: "deepractice.dev",
});

// This will succeed - domain matches
await registry.get("deepractice.dev/hello.text@1.0.0");

// This will throw RegistryError - domain mismatch
await registry.get("evil.com/hello.text@1.0.0");
// Error: "Untrusted domain: resource claims 'evil.com' but registry only trusts 'deepractice.dev'"
```

### Security Rules

1. **Remote URLs require domain**: SSH (`git@...`) and HTTPS URLs must have a `domain` parameter
2. **Local paths don't require domain**: Paths like `./repo` are for development only
3. **Domain validation on access**: Every `get()` and `resolve()` validates the resource's manifest domain

```typescript
// This throws RegistryError immediately
createRegistry({
  type: "git",
  url: "git@github.com:Example/Repo.git",
  // Missing domain - error!
});
// Error: "Remote git registry requires a trusted domain"
```

## Well-Known Discovery

Well-known discovery automates registry configuration by looking up a domain's authorized registries.

### How It Works

1. Domain owner publishes a well-known file at `https://{domain}/.well-known/resourcex`
2. File lists authorized registries for that domain
3. `discoverRegistry()` fetches this file and returns the configuration

### Well-Known File Format

```json
// https://deepractice.dev/.well-known/resourcex
{
  "version": "1.0",
  "registries": ["git@github.com:Deepractice/Registry.git"]
}
```

### Using Discovery

```typescript
import { discoverRegistry, createRegistry } from "@resourcexjs/registry";

// Discover registry for a domain
const discovery = await discoverRegistry("deepractice.dev");
// → { domain: "deepractice.dev", registries: ["git@github.com:Deepractice/Registry.git"] }

// Create registry from discovery (domain auto-bound)
const registry = createRegistry({
  type: "git",
  url: discovery.registries[0],
  domain: discovery.domain, // Security: domain from discovery
});

// Access resources
const resolved = await registry.resolve("deepractice.dev/hello.text@1.0.0");
```

### Complete Discovery Pattern

```typescript
async function getRegistryForDomain(domain: string) {
  const discovery = await discoverRegistry(domain);
  const registryUrl = discovery.registries[0];

  // Determine registry type
  if (registryUrl.startsWith("git@") || registryUrl.endsWith(".git")) {
    return createRegistry({
      type: "git",
      url: registryUrl,
      domain: discovery.domain,
    });
  } else {
    return createRegistry({
      endpoint: registryUrl,
    });
  }
}

// Usage
const registry = await getRegistryForDomain("deepractice.dev");
const resource = await registry.resolve("deepractice.dev/assistant.text@1.0.0");
```

## Repository Structure

GitRegistry expects resources in a specific directory structure:

```
{repository}/
└── .resourcex/                         # basePath (configurable)
    └── {domain}/
        └── {path}/
            └── {name}.{type}/
                └── {version}/
                    ├── manifest.json
                    └── archive.tar.gz
```

### Example Repository Layout

```
Registry/
└── .resourcex/
    └── deepractice.dev/
        ├── hello.text/
        │   └── 1.0.0/
        │       ├── manifest.json
        │       └── archive.tar.gz
        └── sean/
            └── assistant.text/
                ├── 1.0.0/
                │   ├── manifest.json
                │   └── archive.tar.gz
                └── 2.0.0/
                    ├── manifest.json
                    └── archive.tar.gz
```

### Custom Base Path

```typescript
const registry = createRegistry({
  type: "git",
  url: "git@github.com:MyOrg/Resources.git",
  domain: "myorg.com",
  basePath: "resources", // Instead of .resourcex
});
```

## Operations

### Resolving Resources

```typescript
const resolved = await registry.resolve("deepractice.dev/hello.text@1.0.0");
const content = await resolved.execute();
console.log(content);
```

### Getting Raw Resources

```typescript
const rxr = await registry.get("deepractice.dev/hello.text@1.0.0");
console.log(rxr.manifest.name); // "hello"
console.log(rxr.manifest.domain); // "deepractice.dev"
```

### Checking Existence

```typescript
const exists = await registry.exists("deepractice.dev/hello.text@1.0.0");
```

### Searching Resources

```typescript
// Search all resources
const all = await registry.search();

// Search with query
const filtered = await registry.search({ query: "hello" });

// With pagination
const page = await registry.search({
  query: "tool",
  limit: 10,
  offset: 0,
});
```

### Read-Only Restrictions

GitRegistry is read-only. These operations throw errors:

```typescript
// All of these throw RegistryError
await registry.add(resource);
// "GitRegistry is read-only - use LocalRegistry.link()"

await registry.delete("deepractice.dev/hello.text@1.0.0");
// "GitRegistry is read-only - use LocalRegistry.delete()"

await registry.publish(resource, options);
// "GitRegistry is read-only - use LocalRegistry.publish()"
```

## Caching Behavior

### Repository Cache Location

Cloned repositories are cached at:

```
~/.resourcex/.git-cache/{normalized-repo-name}/
```

For example:

- `git@github.com:Deepractice/Registry.git`
- Cached at: `~/.resourcex/.git-cache/github.com-Deepractice-Registry/`

### Automatic Updates

Every access operation triggers:

1. `git fetch origin` - Get latest changes
2. `git reset --hard origin/{branch}` - Update to latest

This ensures you always get the most recent resources.

### Branch Detection

GitRegistry auto-detects the default branch:

1. Tries `origin/main` first
2. Falls back to `origin/master` if main doesn't exist
3. Uses user-specified `ref` if provided

## Common Use Cases

### Publishing Workflow

1. Create resources locally using LocalRegistry
2. Export resources to git repository structure
3. Commit and push to Git
4. Users access via GitRegistry + well-known discovery

### Team Resource Sharing

```typescript
// Team's well-known file: https://myteam.internal/.well-known/resourcex
// { "version": "1.0", "registries": ["git@github.internal:team/resources.git"] }

const discovery = await discoverRegistry("myteam.internal");
const registry = createRegistry({
  type: "git",
  url: discovery.registries[0],
  domain: discovery.domain,
});

// Access team resources
const tool = await registry.resolve("myteam.internal/shared-tool.text@1.0.0");
```

### Development with Local Repository

```typescript
// Point to local git repo for development (no domain required)
const devRegistry = createRegistry({
  type: "git",
  url: "./my-resources-repo",
});

// Resources can claim any domain in dev mode
await devRegistry.get("any-domain.com/test.text@1.0.0");
```

## Error Handling

### Registry Creation Errors

```typescript
try {
  createRegistry({
    type: "git",
    url: "git@github.com:Org/Repo.git",
    // Missing domain!
  });
} catch (error) {
  // RegistryError: "Remote git registry requires a trusted domain"
}
```

### Domain Validation Errors

```typescript
const registry = createRegistry({
  type: "git",
  url: "git@github.com:Org/Repo.git",
  domain: "trusted.com",
});

try {
  await registry.get("untrusted.com/resource.text@1.0.0");
} catch (error) {
  // RegistryError: "Untrusted domain: resource claims 'untrusted.com'
  //                but registry only trusts 'trusted.com'"
}
```

### Resource Not Found

```typescript
try {
  await registry.get("trusted.com/missing.text@1.0.0");
} catch (error) {
  // RegistryError: "Resource not found: trusted.com/missing.text@1.0.0"
}
```

### Network/Git Errors

```typescript
try {
  await registry.get("trusted.com/resource.text@1.0.0");
} catch (error) {
  // Various git-related errors (auth, network, etc.)
}
```

## Complete Example

```typescript
import { createRegistry, discoverRegistry } from "@resourcexjs/registry";

async function accessRemoteResource(domain: string, locator: string) {
  // Step 1: Discover registry for domain
  console.log(`Discovering registry for ${domain}...`);
  const discovery = await discoverRegistry(domain);
  console.log(`Found registry: ${discovery.registries[0]}`);

  // Step 2: Create registry with domain binding
  const registry = createRegistry({
    type: "git",
    url: discovery.registries[0],
    domain: discovery.domain,
  });

  // Step 3: Check if resource exists
  const exists = await registry.exists(locator);
  if (!exists) {
    throw new Error(`Resource not found: ${locator}`);
  }

  // Step 4: Resolve and execute
  const resolved = await registry.resolve(locator);
  const content = await resolved.execute();

  console.log(`Resource content: ${content}`);
  return content;
}

// Usage
accessRemoteResource("deepractice.dev", "deepractice.dev/hello.text@1.0.0").catch(console.error);
```
