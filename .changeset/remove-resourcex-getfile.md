---
"resourcexjs": minor
---

refactor: remove getFile from ResourceX API

getFile is a storage-level operation that belongs in StoreX (storexjs),
not in the AI agent API (resourcexjs). CASRegistry.getFile remains
available through StoreX.
