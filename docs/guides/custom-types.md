# Custom Resource Types Guide

ResourceX provides built-in types (text, json, binary), but you can define custom types to handle specialized resources with their own serialization and resolution logic.

## Overview

A ResourceType defines:

- **Serializer**: How to convert resources to/from storage format (Buffer)
- **Resolver**: How to transform resources into executable results

Custom types are useful for:

- Domain-specific resources (prompts, tools, configurations)
- Resources with arguments and schemas (executable tools)
- Resources with complex multi-file structures

## ResourceType Interface

```typescript
interface ResourceType<TArgs = void, TResult = unknown> {
  name: string; // Primary type name
  aliases?: string[]; // Alternative names
  description: string; // Human-readable description
  serializer: ResourceSerializer; // Storage operations
  resolver: ResourceResolver<TArgs, TResult>; // Resolution logic
}
```

## Implementing a Serializer

The serializer handles converting resources to and from storage format.

```typescript
interface ResourceSerializer {
  serialize(rxr: RXR): Promise<Buffer>;
  deserialize(data: Buffer, manifest: RXM): Promise<RXR>;
}
```

### Basic Serializer (Archive-Based)

Most types use the archive-based approach, storing content as tar.gz:

```typescript
import { createRXA, parseRXL } from "@resourcexjs/core";

const mySerializer: ResourceSerializer = {
  async serialize(rxr: RXR): Promise<Buffer> {
    // Return the raw archive buffer
    return rxr.archive.buffer();
  },

  async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ buffer: data }),
    };
  },
};
```

### Custom Serializer Example

If you need custom serialization logic:

```typescript
const jsonConfigSerializer: ResourceSerializer = {
  async serialize(rxr: RXR): Promise<Buffer> {
    // Read the config file
    const configBuffer = await rxr.archive.extract().then(pkg => pkg.file("config.json");
    const config = JSON.parse(configBuffer.toString());

    // Add metadata before storing
    const enriched = {
      ...config,
      _meta: {
        serializedAt: new Date().toISOString(),
        version: rxr.manifest.version,
      },
    };

    // Store as single-file archive
    const enrichedContent = await createRXA({
      content: JSON.stringify(enriched, null, 2),
    });

    return enrichedContent.buffer();
  },

  async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
    // Standard deserialization
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ buffer: data }),
    };
  },
};
```

## Implementing a Resolver

The resolver transforms resources into executable results.

```typescript
interface ResourceResolver<TArgs = void, TResult = unknown> {
  schema: TArgs extends void ? undefined : JSONSchema;
  resolve(rxr: RXR): Promise<ResolvedResource<TArgs, TResult>>;
}

interface ResolvedResource<TArgs = void, TResult = unknown> {
  resource: RXR; // Original resource
  execute: (args?: TArgs) => TResult | Promise<TResult>; // Execution function
  schema: TArgs extends void ? undefined : JSONSchema; // Argument schema
}
```

### Simple Resolver (No Arguments)

For resources that don't take arguments:

```typescript
const promptResolver: ResourceResolver<void, string> = {
  schema: undefined, // No arguments needed

  async resolve(rxr: RXR): Promise<ResolvedResource<void, string>> {
    return {
      resource: rxr,
      schema: undefined,

      // Lazy execution - content read only when called
      execute: async () => {
        const buffer = await rxr.archive.extract().then(pkg => pkg.file("content");
        return buffer.toString("utf-8");
      },
    };
  },
};
```

### Resolver with Arguments

For resources that accept arguments (like tools):

```typescript
interface AddToolArgs {
  a: number;
  b: number;
}

const toolResolver: ResourceResolver<AddToolArgs, number> = {
  schema: {
    type: "object",
    properties: {
      a: { type: "number", description: "First number" },
      b: { type: "number", description: "Second number" },
    },
    required: ["a", "b"],
  },

  async resolve(rxr: RXR): Promise<ResolvedResource<AddToolArgs, number>> {
    return {
      resource: rxr,
      schema: this.schema,

      execute: async (args?: AddToolArgs) => {
        if (!args) {
          throw new Error("Arguments required for tool execution");
        }
        return args.a + args.b;
      },
    };
  },
};
```

### Complex Resolver Example

A resolver that loads code from the resource:

