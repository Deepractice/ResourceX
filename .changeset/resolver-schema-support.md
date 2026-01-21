---
"@resourcexjs/type": minor
"resourcexjs": minor
---

feat: add schema support to resolver with structured result object

**Breaking Change**: `ResolvedResource` is now a structured object instead of a function.

**Before:**

```typescript
const fn = await typeChain.resolve(rxr);
const content = await fn();
```

**After:**

```typescript
const result = await typeChain.resolve(rxr);
const content = await result.execute();
const schema = result.schema; // JSON Schema for UI form rendering
```

**New Features:**

- `ResolvedResource` returns structured object with `execute` and `schema`
- `ResourceResolver` requires `schema` field (undefined for void args, JSONSchema for typed args)
- Added `JSONSchema` and `JSONSchemaProperty` types for schema definition
- UI can use `result.schema` to render parameter forms

**Type Definitions:**

```typescript
interface ResolvedResource<TArgs, TResult> {
  execute: (args?: TArgs) => TResult | Promise<TResult>;
  schema: TArgs extends void ? undefined : JSONSchema;
}

interface ResourceResolver<TArgs, TResult> {
  schema: TArgs extends void ? undefined : JSONSchema;
  resolve(rxr: RXR): Promise<ResolvedResource<TArgs, TResult>>;
}
```

**Built-in types** (text/json/binary) have `schema: undefined` since they take no arguments.
