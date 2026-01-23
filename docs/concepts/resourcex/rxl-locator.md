# RXL - Resource Locator

RXL (ResourceX Locator) is a human-readable address for identifying resources. Similar to how URLs address web pages, RXL addresses AI resources.

## Format

```
[domain/path/]name[.type][@version]
```

### Components

| Component | Required | Description                                | Example                  |
| --------- | -------- | ------------------------------------------ | ------------------------ |
| `domain`  | No       | Domain or organization owning the resource | `deepractice.ai`         |
| `path`    | No       | Hierarchical path under domain             | `sean/prompts`           |
| `name`    | Yes      | Resource name                              | `assistant`              |
| `type`    | No       | Resource type                              | `text`, `json`, `prompt` |
| `version` | No       | Semantic version                           | `1.0.0`                  |

### Domain Detection

A segment is considered a domain if:

- It contains a dot (e.g., `deepractice.ai`, `github.com`)
- It is literally `localhost`

## Parsing Examples

### Simple Name

```typescript
import { parseRXL } from "resourcexjs";

const rxl = parseRXL("assistant");
// {
//   domain: undefined,
//   path: undefined,
//   name: "assistant",
//   type: undefined,
//   version: undefined
// }
```

### Name with Type

```typescript
const rxl = parseRXL("assistant.prompt");
// {
//   name: "assistant",
//   type: "prompt"
// }
```

### Name with Version

```typescript
const rxl = parseRXL("assistant@1.0.0");
// {
//   name: "assistant",
//   version: "1.0.0"
// }
```

### Name with Type and Version

```typescript
const rxl = parseRXL("assistant.prompt@1.0.0");
// {
//   name: "assistant",
//   type: "prompt",
//   version: "1.0.0"
// }
```

### With Domain

```typescript
const rxl = parseRXL("deepractice.ai/assistant");
// {
//   domain: "deepractice.ai",
//   name: "assistant"
// }
```

### With Domain and Path

```typescript
const rxl = parseRXL("deepractice.ai/sean/assistant");
// {
//   domain: "deepractice.ai",
//   path: "sean",
//   name: "assistant"
// }
```

### Full Locator

```typescript
const rxl = parseRXL("deepractice.ai/sean/assistant.prompt@1.0.0");
// {
//   domain: "deepractice.ai",
//   path: "sean",
//   name: "assistant",
//   type: "prompt",
//   version: "1.0.0"
// }
```

### Localhost (Development)

```typescript
const rxl = parseRXL("localhost/my-project/tool.tool");
// {
//   domain: "localhost",
//   path: "my-project",
//   name: "tool",
//   type: "tool"
// }
```

### Multi-Level Path (GitHub Style)

```typescript
const rxl = parseRXL("github.com/org/repo/assistant.agent@2.0.0");
// {
//   domain: "github.com",
//   path: "org/repo",
//   name: "assistant",
//   type: "agent",
//   version: "2.0.0"
// }
```

## RXL Interface

```typescript
interface RXL {
  readonly domain?: string;
  readonly path?: string;
  readonly name: string;
  readonly type?: string;
  readonly version?: string;

  // Reconstruct the locator string
  toString(): string;
}
```

## Reconstructing Locator String

The `toString()` method reconstructs the original locator:

```typescript
const rxl = parseRXL("deepractice.ai/sean/assistant.prompt@1.0.0");
console.log(rxl.toString());
// "deepractice.ai/sean/assistant.prompt@1.0.0"
```

## Design Decisions

### Why Domain-Based Addressing?

Domain-based addressing provides:

1. **Namespace isolation**: Different organizations can have resources with the same name
2. **Trust verification**: Domain ownership can be verified via well-known discovery
3. **Decentralization**: No central naming authority required

### Why Optional Components?

Making most components optional allows flexible usage:

```typescript
// Development: just name
"my-prompt";

// Local with type
"my-prompt.text";

// Production: full locator
"deepractice.ai/prompts/my-prompt.text@1.0.0";
```

### Why Separate Type from Extension?

The type in RXL is semantic, not a file extension:

- `assistant.prompt` - A prompt resource (may contain multiple files)
- `config.json` - A JSON configuration resource
- `tool.binary` - A binary tool resource

Types define how resources are serialized and resolved, not file formats.

## Common Patterns

### Development Workflow

```typescript
// Local development (no domain)
const localRxl = parseRXL("my-prompt.text@1.0.0");

// Ready for publishing (with domain)
const prodRxl = parseRXL("mycompany.com/my-prompt.text@1.0.0");
```

### Version Resolution

```typescript
// Specific version
const specific = parseRXL("tool.binary@1.2.3");

// Without version (defaults to "latest" in registry)
const latest = parseRXL("tool.binary");
```

### Organization Resources

```typescript
// Organization-wide resource
const orgResource = parseRXL("example.com/shared-prompts/greeting.prompt@1.0.0");

// User-specific resource
const userResource = parseRXL("example.com/users/alice/custom.prompt@1.0.0");
```

## API Reference

```typescript
import { parseRXL } from "@resourcexjs/core";
// or
import { parseRXL } from "resourcexjs";

// Parse a locator string
const rxl: RXL = parseRXL(locator: string);
```

## See Also

- [RXM - Resource Manifest](./rxm-manifest.md) - Metadata that includes all RXL fields
- [Registry](./registry.md) - How locators are used to resolve resources
