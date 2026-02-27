---
"@resourcexjs/core": patch
---

Fix NpmSourceLoader to resolve from consumer's entry point

Use Bun.main / process.argv[1] as the parent context for import.meta.resolve,
so that workspace:* packages are correctly resolved from the consuming package's
context rather than the bundled library's location or monorepo root.
