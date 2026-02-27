# @resourcexjs/server

## 2.17.2

### Patch Changes

- Updated dependencies [53cb97b]
  - @resourcexjs/core@2.17.2
  - @resourcexjs/node-provider@2.17.2

## 2.17.1

### Patch Changes

- Updated dependencies [b34e5e6]
  - @resourcexjs/core@2.17.1
  - @resourcexjs/node-provider@2.17.1

## 2.17.0

### Patch Changes

- Updated dependencies [60a6107]
  - @resourcexjs/core@2.17.0
  - @resourcexjs/node-provider@2.17.0

## 2.16.1

### Patch Changes

- Updated dependencies [f547272]
  - @resourcexjs/core@2.16.1
  - @resourcexjs/node-provider@2.16.1

## 2.16.0

### Patch Changes

- Updated dependencies [1063b7c]
  - @resourcexjs/core@2.16.0
  - @resourcexjs/node-provider@2.16.0

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
  - @resourcexjs/node-provider@2.15.0

## 2.14.1

### Patch Changes

- @resourcexjs/core@2.14.1
- @resourcexjs/node-provider@2.14.1

## 2.14.0

### Patch Changes

- Updated dependencies [d1989e2]
  - @resourcexjs/core@2.14.0
  - @resourcexjs/node-provider@2.14.0

## 2.13.0

### Patch Changes

- Updated dependencies [7286d94]
  - @resourcexjs/core@2.13.0
  - @resourcexjs/node-provider@2.13.0

## 2.12.0

### Patch Changes

- Updated dependencies [84c178d]
  - @resourcexjs/node-provider@2.12.0
  - @resourcexjs/core@2.12.0

## 2.11.0

### Patch Changes

- Updated dependencies [2b95255]
  - @resourcexjs/core@2.11.0
  - @resourcexjs/node-provider@2.11.0

## 2.10.0

### Minor Changes

- c197c52: Rename RXL to RXI (identifier) and introduce RXL as unified locator type
  - `interface RXL` renamed to `interface RXI` (ResourceX Identifier)
  - `RXR.locator` renamed to `RXR.identifier`
  - New `type RXL = string` as unified locator (RXI string, directory path, or URL)
  - `parse()` returns `RXI`, `format()` accepts `RXI`, `locate()` returns `RXI`
  - Registry interfaces updated to use `RXI` parameter names

### Patch Changes

- Updated dependencies [c197c52]
  - @resourcexjs/core@2.10.0
  - @resourcexjs/node-provider@2.10.0

## 2.9.0

### Minor Changes

- 8884adf: feat: restructure RXM as definition/archive/source context

  BREAKING CHANGE: RXM and Resource interfaces restructured from flat to nested.

  - RXM now has three sections: `definition`, `archive`, `source`
  - `definition` includes metadata from RXD: description, author, license, keywords, repository
  - `source.files` is a structured FileTree with sizes (replaces flat string array)
  - `source.preview` provides first 500 chars of primary content file
  - `archive` is an empty placeholder for future packaging metadata (digest, md5)
  - All field access changes from `manifest.name` to `manifest.definition.name`
  - StoredRXM now persists extended definition fields
  - CLI and MCP info commands show structured file tree with sizes and preview

### Patch Changes

- Updated dependencies [8884adf]
  - @resourcexjs/core@2.9.0
  - @resourcexjs/node-provider@2.9.0

## 2.8.0

### Patch Changes

- Updated dependencies [89233d7]
- Updated dependencies [adece0b]
  - @resourcexjs/core@2.8.0
  - @resourcexjs/node-provider@2.8.0

## 2.7.0

### Patch Changes

- @resourcexjs/core@2.7.0
- @resourcexjs/node-provider@2.7.0

## 2.6.0

### Patch Changes

- Updated dependencies [1f7cf72]
  - @resourcexjs/core@2.6.0
  - @resourcexjs/node-provider@2.6.0

## 2.5.7

### Patch Changes

- @resourcexjs/core@2.5.7
- @resourcexjs/node-provider@2.5.7

## 2.5.6

### Patch Changes

- 3c43d76: docs: update documentation for Provider architecture

  - Update all READMEs to reflect new Provider pattern
  - Add setProvider() requirement in examples
  - Update storage layout documentation to CAS structure
  - Remove references to deleted packages (storage, registry, loader, type)
  - Add node-provider package documentation
  - Update CLAUDE.md with current architecture

- 3c43d76: fix(server): store and lookup resources without registry prefix

  Server now correctly stores resources without the registry prefix in the path.
  When a resource is published to `registry.example.com/hello:1.0.0`, it's stored
  as `hello:1.0.0` on the server. The registry prefix is added by clients when
  they pull resources.

- Updated dependencies [3c43d76]
  - @resourcexjs/core@2.5.6
  - @resourcexjs/node-provider@2.5.6

## 2.5.5

### Patch Changes

- @resourcexjs/core@2.5.5
- @resourcexjs/registry@2.5.5
- @resourcexjs/storage@2.5.5

## 2.5.4

### Patch Changes

- @resourcexjs/core@2.5.4
- @resourcexjs/registry@2.5.4
- @resourcexjs/storage@2.5.4

## 2.5.3

### Patch Changes

- @resourcexjs/core@2.5.3
- @resourcexjs/registry@2.5.3
- @resourcexjs/storage@2.5.3

## 2.5.2

### Patch Changes

- @resourcexjs/core@2.5.2
- @resourcexjs/registry@2.5.2
- @resourcexjs/storage@2.5.2

## 2.5.1

### Patch Changes

- @resourcexjs/core@2.5.1
- @resourcexjs/registry@2.5.1
- @resourcexjs/storage@2.5.1
