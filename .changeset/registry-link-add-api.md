---
"@resourcexjs/registry": minor
---

Refactor Registry API: rename link() to add(), add new link() for symlinks

**Breaking Changes:**

- `link(resource: RXR)` renamed to `add(source: string | RXR)`
- New `link(path: string)` creates symlink to development directory
- `publish(source: string | RXR, options)` now accepts path or RXR

**New Features:**

- `link(path)` - Symlink to dev directory, changes reflect immediately
- `add(source)` - Copy to local registry (supports path or RXR object)
- `publish(source, options)` - Publish to remote (supports path or RXR object)

**Migration:**

```typescript
// Before
await registry.link(rxr);

// After
await registry.add(rxr);
// Or from directory
await registry.add("./my-resource");

// New: symlink for live development
await registry.link("./my-resource");
```
