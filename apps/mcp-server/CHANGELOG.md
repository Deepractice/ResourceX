# @resourcexjs/mcp-server

## 2.16.0

### Patch Changes

- @resourcexjs/node-provider@2.16.0
- resourcexjs@2.16.0

## 2.15.0

### Patch Changes

- Updated dependencies [180337d]
- Updated dependencies [9bacb4b]
  - resourcexjs@2.15.0
  - @resourcexjs/node-provider@2.15.0

## 2.14.1

### Patch Changes

- Updated dependencies [1d24462]
  - resourcexjs@2.14.1
  - @resourcexjs/node-provider@2.14.1

## 2.14.0

### Patch Changes

- Updated dependencies [d1989e2]
  - resourcexjs@2.14.0
  - @resourcexjs/node-provider@2.14.0

## 2.13.0

### Patch Changes

- Updated dependencies [7286d94]
  - @resourcexjs/node-provider@2.13.0
  - resourcexjs@2.13.0

## 2.12.0

### Minor Changes

- 84c178d: feat: unify default storage path to ~/.deepractice/resourcex

  NodeProvider, CLI, and MCP server all default to ~/.deepractice/resourcex instead of ~/.resourcex.
  This aligns with the Deepractice convention where all tools share the ~/.deepractice/ prefix.

### Patch Changes

- Updated dependencies [84c178d]
  - @resourcexjs/node-provider@2.12.0
  - resourcexjs@2.12.0

## 2.11.0

### Patch Changes

- Updated dependencies [2b95255]
  - resourcexjs@2.11.0
  - @resourcexjs/node-provider@2.11.0

## 2.10.0

### Patch Changes

- Updated dependencies [c197c52]
  - resourcexjs@2.10.0
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

## 2.6.0

### Patch Changes

- @resourcexjs/node-provider@2.6.0
- resourcexjs@2.6.0

## 2.5.7

### Patch Changes

- Updated dependencies [4a866e0]
- Updated dependencies [b4684d2]
  - resourcexjs@2.5.7
  - @resourcexjs/node-provider@2.5.7

## 2.5.6

### Patch Changes

- Updated dependencies [3c43d76]
  - resourcexjs@2.5.6
  - @resourcexjs/node-provider@2.5.6

## 2.5.5

### Patch Changes

- Updated dependencies [49e3d04]
  - resourcexjs@2.5.5

## 2.5.4

### Patch Changes

- 40baee5: feat: integrate roleType from RoleX for role resource support
  - resourcexjs@2.5.4

## 2.5.3

### Patch Changes

- a5694e5: fix: add bin aliases for npx compatibility
  - resourcexjs@2.5.3

## 2.5.2

### Patch Changes

- 0ef96d1: fix: resolve workspace protocol for npm compatibility
  - resourcexjs@2.5.2

## 2.5.1

### Patch Changes

- Updated dependencies [74629d7]
  - resourcexjs@2.5.1
