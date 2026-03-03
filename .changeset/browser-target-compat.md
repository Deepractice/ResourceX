---
"@resourcexjs/core": minor
"@resourcexjs/node-provider": minor
"resourcexjs": minor
"@resourcexjs/server": minor
---

Build with browser target to enforce environment-agnostic contracts

- Add `tools/browser-target.ts` Bun plugin that rejects `node:*` imports at build time
- **core**: Replace `node:crypto` with Web Crypto API, `node:zlib` with CompressionStream/DecompressionStream, `node:path` with pure string operations
- **core → node-provider**: Move `FolderSourceLoader`, `FolderLoader`, `NpmSourceLoader`, `LinkedRegistry`, `bundleResourceType` to node-provider
- **Provider SPI**: `createSourceLoader()` → `createSourceLoaders()` returning `SourceLoader[]`
- **server**: Remove unnecessary `@resourcexjs/node-provider` re-export
- **resourcexjs**: Mark `sandboxxjs` and `@resourcexjs/arp` as external
