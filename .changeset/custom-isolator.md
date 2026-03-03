---
"@resourcexjs/core": minor
"resourcexjs": minor
---

Add custom isolator support for pluggable resolver execution

- Add `"custom"` to IsolatorType union
- Add `CustomExecutor` type for user-provided executor functions
- Add `executor` option to ResourceXConfig
- executeResolver delegates to custom executor when isolator is "custom"
- Enables QuickJS Wasm execution in Cloudflare Workers (no eval)
