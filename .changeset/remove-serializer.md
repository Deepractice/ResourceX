---
"@resourcexjs/type": minor
"@resourcexjs/registry": minor
---

refactor: remove serializer from ResourceType, unify storage format

**Breaking Changes:**

- Removed `ResourceSerializer` interface from `@resourcexjs/type`
- Removed `serializer` field from `ResourceType` interface
- Removed `serialize()` and `deserialize()` methods from `TypeHandlerChain`

**Migration:**

If you have custom resource types with serializers, remove the `serializer` field:

```typescript
// Before
const customType: ResourceType = {
  name: "custom",
  description: "Custom type",
  serializer: customSerializer, // Remove this
  resolver: customResolver,
};

// After
const customType: ResourceType = {
  name: "custom",
  description: "Custom type",
  resolver: customResolver,
};
```

**Internal Changes:**

- Registry now uses unified storage format (manifest.json + archive.tar.gz)
- Storage/retrieval uses `archive.buffer()` directly instead of type-specific serialization
- Type validation happens at `add()` time via `typeHandler.canHandle()`
