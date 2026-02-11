# @resourcexjs/arp

## 2.7.0

## 2.6.0

## 2.5.7

## 2.5.6

## 2.5.5

## 2.5.4

## 2.5.3

## 2.5.2

## 2.5.1

## 2.5.0

## 2.4.1

## 2.4.0

## 2.3.0

## 2.2.0

## 2.1.1

## 2.1.0

### Minor Changes

- f52e49c: feat(arp): add list and mkdir operations to Transport interface
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

- 055ff6a: refactor: move RxrTransport from arp to main package

  **Breaking Change for `@resourcexjs/arp` users:**

  RxrTransport is no longer exported from `@resourcexjs/arp`. Use `resourcexjs/arp` instead.

  **Before:**

  ```typescript
  import { createARP, RxrTransport } from "@resourcexjs/arp";
  ```

  **After:**

  ```typescript
  import { createARP, RxrTransport } from "resourcexjs/arp";
  ```

  **What changed:**
  - `@resourcexjs/arp` now only includes standard protocols (file, http, https)
  - `resourcexjs/arp` provides an enhanced `createARP()` that auto-registers RxrTransport
  - This resolves the circular dependency between arp and registry packages

  **Benefits:**
  - `@resourcexjs/arp` has no dependencies (can be used standalone)
  - Registry can now use ARP for I/O without circular dependencies
  - Main package provides complete ResourceX integration

## 2.0.0

### Patch Changes

- aaeb9d2: feat(registry): add GitRegistry with domain security
  - Add GitRegistry for git-based remote registries
  - Security: remote URLs require domain binding to prevent impersonation
  - Well-known format updated to use `registries` array (for future fallback support)
  - `discoverRegistry()` now returns `DiscoveryResult` with domain binding
  - RxrTransport auto-creates GitRegistry for git URLs with domain binding
  - Local paths don't require domain (development use)

- Updated dependencies [aaeb9d2]
- Updated dependencies [4cd6fc8]
  - @resourcexjs/registry@2.0.0

## 1.7.0

### Minor Changes

- 1408238: feat: add RemoteRegistry and auto-create Registry support

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

- d1a5f15: feat: add RxrTransport and Registry.get()
  - Add `Registry.get(locator)` method to retrieve raw RXR without resolving
  - Add `RxrTransport` class for accessing files inside resources via ARP protocol
  - Format: `arp:{semantic}:rxr://{rxl}/{internal-path}`
  - Example: `arp:text:rxr://localhost/hello.text@1.0.0/content`

  Note: RxrTransport currently requires manual registration with a Registry instance.
  Future work will add HTTP protocol support for automatic remote access (see issues/004-registry-http-protocol.md).

### Patch Changes

- Updated dependencies [ad3b2ac]
- Updated dependencies [1408238]
- Updated dependencies [d1a5f15]
  - @resourcexjs/registry@1.7.0

## 1.6.0

## 1.5.0

## 1.4.0

## 1.3.0

## 1.2.0

### Minor Changes

- df801f8: feat: redesign transport interface and add registry search

  **Transport Interface Redesign:**
  - Simplified from 7 methods to 4: `get`, `set`, `exists`, `delete`
  - Added `TransportParams` for runtime parameters
  - Added `TransportResult` with metadata (type, size, modifiedAt)
  - FileTransport: supports directory listing with `recursive` and `pattern` params
  - HttpTransport: merges URL query params with runtime params

  **Registry Search:**
  - Added `search(options?)` method to Registry interface
  - Supports `query`, `limit`, and `offset` options
  - Returns matching RXL locators from local registry

  **ARL Updates:**
  - `resolve(params?)` and `deposit(data, params?)` now accept optional params
  - Params are passed through to transport layer

## 1.1.0

## 1.0.0

## 0.9.0

## 0.8.1

## 0.8.0

## 0.7.1

### Patch Changes

- b277bf1: Test patch release
