# Custom Resource Types Guide

ResourceX provides built-in types (text, json, binary), but you can define custom types to handle specialized resources with their own resolution logic.

## Overview

A **BundledType** defines:

- **Name**: Primary type identifier (e.g., "prompt", "tool")
- **Aliases**: Alternative names for the type
- **Schema**: JSON Schema for resolver arguments (optional)
- **Code**: Bundled resolver code that runs in the sandbox

Custom types are useful for:

- Domain-specific resources (prompts, tools, configurations)
- Resources with arguments and schemas (executable tools)
- Resources with complex multi-file structures

## BundledType Interface

```typescript
interface BundledType {
  name: string; // Primary type name
  aliases?: string[]; // Alternative names
  description: string; // Human-readable description
  schema?: JSONSchema; // JSON Schema for arguments (optional)
  code: string; // Bundled resolver code
}
```

## Creating Custom Types

### Option 1: Using bundleResourceType (Recommended)

Create a `.type.ts` file with your type definition:

```typescript
// prompt.type.ts
export default {
  name: "prompt",
  aliases: ["template"],
  description: "AI prompt with variable substitution",

  // Optional: JSON Schema for arguments
  schema: {
    type: "object",
    properties: {
      variables: {
        type: "object",
        description: "Variables to substitute in the prompt",
      },
    },
  },

  // Resolver function - receives ResolveContext
  async resolve(ctx) {
    // ctx.manifest: { domain, path?, name, type, version }
    // ctx.files: Record<string, Uint8Array>

    const content = ctx.files["content"];
    let template = new TextDecoder().decode(content);

    // Return the result directly or a function for dynamic execution
    return template;
  },
};
```

Bundle it using `bundleResourceType`:

```typescript
import { bundleResourceType } from "resourcexjs";

const promptType = await bundleResourceType("./prompt.type.ts");

// Now register with registry
const registry = createRegistry({ types: [promptType] });
```

### Option 2: Manual BundledType Definition

For simple types, you can define the BundledType directly:

```typescript
import type { BundledType } from "resourcexjs";

const myType: BundledType = {
  name: "mytype",
  aliases: ["mt"],
  description: "My custom type",
  code: `
    // @resolver: mytype_default
    var mytype_default = {
      name: "mytype",
      async resolve(ctx) {
        const content = ctx.files["content"];
        return new TextDecoder().decode(content);
      }
    };
  `,
};
```

## ResolveContext

The resolver function receives a `ResolveContext` with:

```typescript
interface ResolveContext {
  manifest: {
    domain: string;
    path?: string;
    name: string;
    type: string;
    version: string;
  };
  files: Record<string, Uint8Array>;
}
```

- `manifest`: Resource metadata from the RXR
- `files`: Extracted files from the archive as Uint8Array values

## Type Examples

### Simple Text Type

```typescript
// text-uppercase.type.ts
export default {
  name: "uppercase",
  description: "Returns text content in uppercase",

  async resolve(ctx) {
    const content = ctx.files["content"];
    const text = new TextDecoder().decode(content);
    return text.toUpperCase();
  },
};
```

### JSON Config Type

```typescript
// config.type.ts
export default {
  name: "appconfig",
  aliases: ["conf"],
  description: "Application configuration with validation",

  async resolve(ctx) {
    const content = ctx.files["config.json"];
    const config = JSON.parse(new TextDecoder().decode(content));

    // Validate required fields
    if (!config.name || !config.version) {
      throw new Error("Config must have name and version");
    }

    return config;
  },
};
```

### Multi-File Component Type

```typescript
// component.type.ts
export default {
  name: "component",
  aliases: ["comp"],
  description: "UI component with template and styles",

  async resolve(ctx) {
    const template = new TextDecoder().decode(ctx.files["template.html"]);
    const styles = ctx.files["styles.css"] ? new TextDecoder().decode(ctx.files["styles.css"]) : "";
    const script = ctx.files["script.js"] ? new TextDecoder().decode(ctx.files["script.js"]) : "";

    return {
      name: ctx.manifest.name,
      template,
      styles,
      script,
    };
  },
};
```

