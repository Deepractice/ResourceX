---
"@resourcexjs/registry": patch
---

fix: always include builtinTypes in registry

Previously, passing custom `types` to `createRegistry()` would override builtinTypes instead of extending them. Now builtinTypes (text, json, binary) are always included, and custom types are appended.

```typescript
// Before: builtinTypes were replaced
createRegistry({ types: [customType] }); // Only customType, no text/json/binary!

// After: builtinTypes + custom types
createRegistry({ types: [customType] }); // text, json, binary + customType
```
