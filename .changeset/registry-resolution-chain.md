---
"resourcexjs": minor
---

feat: registry resolution chain with built-in default fallback

Unprefixed locators now auto-resolve through a registry chain (configured registries → built-in default at registry.deepractice.dev). Pinned registry prefixes use HTTPS by default (HTTP for localhost).