### Type with Arguments (Schema)

```typescript
// prompt.type.ts
export default {
  name: "prompt",
  aliases: ["template"],
  description: "AI prompt with variable substitution",

  // Schema enables UI rendering and validation
  schema: {
    type: "object",
    title: "Prompt Variables",
    properties: {
      variables: {
        type: "object",
        description: "Key-value pairs for template substitution",
        additionalProperties: { type: "string" },
      },
    },
  },

  async resolve(ctx) {
    const content = ctx.files["content"];
    let template = new TextDecoder().decode(content);

    // Return a function that accepts args
    return (args?: { variables?: Record<string, string> }) => {
      if (args?.variables) {
        for (const [key, value] of Object.entries(args.variables)) {
          template = template.replace(new RegExp(`{{${key}}}`, "g"), value);
        }
      }
      return template;
    };
  },
};
```

### Tool Type with Schema

```typescript
// tool.type.ts
export default {
  name: "tool",
  aliases: ["function", "action"],
  description: "Executable tool with schema",

  schema: {
    type: "object",
    title: "Tool Arguments",
    description: "Arguments passed to the tool",
  },

  async resolve(ctx) {
    // Load tool definition
    const defContent = ctx.files["tool.json"];
    const definition = JSON.parse(new TextDecoder().decode(defContent));

    // Load handler code
    const handlerContent = ctx.files["handler.js"];
    const handlerCode = new TextDecoder().decode(handlerContent);

    return {
      definition,
      execute: async (args: unknown) => {
        // Create and execute the handler
        const fn = new Function("args", handlerCode);
        return fn(args);
      },
    };
  },
};
```

## Registering Custom Types

### At Registry Creation

```typescript
import { createRegistry, bundleResourceType } from "resourcexjs";

const promptType = await bundleResourceType("./prompt.type.ts");
const toolType = await bundleResourceType("./tool.type.ts");

const registry = createRegistry({
  types: [promptType, toolType],
});
```

### After Creation

```typescript
const registry = createRegistry();

registry.supportType(promptType);
registry.supportType(toolType);
```

## Using Custom Types

### Creating Resources

```typescript
import { createRegistry, createRXM, createRXA, parseRXL } from "resourcexjs";

const registry = createRegistry({ types: [promptType] });

const manifest = createRXM({
  domain: "localhost",
  name: "greeting-prompt",
  type: "prompt", // Custom type
  version: "1.0.0",
});

const archive = await createRXA({
  content: "Hello, {{name}}! Welcome to {{place}}.",
});

await registry.add({
  locator: parseRXL(manifest.toLocator()),
  manifest,
  archive,
});
```

### Resolving Resources

```typescript
// Resolve the resource
const resolved = await registry.resolve("localhost/greeting-prompt.prompt@1.0.0");

// For types with arguments
const result = await resolved.execute({
  variables: {
    name: "Alice",
    place: "Wonderland",
  },
});

console.log(result); // "Hello, Alice! Welcome to Wonderland."
```

### Using Schema

```typescript
const resolved = await registry.resolve("localhost/calculator.tool@1.0.0");

// Schema describes expected arguments (useful for UI)
console.log(resolved.schema);
// {
//   type: "object",
//   title: "Tool Arguments",
//   properties: { ... }
// }

// Execute with arguments
const result = await resolved.execute({
  operation: "add",
  a: 5,
  b: 3,
});
```

## TypeHandlerChain

The `TypeHandlerChain` manages type registration internally:

```typescript
import { TypeHandlerChain } from "resourcexjs";

const chain = TypeHandlerChain.create();

// Built-in types are already registered
console.log(chain.canHandle("text")); // true
console.log(chain.canHandle("txt")); // true (alias)

// Register custom types
chain.register(promptType);

// Check type support
console.log(chain.canHandle("prompt")); // true
console.log(chain.canHandle("template")); // true (alias)

// Get all supported types
console.log(chain.getSupportedTypes());
// ['text', 'txt', 'plaintext', 'json', 'config', 'manifest', 'binary', 'bin', 'blob', 'raw', 'prompt', 'template']

// Get handler for a type
const handler = chain.getHandler("prompt");
console.log(handler.name); // "prompt"
console.log(handler.code); // Bundled resolver code
```

