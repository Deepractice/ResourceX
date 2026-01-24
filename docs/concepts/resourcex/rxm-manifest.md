# RXM - Resource Manifest

RXM (ResourceX Manifest) contains metadata about a resource. It's the "identity card" that describes what a resource is, who owns it, and which version it is.

## Structure

```typescript
interface RXM {
  readonly domain: string; // Required
  readonly path?: string; // Optional
  readonly name: string; // Required
  readonly type: string; // Required
  readonly version: string; // Required

  toLocator(): string; // Convert to RXL string
  toJSON(): ManifestData; // Convert to plain object
}
```

## Required Fields

Unlike RXL where most fields are optional, RXM requires all identity fields:

| Field     | Description                | Example            |
| --------- | -------------------------- | ------------------ |
| `domain`  | Domain owning the resource | `"deepractice.ai"` |
| `name`    | Resource name              | `"assistant"`      |
| `type`    | Resource type              | `"text"`           |
| `version` | Semantic version           | `"1.0.0"`          |

The `path` field remains optional for organizing resources within a domain.

## Creating Manifests

### Basic Manifest

```typescript
import { createRXM } from "resourcexjs";

const manifest = createRXM({
  domain: "deepractice.ai",
  name: "assistant",
  type: "prompt",
  version: "1.0.0",
});
```

### Manifest with Path

```typescript
const manifest = createRXM({
  domain: "deepractice.ai",
  path: "sean/prompts",
  name: "assistant",
  type: "prompt",
  version: "1.0.0",
});
```

### Local Development Manifest

```typescript
const manifest = createRXM({
  domain: "localhost",
  name: "my-tool",
  type: "binary",
  version: "0.1.0",
});
```

## Methods

### toLocator()

Converts the manifest back to a locator string:

```typescript
const manifest = createRXM({
  domain: "deepractice.ai",
  path: "sean",
  name: "assistant",
  type: "prompt",
  version: "1.0.0",
});

console.log(manifest.toLocator());
// "deepractice.ai/sean/assistant.prompt@1.0.0"
```

### toJSON()

Converts to a plain object for serialization:

```typescript
const manifest = createRXM({
  domain: "deepractice.ai",
  path: "prompts",
  name: "greeting",
  type: "text",
  version: "2.0.0",
});

console.log(manifest.toJSON());
// {
//   domain: "deepractice.ai",
//   path: "prompts",
//   name: "greeting",
//   type: "text",
//   version: "2.0.0"
// }
```

## Validation Errors

Missing required fields throw `ManifestError`:

```typescript
import { createRXM, ManifestError } from "resourcexjs";

try {
  createRXM({
    name: "test",
    type: "text",
    version: "1.0.0",
    // domain missing!
  });
} catch (error) {
  if (error instanceof ManifestError) {
    console.log(error.message); // "domain is required"
  }
}
```

### Error Messages

| Missing Field | Error Message           |
| ------------- | ----------------------- |
| `domain`      | `"domain is required"`  |
| `name`        | `"name is required"`    |
| `type`        | `"type is required"`    |
| `version`     | `"version is required"` |

## RXL vs RXM

| Aspect          | RXL (Locator)      | RXM (Manifest)                      |
| --------------- | ------------------ | ----------------------------------- |
| Purpose         | Address a resource | Describe a resource                 |
| Required fields | Only `name`        | `domain`, `name`, `type`, `version` |
| Creation        | `parseRXL(string)` | `createRXM(object)`                 |
| Use case        | Query, resolution  | Storage, identity                   |

### Conversion

You can get an RXL from an RXM using `toLocator()`:

```typescript
const manifest = createRXM({
  domain: "localhost",
  name: "test",
  type: "text",
  version: "1.0.0",
});

// Get locator string
const locatorString = manifest.toLocator();

// Parse to RXL object
const rxl = parseRXL(locatorString);
```

## Design Decisions

### Why Require All Fields?

RXM is the authoritative source of truth for a resource's identity. Making fields required ensures:

1. **Unambiguous identity**: Every resource has a complete identifier
2. **Storage consistency**: Registry can rely on all fields being present
3. **Version tracking**: All resources are versioned

### Why Separate from RXL?

RXL and RXM serve different purposes:

- **RXL**: Flexible queries ("find any version of this resource")
- **RXM**: Exact identity ("this specific resource")

```typescript
// RXL: Flexible query
parseRXL("assistant.prompt"); // OK - no version, no domain

// RXM: Exact identity
createRXM({
  domain: "example.com",
  name: "assistant",
  type: "prompt",
  version: "1.0.0",
}); // All fields required
```

## Storage Format

When stored in the registry, manifests are saved as `manifest.json`:

```json
{
  "domain": "deepractice.ai",
  "path": "prompts",
  "name": "greeting",
  "type": "text",
  "version": "1.0.0"
}
```

## Common Patterns

### Creating from RXL

When you have an RXL and need a manifest:

```typescript
const rxl = parseRXL("deepractice.ai/assistant.prompt@1.0.0");

const manifest = createRXM({
  domain: rxl.domain!, // Must ensure domain is present
  path: rxl.path,
  name: rxl.name,
  type: rxl.type!, // Must ensure type is present
  version: rxl.version!, // Must ensure version is present
});
```

### Type Aliases

Type names in manifests can use aliases:

```typescript
// These are all equivalent (text type)
createRXM({ domain: "localhost", name: "doc", type: "text", version: "1.0.0" });
createRXM({ domain: "localhost", name: "doc", type: "txt", version: "1.0.0" });
createRXM({ domain: "localhost", name: "doc", type: "plaintext", version: "1.0.0" });
```

## API Reference

```typescript
import { createRXM, ManifestError } from "@resourcexjs/core";
// or
import { createRXM, ManifestError } from "resourcexjs";

// Create a manifest
const rxm: RXM = createRXM(data: ManifestData);

interface ManifestData {
  domain?: string;  // Required at runtime
  path?: string;
  name?: string;    // Required at runtime
  type?: string;    // Required at runtime
  version?: string; // Required at runtime
}
```

## See Also

- [RXL - Resource Locator](./rxl-locator.md) - The addressing format
- [RXA - Resource Archive](./rxa-archive.md) - The archive paired with manifests
- [RXP - Resource Package](./rxp-package.md) - Extracted files for runtime access
- [RXR - Complete Resource](./rxr-resource.md) - How manifest combines with content
