---
"storexjs": minor
"@resourcexjs/core": minor
---

feat: add storexjs — Storage API for ResourceX applications

New package `storexjs` provides application-level storage operations:
- `createStoreX({ registry })` factory function
- `list()`, `getFile()`, `append()`, `getManifest()`, `has()`, `put()`, `remove()`

StoreX wraps CASRegistry for applications (Console, App gateway).
ResourceX (resourcexjs) remains the API for AI agents.