```typescript
interface ScriptToolArgs {
  input: string;
}

interface ScriptToolResult {
  output: string;
  duration: number;
}

const scriptToolResolver: ResourceResolver<ScriptToolArgs, ScriptToolResult> = {
  schema: {
    type: "object",
    properties: {
      input: { type: "string", description: "Input to process" },
    },
    required: ["input"],
  },

  async resolve(rxr: RXR): Promise<ResolvedResource<ScriptToolArgs, ScriptToolResult>> {
    // Load the script at resolution time
    const scriptBuffer = await rxr.archive.extract().then(pkg => pkg.file("script.js");
    const scriptCode = scriptBuffer.toString("utf-8");

    // Create a function from the code
    const scriptFn = new Function("input", scriptCode);

    return {
      resource: rxr,
      schema: this.schema,

      execute: async (args?: ScriptToolArgs) => {
        if (!args) {
          throw new Error("Arguments required");
        }

        const start = Date.now();
        const output = scriptFn(args.input);
        const duration = Date.now() - start;

        return { output, duration };
      },
    };
  },
};
```

## Complete ResourceType Examples

### Prompt Type

A type for AI prompts with template support:

```typescript
import type {
  ResourceType,
  ResourceSerializer,
  ResourceResolver,
  ResolvedResource,
} from "@resourcexjs/type";
import { createRXA, parseRXL } from "@resourcexjs/core";

interface PromptArgs {
  variables?: Record<string, string>;
}

const promptSerializer: ResourceSerializer = {
  async serialize(rxr) {
    return rxr.archive.buffer();
  },
  async deserialize(data, manifest) {
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ buffer: data }),
    };
  },
};

const promptResolver: ResourceResolver<PromptArgs, string> = {
  schema: {
    type: "object",
    properties: {
      variables: {
        type: "object",
        description: "Variables to substitute in the prompt",
      },
    },
  },

  async resolve(rxr): Promise<ResolvedResource<PromptArgs, string>> {
    return {
      resource: rxr,
      schema: this.schema,

      execute: async (args?: PromptArgs) => {
        const buffer = await rxr.archive.extract().then(pkg => pkg.file("content");
        let template = buffer.toString("utf-8");

        // Substitute variables
        if (args?.variables) {
          for (const [key, value] of Object.entries(args.variables)) {
            template = template.replace(new RegExp(`{{${key}}}`, "g"), value);
          }
        }

        return template;
      },
    };
  },
};

export const promptType: ResourceType<PromptArgs, string> = {
  name: "prompt",
  aliases: ["template"],
  description: "AI prompt with variable substitution",
  serializer: promptSerializer,
  resolver: promptResolver,
};
```

### Tool Type

A type for executable tools:

```typescript
interface ToolArgs {
  [key: string]: unknown;
}

interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

const toolSerializer: ResourceSerializer = {
  async serialize(rxr) {
    return rxr.archive.buffer();
  },
  async deserialize(data, manifest) {
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ buffer: data }),
    };
  },
};

const toolResolver: ResourceResolver<ToolArgs, ToolResult> = {
  schema: {
    type: "object",
    description: "Tool arguments - schema defined per tool",
  },

  async resolve(rxr): Promise<ResolvedResource<ToolArgs, ToolResult>> {
    // Load tool definition
    const defBuffer = await rxr.archive.extract().then(pkg => pkg.file("tool.json");
    const definition = JSON.parse(defBuffer.toString());

    // Load handler code
    const handlerBuffer = await rxr.archive.extract().then(pkg => pkg.file("handler.js");
    const handlerCode = handlerBuffer.toString();

    return {
      resource: rxr,
      schema: definition.schema || this.schema,

      execute: async (args?: ToolArgs) => {
        try {
          // Execute the tool
          const handler = new Function("args", handlerCode);
          const result = await handler(args);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    };
  },
};

export const toolType: ResourceType<ToolArgs, ToolResult> = {
  name: "tool",
  aliases: ["function", "action"],
  description: "Executable tool with schema",
  serializer: toolSerializer,
  resolver: toolResolver,
};
```

## Registering Custom Types

### With TypeHandlerChain

For direct type chain usage:

