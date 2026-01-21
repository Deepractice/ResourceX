---
"@resourcexjs/type": minor
"resourcexjs": minor
---

feat: redesign resolver to return callable functions

**Breaking Change**: `ResourceResolver.resolve()` now returns a callable function instead of a value.

**Before:**

```typescript
const content = await typeChain.resolve<string>(rxr);
// content is already loaded
```

**After:**

```typescript
const fn = await typeChain.resolve<void, string>(rxr);
const content = await fn(); // lazy load
```

**Benefits:**

- Lazy loading: content is only read when the function is called
- Parameterized execution: custom types can accept arguments (e.g., tools)
- Unified interface: all types return functions

**Type Changes:**

- `ResolvedResource<TArgs, TResult>` - callable function type
- `ResourceResolver<TArgs, TResult>` - resolve returns ResolvedResource
- `ResourceType<TArgs, TResult>` - type definition with generics

**Built-in types now return:**

- text: `() => Promise<string>`
- json: `() => Promise<unknown>`
- binary: `() => Promise<Buffer>`
