---
"@resourcexjs/core": major
"@resourcexjs/type": major
"@resourcexjs/loader": major
"@resourcexjs/registry": major
"resourcexjs": major
---

**BREAKING CHANGE**: Refactor package structure - separate type system and loader into dedicated packages

## New Packages

- `@resourcexjs/type` - Type system with global singleton TypeHandlerChain
- `@resourcexjs/loader` - Resource loading from various sources

## Breaking Changes

### Removed APIs

- `defineResourceType()` - **REMOVED** (use `globalTypeHandlerChain.register()` or pass types to `createRegistry()`)
- `getResourceType()` - **REMOVED**
- `clearResourceTypes()` - **REMOVED** (use `globalTypeHandlerChain.clearExtensions()` for testing)
- `createTypeHandlerChain()` - **REMOVED** (use global singleton `globalTypeHandlerChain`)

### New APIs

```typescript
import { globalTypeHandlerChain } from "@resourcexjs/type";

// Register extension types (advanced usage)
globalTypeHandlerChain.register(customType);

// Query supported types
globalTypeHandlerChain.canHandle("text");
globalTypeHandlerChain.getSupportedTypes();

// Or pass types when creating registry (recommended)
const registry = createRegistry({
  types: [promptType, toolType],
});
```

### Type System Changes

- TypeHandlerChain is now a **global singleton**
- Builtin types (text, json, binary) are automatically registered
- Extension types are registered globally via `globalTypeHandlerChain.register()` or `createRegistry({ types })`
- All registries share the same type handler chain

### Package Structure

```
@resourcexjs/core       → RXL, RXM, RXC, RXR (data structures)
@resourcexjs/type       → Type system (NEW)
@resourcexjs/loader     → Resource loading (NEW)
@resourcexjs/registry   → Resource storage
@resourcexjs/arp        → I/O protocol
resourcexjs             → Main package (re-exports all)
```

### Migration Guide

**Before:**

```typescript
import { defineResourceType, createRegistry } from "resourcexjs";

defineResourceType(promptType); // Global registration
const registry = createRegistry();
```

**After:**

```typescript
import { createRegistry } from "resourcexjs";

// Option 1: Pass types to registry (recommended)
const registry = createRegistry({ types: [promptType] });

// Option 2: Register globally (advanced)
import { globalTypeHandlerChain } from "resourcexjs";
globalTypeHandlerChain.register(promptType);
```

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>
