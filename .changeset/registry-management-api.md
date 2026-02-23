---
"@resourcexjs/core": minor
"@resourcexjs/node-provider": minor
"resourcexjs": minor
---

feat: expose registry management API (registries, addRegistry, removeRegistry, setDefaultRegistry)

Provider SPI gains optional registry management methods. NodeProvider implements them.
ResourceX API proxies to provider, enabling downstream consumers (e.g. RoleX) to manage registries without direct config file access.
