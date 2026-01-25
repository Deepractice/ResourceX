---
"@resourcexjs/type": minor
"@resourcexjs/registry": minor
"resourcexjs": minor
---

feat: introduce BundledType for sandbox-compatible execution

Breaking changes:

- `ResourceType.resolver` closure replaced with `BundledType.code` string
- `textType`, `jsonType`, `binaryType` are now BundledType (pre-bundled)
- `Registry.supportType()` now accepts BundledType instead of ResourceType
- `TypeHandlerChain.register()` now accepts BundledType

New exports:

- `BundledType` interface - pre-bundled type with code string
- `SandboxType` - "none" | "isolated" | "container"
- `bundleResourceType()` - bundle custom types from source files

Migration:

```typescript
// Before (closure-based)
const customType: ResourceType = {
  name: "custom",
  resolver: {
    schema: undefined,
    async resolve(rxr) { ... }
  }
};

// After (code string)
const customType: BundledType = {
  name: "custom",
  description: "Custom type",
  code: `({ async resolve(rxr) { ... } })`,
  sandbox: "none"
};
```
