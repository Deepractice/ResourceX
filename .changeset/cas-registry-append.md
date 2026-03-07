---
"@resourcexjs/core": minor
---

feat: add CASRegistry.append() for incremental file addition

Append files to an existing resource without re-archiving.
Leverages per-file CAS storage: only new files are written to blob store,
then the manifest's file map is extended and the digest recomputed.
