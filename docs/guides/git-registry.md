# Git Registry Usage Guide

This guide explains how to work with Git-based resource registries using ResourceX's well-known discovery mechanism.

## Overview

Git-based registries allow you to:

- Publish resources through Git workflows (PRs, code review)
- Share resources across teams via existing Git infrastructure
- Version resources with Git history

**How it works:**

1. Resources are stored in a Git repository in a specific format
2. A registry server serves the resources via HTTP
3. The well-known file at the domain points to the registry endpoint
4. ResourceX clients discover and fetch resources automatically

## Repository Structure

Git repositories should store resources in a specific directory structure:

```
{repository}/
└── .resourcex/                         # Base path (configurable)
    └── {domain}/
        └── {path}/
            └── {name}.{type}/
                └── {version}/
                    ├── manifest.json
                    └── archive.tar.gz
```

### Example Repository Layout

```
my-registry/
└── .resourcex/
    └── deepractice.dev/
        ├── hello.text/
        │   └── 1.0.0/
        │       ├── manifest.json
        │       └── archive.tar.gz
        └── tools/
            └── calculator.text/
                ├── 1.0.0/
                │   ├── manifest.json
                │   └── archive.tar.gz
                └── 2.0.0/
                    ├── manifest.json
                    └── archive.tar.gz
```

### Manifest Format

Each `manifest.json` file contains:

```json
{
  "domain": "deepractice.dev",
  "path": "tools",
  "name": "calculator",
  "type": "text",
  "version": "1.0.0"
}
```

## Setting Up Well-Known Discovery

### 1. Create Well-Known File

Host a well-known file at `https://{domain}/.well-known/resourcex`:

```json
{
  "version": "1.0",
  "registries": ["https://registry.deepractice.dev/v1"]
}
```

### 2. Set Up Registry Server

Create a server that reads from your Git repository and serves the HTTP API:

```typescript
import express from "express";
import { createRegistry, LocalStorage } from "resourcexjs";

const app = express();

// Point to cloned git repository
const registry = createRegistry({
  storage: new LocalStorage({ path: "./git-repo/.resourcex" }),
});

app.get("/resource", async (req, res) => {
  const { locator } = req.query;
  try {
    const rxr = await registry.get(locator as string);
    res.json(rxr.manifest.toJSON());
  } catch (error) {
    res.status(404).json({ error: "Resource not found" });
  }
});

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

app.listen(3000);
```

## Using discoverRegistry

The `discoverRegistry` function helps find registries for a domain:

```typescript
import { discoverRegistry, createRegistry } from "resourcexjs";

// Discover registry for a domain
const discovery = await discoverRegistry("deepractice.dev");
console.log(discovery.domain); // "deepractice.dev"
console.log(discovery.registries); // ["https://registry.deepractice.dev/v1"]
```

## Client Usage

### Accessing Remote Resources

Once well-known discovery is set up, clients can access resources automatically:

```typescript
import { createRegistry } from "resourcexjs";

const registry = createRegistry();

// ResourceX discovers the registry via well-known
const resolved = await registry.resolve("deepractice.dev/hello.text@1.0.0");
const content = await resolved.execute();
```

### With Mirror for Faster Access

```typescript
const registry = createRegistry({
  mirror: "https://registry.deepractice.dev/v1",
});

// Tries mirror first, then falls back to well-known discovery
const resolved = await registry.resolve("deepractice.dev/hello.text@1.0.0");
```

## Domain Binding (Security)

Domain binding ensures resources from a registry can only claim their authorized domain.

### Why Domain Binding Matters

Without domain binding, a malicious registry could:

- Claim to provide resources for any domain
- Impersonate trusted sources
- Deliver malicious content under a trusted namespace

### How It Works

The well-known discovery automatically binds the domain:

```typescript
import { discoverRegistry } from "resourcexjs";

const discovery = await discoverRegistry("deepractice.dev");
// discovery.domain is bound to "deepractice.dev"

// When fetching resources, the domain in the manifest
// must match the domain from discovery
```

### DomainValidation Middleware

For server implementations, use the DomainValidation middleware:

```typescript
import { createRegistry, withDomainValidation, LocalStorage } from "resourcexjs";

const baseRegistry = createRegistry({
  storage: new LocalStorage({ path: "./resources" }),
});

// Wrap with domain validation
const registry = withDomainValidation(baseRegistry, "deepractice.dev");

// Resources with mismatched domains will throw RegistryError
try {
  await registry.get("evil.com/resource.text@1.0.0");
} catch (error) {
  // "Untrusted domain: resource claims 'evil.com' but registry only trusts 'deepractice.dev'"
}
```

## Publishing Workflow

### 1. Create Resource Locally

