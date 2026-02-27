---
"@resourcexjs/core": minor
---

Add NpmSourceLoader for loading resources from npm packages

- New `NpmSourceLoader` resolves `npm:` prefixed sources to installed package directories
- Uses `import.meta.resolve` for cross-runtime compatibility (Node.js 20+ and Bun)
- Supports both npm-installed packages and `workspace:*` linked packages
- Registered as built-in loader in `SourceLoaderChain.create()`
- Delegates to `FolderSourceLoader` for actual file reading
