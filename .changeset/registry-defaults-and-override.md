---
"resourcexjs": minor
"@resourcexjs/core": minor
"@resourcexjs/node-provider": minor
"@resourcexjs/cli": minor
---

feat: auto-resolve registry from config and support runtime override

- Provider SPI: add optional `getDefaults()` method for platform-specific config resolution
- NodeProvider: implement `getDefaults()` — reads `RESOURCEX_REGISTRY` env var and `config.json`
- `createResourceX()`: auto-resolves registry from provider defaults when not explicitly provided
- `push()`/`pull()`: accept optional `{ registry }` parameter for per-operation override
- CLI: rename env vars to `RESOURCEX_REGISTRY`/`RESOURCEX_HOME` (old `RX_*` kept for backward compat)