```typescript
import { TypeHandlerChain } from "@resourcexjs/type";
import { promptType, toolType } from "./my-types";

const chain = TypeHandlerChain.create();

// Register custom types
chain.register(promptType);
chain.register(toolType);

// Check type support
console.log(chain.canHandle("prompt")); // true
console.log(chain.canHandle("template")); // true (alias)
console.log(chain.getSupportedTypes()); // ['text', 'txt', ..., 'prompt', 'template', ...]
```

### With Registry

Register types when creating or after creating a registry:

```typescript
import { createRegistry } from "@resourcexjs/registry";
import { promptType, toolType } from "./my-types";

// Option 1: At creation time
const registry = createRegistry({
  types: [promptType, toolType],
});

// Option 2: After creation
const registry2 = createRegistry();
registry2.supportType(promptType);
registry2.supportType(toolType);
```

## Using Custom Types

### Creating Resources

```typescript
const manifest = createRXM({
  domain: "localhost",
  name: "greeting-prompt",
  type: "prompt", // Custom type
  version: "1.0.0",
});

const content = await createRXA({
  content: "Hello, {{name}}! Welcome to {{place}}.",
});

await registry.add({
  locator: parseRXL(manifest.toLocator()),
  manifest,
  content,
});
```

### Resolving Resources

```typescript
const resolved = await registry.resolve<PromptArgs, string>(
  "localhost/greeting-prompt.prompt@1.0.0"
);

// Execute with arguments
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
const resolved = await registry.resolve<ToolArgs, ToolResult>("localhost/calculator.tool@1.0.0");

// Schema describes expected arguments
console.log(resolved.schema);
// {
//   type: "object",
//   properties: {
//     operation: { type: "string", enum: ["add", "subtract"] },
//     a: { type: "number" },
//     b: { type: "number" }
//   },
//   required: ["operation", "a", "b"]
// }

// Execute with validated arguments
const result = await resolved.execute({
  operation: "add",
  a: 5,
  b: 3,
});
```

## Best Practices

### 1. Keep Serializers Simple

Most types can use the standard archive-based serializer:

```typescript
const standardSerializer: ResourceSerializer = {
  async serialize(rxr) {
    return rxr.archive.buffer();
  },
  async deserialize(data, manifest) {
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ buffer: data }),
    };
  },
};
```

### 2. Make Execution Lazy

Only read content when `execute()` is called:

```typescript
// Good - lazy
execute: async () => {
  const buffer = await rxr.archive.extract().then(pkg => pkg.file("content");
  return buffer.toString();
};

// Bad - eager (reads on resolve)
const buffer = await rxr.archive.extract().then(pkg => pkg.file("content"); // During resolve
execute: async () => {
  return buffer.toString();
};
```

### 3. Provide Meaningful Schemas

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

### 4. Handle Errors Gracefully

```typescript
execute: async (args) => {
  try {
    // Tool logic
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
```

### 5. Type Safety

Use TypeScript generics for type safety:

```typescript
// Define your argument and result types
interface MyToolArgs {
  query: string;
  limit?: number;
}

interface MyToolResult {
  items: string[];
  total: number;
}

// Type your resolver
const resolver: ResourceResolver<MyToolArgs, MyToolResult> = {
  schema: {
    /* ... */
  },
  async resolve(rxr) {
    return {
      resource: rxr,
      schema: this.schema,
      execute: async (args) => {
        // TypeScript knows args is MyToolArgs | undefined
        if (!args) throw new Error("Arguments required");
        // TypeScript knows we return MyToolResult
        return { items: [], total: 0 };
      },
    };
  },
};
```

## Common Issues

### Type Already Registered

```typescript
chain.register(promptType);
chain.register(promptType); // Error: Type 'prompt' is already registered
```

Solution: Check before registering or clear extensions for testing:

```typescript
if (!chain.canHandle("prompt")) {
  chain.register(promptType);
}

// For testing
chain.clearExtensions(); // Resets to built-in types only
```

### Alias Conflicts

```typescript
const type1: ResourceType = { name: "foo", aliases: ["bar"] };
const type2: ResourceType = { name: "baz", aliases: ["bar"] }; // Conflict!

chain.register(type1);
chain.register(type2); // Error: Alias 'bar' conflicts with existing type or alias
```

### Unsupported Type Error

```typescript
// Type not registered
await registry.add(resourceWithUnknownType);
// ResourceTypeError: Unsupported resource type: unknown

// Solution: Register the type first
registry.supportType(unknownType);
await registry.add(resourceWithUnknownType);
```
