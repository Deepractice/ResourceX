---
"@resourcexjs/arp": minor
"@resourcexjs/registry": minor
"resourcexjs": minor
---

feat(arp): add list and mkdir operations to Transport interface

- Added `list()` method for directory listing with recursive and pattern options
- Added `mkdir()` method for creating directories
- FileTransport implements both operations
- ARL interface exposes list/mkdir methods

feat(registry): add middleware pattern for cross-cutting concerns

- Added `RegistryMiddleware` base class for creating custom middleware
- Added `DomainValidation` middleware for trusted domain validation
- Added `withDomainValidation()` factory function
- `createRegistry()` auto-injects DomainValidation when domain is provided

refactor(registry): use ARP for I/O operations

- LocalRegistry now uses ARP file transport for all I/O
- GitRegistry now uses ARP file transport for file reading
- Removed built-in domain validation from GitRegistry (handled by middleware)
