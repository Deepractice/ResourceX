---
"storexjs": minor
---

refactor: clean API — accept blobStore/manifestStore instead of CASRegistry

createStoreX now takes { blobStore, manifestStore } directly.
CASRegistry is created internally — callers never see it.
Removed CASRegistry from public exports.
