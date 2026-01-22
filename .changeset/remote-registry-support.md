---
"@resourcexjs/registry": minor
"@resourcexjs/arp": minor
"@resourcexjs/core": patch
"resourcexjs": minor
---

feat: add RemoteRegistry and auto-create Registry support

## Registry Package

- Add `RemoteRegistry` for accessing remote registries via HTTP API
- Add `discoverRegistry()` for well-known service discovery
- Split `RegistryConfig` into `LocalRegistryConfig` and `RemoteRegistryConfig`
- `createRegistry()` now supports both local and remote modes

## ARP Package

- `RxrTransport` now auto-creates Registry based on domain:
  - `localhost` domain: Uses LocalRegistry (filesystem)
  - Other domains: Uses RemoteRegistry with well-known discovery
- Add `clearRegistryCache()` for testing
- ARP now depends on registry package

## Core Package

- Remove unused dependency on ARP package

This completes Phase 2 and Phase 3 of the remote registry support plan.
See issues/015-registry-remote-support.md for details.
