---
"@resourcexjs/core": minor
"resourcexjs": minor
---

feat: SourceLoader freshness check for cache invalidation

SourceLoader gains optional `isFresh(source, cachedAt)` method. Each loader implements its own strategy:
- FolderSourceLoader: compares file mtime against cachedAt (lightweight, no content read)
- GitHubSourceLoader: not implemented (always stale, re-fetches every time)

ResourceX.ingest() now checks freshness before re-loading: if the cached version is still fresh, it skips the full add cycle and resolves directly from CAS.

CASRegistry gains `getStoredManifest()` for lightweight metadata access without blob extraction.
