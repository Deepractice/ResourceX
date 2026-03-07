# @resourcexjs/node-provider

## 2.21.0

### Patch Changes

- Updated dependencies [2178d0e]
  - @resourcexjs/core@2.21.0

## 2.20.0

### Patch Changes

- Updated dependencies [a31fa3f]
  - @resourcexjs/core@2.20.0

## 2.19.0

### Minor Changes

- a7c161f: Build with browser target to enforce environment-agnostic contracts

  - Add `tools/browser-target.ts` Bun plugin that rejects `node:*` imports at build time
  - **core**: Replace `node:crypto` with Web Crypto API, `node:zlib` with CompressionStream/DecompressionStream, `node:path` with pure string operations
  - **core → node-provider**: Move `FolderSourceLoader`, `FolderLoader`, `NpmSourceLoader`, `LinkedRegistry`, `bundleResourceType` to node-provider
  - **Provider SPI**: `createSourceLoader()` → `createSourceLoaders()` returning `SourceLoader[]`
  - **server**: Remove unnecessary `@resourcexjs/node-provider` re-export
  - **resourcexjs**: Mark `sandboxxjs` and `@resourcexjs/arp` as external

### Patch Changes

- Updated dependencies [a7c161f]
  - @resourcexjs/core@2.19.0

## 2.18.0

### Patch Changes

- Updated dependencies [f41c7ad]
  - @resourcexjs/core@2.18.0

## 2.17.2

### Patch Changes

- Updated dependencies [53cb97b]
  - @resourcexjs/core@2.17.2

## 2.17.1

### Patch Changes

- Updated dependencies [b34e5e6]
  - @resourcexjs/core@2.17.1

## 2.17.0

### Patch Changes

- Updated dependencies [60a6107]
  - @resourcexjs/core@2.17.0

## 2.16.1

### Patch Changes

- Updated dependencies [f547272]
  - @resourcexjs/core@2.16.1

## 2.16.0

### Patch Changes

- Updated dependencies [1063b7c]
  - @resourcexjs/core@2.16.0

## 2.15.0

### Minor Changes

- 9bacb4b: feat: tag + digest model, remove version concept

  **Breaking changes:**

  - `ResolveContext.manifest.version` renamed to `tag`
  - `define()` no longer accepts `version` field (use `tag` instead)
  - `ResourceJsonDetector` no longer falls back to `version` field
  - `ResourceXProvider.createLoader()` removed (use `createSourceLoader()`)

  **New features:**

  - Archive digest: deterministic content hash computed from file-level digests
  - `Registry.put()` returns RXM with computed digest
  - Server publish/get responses include digest
  - Client freshness check: compares local vs remote digest before re-pulling
  - Locator format supports digest reference: `name@sha256:abc123`

  **Cleanup:**

  - Removed `SourceLoader.isFresh` — freshness unified to digest comparison
  - Removed provider-level `ResourceLoader` interface (duplicate of loader-level)
  - Simplified `ingest()` — always re-adds from source, CAS deduplicates

### Patch Changes

- Updated dependencies [9bacb4b]
  - @resourcexjs/core@2.15.0

## 2.14.1

### Patch Changes

- @resourcexjs/core@2.14.1

## 2.14.0

### Patch Changes

- Updated dependencies [d1989e2]
  - @resourcexjs/core@2.14.0

## 2.13.0

### Minor Changes

- 7286d94: feat: expose registry management API (registries, addRegistry, removeRegistry, setDefaultRegistry)

  Provider SPI gains optional registry management methods. NodeProvider implements them.
  ResourceX API proxies to provider, enabling downstream consumers (e.g. RoleX) to manage registries without direct config file access.

### Patch Changes

- Updated dependencies [7286d94]
  - @resourcexjs/core@2.13.0

## 2.12.0

### Minor Changes

- 84c178d: feat: unify default storage path to ~/.deepractice/resourcex

  NodeProvider, CLI, and MCP server all default to ~/.deepractice/resourcex instead of ~/.resourcex.
  This aligns with the Deepractice convention where all tools share the ~/.deepractice/ prefix.

### Patch Changes

- @resourcexjs/core@2.12.0

## 2.11.0

### Minor Changes

- 2b95255: feat: auto-resolve registry from config and support runtime override
  - Provider SPI: add optional `getDefaults()` method for platform-specific config resolution
  - NodeProvider: implement `getDefaults()` — reads `RESOURCEX_REGISTRY` env var and `config.json`
  - `createResourceX()`: auto-resolves registry from provider defaults when not explicitly provided
  - `push()`/`pull()`: accept optional `{ registry }` parameter for per-operation override
  - CLI: rename env vars to `RESOURCEX_REGISTRY`/`RESOURCEX_HOME` (old `RX_*` kept for backward compat)

### Patch Changes

- Updated dependencies [2b95255]
  - @resourcexjs/core@2.11.0

## 2.10.0

### Patch Changes

- Updated dependencies [c197c52]
  - @resourcexjs/core@2.10.0

## 2.9.0

### Patch Changes

- Updated dependencies [8884adf]
  - @resourcexjs/core@2.9.0

## 2.8.0

### Minor Changes

- 89233d7: feat: add Docker-style "latest" tag resolution

  - Add `setLatest`/`getLatest` to RXMStore interface for pointer-based latest tracking
  - FileSystemRXMStore stores `.latest` pointer file alongside version manifests
  - MemoryRXMStore tracks latest pointers in memory map
  - CASRegistry.put() automatically updates latest pointer on every add
  - CASRegistry.get()/has() transparently resolve "latest" to actual version
  - Backward compatible: single-version resources resolve without pointer
  - No server changes needed — CAS abstraction propagates resolution transparently

- adece0b: feat: add auto-detection pipeline, SourceLoaderChain, and API redesign
  - Add RXS intermediate type for raw file representation
  - Add TypeDetector interface and TypeDetectorChain (Chain of Responsibility)
  - Add built-in detectors: ResourceJsonDetector, SkillDetector
  - Add SourceLoader interface and SourceLoaderChain (Chain of Responsibility)
  - Add built-in loaders: FolderSourceLoader, GitHubSourceLoader
  - Add resolveSource() pipeline: load → detect → generate RXD → archive → RXR
  - Split ResourceX API: resolve(locator) + ingest(source) replacing use()
  - Flatten public API: resolve/ingest return T directly (Executable internalized)
  - Rename CLI command and MCP tool from "use" to "ingest"
  - Auto-detect resource type from file patterns (no resource.json required)
  - Support GitHub URLs as source via GitHubSourceLoader

### Patch Changes

- Updated dependencies [89233d7]
- Updated dependencies [adece0b]
  - @resourcexjs/core@2.8.0

## 2.7.0

### Patch Changes

- @resourcexjs/core@2.7.0

## 2.6.0

### Patch Changes

- Updated dependencies [1f7cf72]
  - @resourcexjs/core@2.6.0

## 2.5.7

### Patch Changes

- @resourcexjs/core@2.5.7

## 2.5.6

### Patch Changes

- 3c43d76: docs: update documentation for Provider architecture

  - Update all READMEs to reflect new Provider pattern
  - Add setProvider() requirement in examples
  - Update storage layout documentation to CAS structure
  - Remove references to deleted packages (storage, registry, loader, type)
  - Add node-provider package documentation
  - Update CLAUDE.md with current architecture

- Updated dependencies [3c43d76]
  - @resourcexjs/core@2.5.6
