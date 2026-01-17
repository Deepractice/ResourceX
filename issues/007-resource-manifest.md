# 007: Resource Manifest (resource.json)

## Background

Issue 004 introduced Resource Definition as runtime configuration:

```typescript
createResourceX({
  resources: [{ name: "mydata", semantic: "text", transport: "file", basePath: "/data" }],
});
```

This works for programmatic use, but doesn't support:

1. **Importing resources from filesystem** - batch import from directories
2. **Version control (Git)** - resources as files, not database records
3. **Sharing and distribution** - export resources as portable packages
4. **Local development** - edit resources in IDE with immediate effect

## Design

**resource.json** is the manifest file that describes a resource, similar to package.json for npm packages.

### Core Principle

```
Resource = resource.json + content
```

A directory is only considered a "resource" if it contains a valid resource.json.

### Manifest Structure

```typescript
interface ResourceManifest {
  // === Required ===
  name: string; // Unique identifier (lowercase, hyphens allowed)
  kind: ResourceKind; // Resource type (closed set)

  // === Content (one of) ===
  content: string; // Inline content OR relative path "./prompt.txt"

  // === Optional ===
  version?: string; // Semver, defaults to "0.0.0"
  description?: string; // Human-readable description
  tags?: string[]; // For discovery and search
  author?: string; // Author name or email

  // === Dependencies ===
  dependencies?: {
    [kind: string]: string[]; // e.g., { "tool": ["web-search"] }
  };

  // === Kind-specific config ===
  config?: Record<string, unknown>;
}

// Closed set - platform controlled
type ResourceKind =
  | "prompt" // Prompts and system instructions
  | "tool" // Tool definitions
  | "agent" // Agent configurations
  | "sandbox" // Execution environments
  | "knowledge"; // Knowledge bases, RAG sources
```

### Examples

**Prompt resource:**

```json
{
  "name": "sales-assistant",
  "kind": "prompt",
  "version": "1.0.0",
  "description": "AI assistant for sales scenarios",
  "content": "./system-prompt.txt",
  "tags": ["sales", "customer-service"]
}
```

**Agent resource with dependencies:**

```json
{
  "name": "research-agent",
  "kind": "agent",
  "version": "1.0.0",
  "content": "./agent-config.json",
  "dependencies": {
    "prompt": ["research-assistant"],
    "tool": ["web-search", "file-reader"]
  }
}
```

**Tool resource:**

```json
{
  "name": "web-search",
  "kind": "tool",
  "version": "1.0.0",
  "content": "./tool.ts",
  "config": {
    "runtime": "typescript",
    "entry": "search"
  }
}
```

### Directory Structure

```
resources/
├── prompts/
│   └── sales-assistant/
│       ├── resource.json      ← Manifest
│       └── system-prompt.txt  ← Content
│
├── tools/
│   └── web-search/
│       ├── resource.json
│       └── tool.ts
│
└── agents/
    └── research-agent/
        ├── resource.json
        └── agent-config.json
```

## API Design

### Loading from filesystem

```typescript
import { loadResource, discoverResources } from "resourcexjs";

// Load single resource
const resource = await loadResource("./resources/prompts/sales-assistant");
// Returns: { manifest: ResourceManifest, content: string | Buffer }

// Discover all resources in directory
const resources = await discoverResources("./resources");
// Returns: ResourceManifest[] (scans for resource.json files)
```

### CLI shortcuts

```bash
# Initialize resource from file (auto-generate resource.json)
rx init prompt.txt --kind prompt
# Creates:
#   prompt/
#   ├── resource.json
#   └── prompt.txt

# Initialize with inline content
rx init --kind prompt --content "You are a helpful assistant..."

# Validate resource
rx validate ./resources/prompts/sales-assistant

# List all resources
rx list ./resources
```

### Integration with existing ResourceX

```typescript
const rx = createResourceX({
  // Load resources from filesystem at startup
  resourceDirs: ["./resources"],

  // Or load dynamically
});

// After loading, resources are accessible via their name
await rx.resolve("sales-assistant://"); // Resolves the prompt content
```

## Implementation

### Phase 1: Core types and loading

```
packages/core/src/
├── manifest/
│   ├── types.ts        # ResourceManifest, ResourceKind
│   ├── schema.ts       # JSON Schema for validation
│   ├── loader.ts       # loadResource(), discoverResources()
│   └── index.ts
```

### Phase 2: CLI commands

```
packages/cli/src/commands/
├── init.ts             # rx init
├── validate.ts         # rx validate
└── list.ts             # rx list
```

### Phase 3: Integration with ResourceX

```
packages/resourcex/src/
├── ResourceX.ts        # Add resourceDirs config
└── createResourceX.ts  # Load resources on creation
```

## Relation to 004

- **004 (Resource Definition)**: Runtime configuration, programmatic
- **007 (Resource Manifest)**: File-based, portable, version-controlled

They complement each other:

```typescript
// 004: Define at runtime
createResourceX({
  resources: [{ name: "temp", semantic: "text", transport: "file", basePath: "/tmp" }],
});

// 007: Load from filesystem
createResourceX({
  resourceDirs: ["./resources"], // Scans for resource.json files
});
```

## Priority

**High** - Foundation for AgentVM Resource Center.

---

**Status**: Open
**Priority**: High
**Labels**: enhancement, agentvm-integration
