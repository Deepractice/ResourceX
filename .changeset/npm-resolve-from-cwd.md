---
"@resourcexjs/core": patch
---

Fix NpmSourceLoader resolving from bundle location instead of consumer's cwd

Use import.meta.resolve's second parameter (parent) to resolve from process.cwd(),
fixing resolution failures when NpmSourceLoader runs inside a bundled dist.
