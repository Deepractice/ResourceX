# storexjs

## 0.2.0

### Minor Changes

- e375c70: refactor: clean API — accept blobStore/manifestStore instead of CASRegistry

  createStoreX now takes { blobStore, manifestStore } directly.
  CASRegistry is created internally — callers never see it.
  Removed CASRegistry from public exports.

## 0.1.0

### Minor Changes

- ac9f80d: feat: add storexjs — Storage API for ResourceX applications

  New package `storexjs` provides application-level storage operations:

  - `createStoreX({ registry })` factory function
  - `list()`, `getFile()`, `append()`, `getManifest()`, `has()`, `put()`, `remove()`

  StoreX wraps CASRegistry for applications (Console, App gateway).
  ResourceX (resourcexjs) remains the API for AI agents.

### Patch Changes

- Updated dependencies [ac9f80d]
- Updated dependencies [f0010b8]
  - @resourcexjs/core@2.22.0
