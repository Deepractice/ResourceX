# @resourcexjs/cli

## 2.12.0

### Minor Changes

- 84c178d: feat: unify default storage path to ~/.deepractice/resourcex

  NodeProvider, CLI, and MCP server all default to ~/.deepractice/resourcex instead of ~/.resourcex.
  This aligns with the Deepractice convention where all tools share the ~/.deepractice/ prefix.

### Patch Changes

- Updated dependencies [84c178d]
  - @resourcexjs/node-provider@2.12.0
  - @resourcexjs/server@2.12.0
  - resourcexjs@2.12.0

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
  - resourcexjs@2.11.0
  - @resourcexjs/node-provider@2.11.0
  - @resourcexjs/server@2.11.0

## 2.10.0

### Patch Changes

- Updated dependencies [c197c52]
  - resourcexjs@2.10.0
  - @resourcexjs/server@2.10.0
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
  - resourcexjs@2.9.0
  - @resourcexjs/server@2.9.0
  - @resourcexjs/node-provider@2.9.0

## 2.8.0

### Minor Changes

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
  - @resourcexjs/node-provider@2.8.0
  - resourcexjs@2.8.0
  - @resourcexjs/server@2.8.0

## 2.7.0

### Minor Changes

- 2166a63: feat: add multi-registry management (Maven-style)
  - Add `rx registry add/remove/list/default` CLI commands for managing multiple registries
  - Support named registries with default flag in config.json
  - Auto-migrate old single `registry` field to `registries[]` array
  - First added registry automatically becomes the default
  - Push command resolves `--registry` flag by name or URL
  - MCP Server reads shared `~/.resourcex/config.json` for default registry
  - Environment variables still take precedence as override

### Patch Changes

- resourcexjs@2.7.0
- @resourcexjs/node-provider@2.7.0
- @resourcexjs/server@2.7.0

## 2.6.0

### Patch Changes

- @resourcexjs/node-provider@2.6.0
- resourcexjs@2.6.0
- @resourcexjs/server@2.6.0

## 2.5.7

### Patch Changes

- Updated dependencies [4a866e0]
- Updated dependencies [b4684d2]
  - resourcexjs@2.5.7
  - @resourcexjs/node-provider@2.5.7
  - @resourcexjs/server@2.5.7

## 2.5.6

### Patch Changes

- Updated dependencies [3c43d76]
- Updated dependencies [3c43d76]
  - resourcexjs@2.5.6
  - @resourcexjs/server@2.5.6
  - @resourcexjs/node-provider@2.5.6

## 2.5.5

### Patch Changes

- Updated dependencies [49e3d04]
  - resourcexjs@2.5.5
  - @resourcexjs/server@2.5.5

## 2.5.4

### Patch Changes

- resourcexjs@2.5.4
- @resourcexjs/server@2.5.4

## 2.5.3

### Patch Changes

- a5694e5: fix: add bin aliases for npx compatibility
  - resourcexjs@2.5.3
  - @resourcexjs/server@2.5.3

## 2.5.2

### Patch Changes

- 0ef96d1: fix: resolve workspace protocol for npm compatibility
  - resourcexjs@2.5.2
  - @resourcexjs/server@2.5.2

## 2.5.1

### Patch Changes

- 74629d7: docs: restructure documentation with Divio system

  - Remove old docs/ directory
  - Add new docs structure: tutorials, guides, reference, concepts
  - Add documentation TOC to main README
  - Fix CLI type errors (version → tag, add bun-types)

- Updated dependencies [74629d7]
  - resourcexjs@2.5.1
  - @resourcexjs/server@2.5.1
