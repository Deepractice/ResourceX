---
"@resourcexjs/core": minor
"resourcexjs": minor
---

Remove sandboxxjs dependency and simplify isolator to `none | custom`

- **IsolatorType**: Remove `srt`, `cloudflare`, `e2b` options, keep only `none` and `custom`
- **resourcexjs**: Remove `sandboxxjs` dependency and sandbox execution branch
- Users needing isolated execution use `custom` executor (e.g., QuickJS Wasm)
