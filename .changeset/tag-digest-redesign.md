---
"@resourcexjs/core": minor
"@resourcexjs/server": minor
"@resourcexjs/node-provider": minor
"resourcexjs": minor
---

feat: tag + digest model, remove version concept

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
