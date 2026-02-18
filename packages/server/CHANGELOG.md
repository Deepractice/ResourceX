# @resourcexjs/server

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