```typescript
import { createRegistry, createRXM, createRXA, parseRXL } from "resourcexjs";

const registry = createRegistry({ path: "./my-registry/.resourcex" });

const manifest = createRXM({
  domain: "deepractice.dev",
  name: "my-tool",
  type: "text",
  version: "1.0.0",
});

const archive = await createRXA({
  content: "Tool content here",
});

await registry.add({
  locator: parseRXL(manifest.toLocator()),
  manifest,
  archive,
});
```

### 2. Commit and Push

```bash
cd my-registry
git add .
git commit -m "Add my-tool.text@1.0.0"
git push origin main
```

### 3. Deploy Registry Server

Your registry server should automatically pick up the new resources when the Git repository is updated.

## Development Workflow

### Local Development

For local development, point to a local directory:

```typescript
import { createRegistry, LocalStorage } from "resourcexjs";

// Point to local git repo clone
const registry = createRegistry({
  storage: new LocalStorage({ path: "./my-registry/.resourcex" }),
});

// Resources are available immediately
const resolved = await registry.resolve("deepractice.dev/my-tool.text@1.0.0");
```

### Testing Before Publishing

```typescript
// Create a test resource
const manifest = createRXM({
  domain: "localhost", // Use localhost for testing
  name: "test-tool",
  type: "text",
  version: "1.0.0",
});

await registry.add({
  locator: parseRXL(manifest.toLocator()),
  manifest,
  archive: await createRXA({ content: "Test content" }),
});

// Test it works
const resolved = await registry.resolve("localhost/test-tool.text@1.0.0");
```

## Error Handling

### Resource Not Found

```typescript
import { RegistryError } from "resourcexjs";

try {
  await registry.get("deepractice.dev/missing.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.log(error.message); // "Resource not found: deepractice.dev/missing.text@1.0.0"
  }
}
```

### Well-Known Discovery Failed

```typescript
try {
  await registry.resolve("unknown-domain.com/resource.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.log(error.message); // "Well-known discovery failed for unknown-domain.com: ..."
  }
}
```

## Complete Example

### Server Side

```typescript
// server.ts
import express from "express";
import { createRegistry, LocalStorage, withDomainValidation } from "resourcexjs";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const app = express();
const REPO_PATH = "./git-repo";
const DOMAIN = "deepractice.dev";

// Update repo on startup
async function updateRepo() {
  try {
    await execAsync("git fetch origin && git reset --hard origin/main", {
      cwd: REPO_PATH,
    });
    console.log("Repository updated");
  } catch (error) {
    console.error("Failed to update repo:", error);
  }
}

// Create registry with domain validation
const baseRegistry = createRegistry({
  storage: new LocalStorage({ path: `${REPO_PATH}/.resourcex` }),
});
const registry = withDomainValidation(baseRegistry, DOMAIN);

app.get("/resource", async (req, res) => {
  await updateRepo(); // Keep fresh
  const { locator } = req.query;
  try {
    const rxr = await registry.get(locator as string);
    res.json(rxr.manifest.toJSON());
  } catch (error) {
    res.status(404).json({ error: "Resource not found" });
  }
});

app.get("/content", async (req, res) => {
  await updateRepo();
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

### Client Side

```typescript
// client.ts
import { createRegistry, discoverRegistry, RegistryError } from "resourcexjs";

async function main() {
  // Option 1: Automatic discovery
  const registry = createRegistry();

  // Option 2: Explicit mirror
  const registryWithMirror = createRegistry({
    mirror: "https://registry.deepractice.dev/v1",
  });

  // Resolve resource
  try {
    const resolved = await registry.resolve("deepractice.dev/hello.text@1.0.0");
    const content = await resolved.execute();
    console.log("Content:", content);

    // Access metadata
    console.log("Name:", resolved.resource.manifest.name);
    console.log("Version:", resolved.resource.manifest.version);
  } catch (error) {
    if (error instanceof RegistryError) {
      console.error("Registry error:", error.message);
    } else {
      throw error;
    }
  }
}

main();
```

## Best Practices

### 1. Use Semantic Versioning

Follow semver for resource versions:

```
1.0.0 - Initial release
1.0.1 - Bug fixes
1.1.0 - New features (backward compatible)
2.0.0 - Breaking changes
```

### 2. Keep Resources Small

Git repositories work best with smaller files. Consider:

- Splitting large resources into multiple smaller ones
- Using external storage for binary assets
- Compressing content before archiving

### 3. Use Branch-Based Development

```bash
# Create feature branch
git checkout -b add-new-tool

# Add resources
# ... make changes ...

# Create PR for review
git push origin add-new-tool
# Create PR on GitHub/GitLab

# After review, merge to main
```

### 4. Automate Updates

Set up CI/CD to automatically update the registry server when the repository changes:

```yaml
# .github/workflows/deploy.yml
name: Deploy Registry
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to server
        run: |
          # Trigger server update
          curl -X POST https://registry.example.com/webhook/update
```