## Sandbox Execution

Custom type resolvers run in a sandbox environment for security. The sandbox isolation level is configured at the registry level:

```typescript
const registry = createRegistry({
  types: [myCustomType],
  isolator: "srt", // OS-level isolation
});
```

### Isolation Levels

| Level          | Overhead | Security           | Use Case             |
| -------------- | -------- | ------------------ | -------------------- |
| `"none"`       | ~10ms    | No isolation       | Development          |
| `"srt"`        | ~50ms    | OS-level (SRT)     | Secure local dev     |
| `"cloudflare"` | ~100ms   | Container (Docker) | Local Docker or edge |
| `"e2b"`        | ~150ms   | MicroVM            | Production (planned) |

### Sandbox Constraints

When writing resolver code, keep in mind:

1. **Pure functions**: Resolvers should be pure functions without side effects
2. **No Node.js APIs**: Sandbox doesn't have access to Node.js built-ins
3. **No network access**: Cannot make HTTP requests (by design)
4. **Serializable context**: Only ResolveContext data is available

## Best Practices

### 1. Keep Resolvers Simple

Resolvers should focus on transforming data, not complex logic:

```typescript
// Good - simple transformation
async resolve(ctx) {
  const content = ctx.files["content"];
  return new TextDecoder().decode(content).trim();
}

// Bad - complex logic that's hard to test
async resolve(ctx) {
  // Multiple database calls, external API requests, etc.
}
```

### 2. Use Meaningful Schemas

Schemas help UI tools render argument forms:

```typescript
schema: {
  type: "object",
  title: "Calculator Tool",
  description: "Performs basic arithmetic operations",
  properties: {
    operation: {
      type: "string",
      enum: ["add", "subtract", "multiply", "divide"],
      description: "The operation to perform",
    },
    a: {
      type: "number",
      description: "First operand",
    },
    b: {
      type: "number",
      description: "Second operand",
    },
  },
  required: ["operation", "a", "b"],
}
```

### 3. Handle Errors Gracefully

```typescript
async resolve(ctx) {
  const content = ctx.files["config.json"];
  if (!content) {
    throw new Error("Missing config.json file in archive");
  }

  try {
    return JSON.parse(new TextDecoder().decode(content));
  } catch (error) {
    throw new Error(`Invalid JSON in config.json: ${error.message}`);
  }
}
```

### 4. Document File Requirements

Make clear what files your type expects:

```typescript
// component.type.ts
/**
 * Component type expects the following files:
 * - template.html (required): HTML template
 * - styles.css (optional): Component styles
 * - script.js (optional): Component logic
 */
export default {
  name: "component",
  // ...
};
```

## Common Issues

### Type Already Registered

```typescript
chain.register(promptType);
chain.register(promptType); // Error: Type 'prompt' is already registered
```

Solution: Check before registering:

```typescript
if (!chain.canHandle("prompt")) {
  chain.register(promptType);
}
```

### Alias Conflicts

```typescript
const type1: BundledType = { name: "foo", aliases: ["bar"], ... };
const type2: BundledType = { name: "baz", aliases: ["bar"], ... }; // Conflict!

chain.register(type1);
chain.register(type2); // Error: Alias 'bar' conflicts with existing type or alias
```

### Unsupported Type Error

```typescript
import { ResourceTypeError } from "resourcexjs";

try {
  await registry.add(resourceWithUnknownType);
} catch (error) {
  if (error instanceof ResourceTypeError) {
    // Type not registered
    console.log(error.message); // "Unsupported resource type: unknown"
  }
}
```

Solution: Register the type first:

```typescript
registry.supportType(unknownType);
await registry.add(resourceWithUnknownType);
```
