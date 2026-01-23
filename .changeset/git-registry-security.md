---
"@resourcexjs/registry": minor
"@resourcexjs/arp": patch
"resourcexjs": minor
---

feat(registry): add GitRegistry with domain security

- Add GitRegistry for git-based remote registries
- Security: remote URLs require domain binding to prevent impersonation
- Well-known format updated to use `registries` array (for future fallback support)
- `discoverRegistry()` now returns `DiscoveryResult` with domain binding
- RxrTransport auto-creates GitRegistry for git URLs with domain binding
- Local paths don't require domain (development use)
