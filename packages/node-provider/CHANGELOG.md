# @resourcexjs/node-provider

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

### Patch Changes

- Updated dependencies [89233d7]
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
