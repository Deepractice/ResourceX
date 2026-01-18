---
"@resourcexjs/core": minor
"resourcexjs": minor
---

feat: add loadResource API for loading resources from folders

Added `loadResource()` function with pluggable loader architecture to easily load resources from different sources:

- **ResourceLoader interface**: Strategy pattern for custom loaders
- **FolderLoader**: Default implementation for loading from folders
- **loadResource()**: Main API with support for custom loaders

**Folder structure:**

```
my-resource/
├── resource.json    # { name, type, version, domain?, path? }
└── content          # Resource content
```

**Usage:**

```typescript
import { loadResource, createRegistry } from "resourcexjs";

// Load from folder
const rxr = await loadResource("./my-resource");

// Link to registry
const registry = createRegistry();
await registry.link(rxr);

// Custom loader support
const rxr = await loadResource("resource.zip", {
  loader: new ZipLoader(),
});
```

**Breaking changes:**

- BDD tests now only depend on `resourcexjs` package (removed `@resourcexjs/core` and `@resourcexjs/registry` dependencies)
