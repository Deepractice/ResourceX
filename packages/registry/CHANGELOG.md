# @resourcexjs/registry

## 2.5.4

### Patch Changes

- @resourcexjs/core@2.5.4
- @resourcexjs/loader@2.5.4
- @resourcexjs/storage@2.5.4

## 2.5.3

### Patch Changes

- @resourcexjs/core@2.5.3
- @resourcexjs/loader@2.5.3
- @resourcexjs/storage@2.5.3

## 2.5.2

### Patch Changes

- @resourcexjs/core@2.5.2
- @resourcexjs/loader@2.5.2
- @resourcexjs/storage@2.5.2

## 2.5.1

### Patch Changes

- @resourcexjs/core@2.5.1
- @resourcexjs/loader@2.5.1
- @resourcexjs/storage@2.5.1

## 2.5.0

### Patch Changes

- 496c70a: ## resourcexjs

  Simplified API that hides internal objects. Users now interact only with:
  - `path`: local directory (for add, push, link)
  - `locator`: resource identifier string (e.g., "hello.text@1.0.0")

  ### New Features
  - `domain` config for default domain (default: "localhost")
  - `registry` config for central registry URL
  - Locator normalization: short locators use default domain

  ### API Changes
  - `push(path)` - push directory to remote registry (renamed from publish)
  - `pull(locator)` - pull from remote to local cache
  - Removed old `push(locator)` method
  - Hidden internal objects (RXR, RXL, RXM, RXA) from public exports

  ## @resourcexjs/protocol

  Rewrote HTTP API protocol with RESTful endpoints:
  - `POST /publish` - publish resource (multipart form data)
  - `GET /resource/{locator}` - get manifest
  - `HEAD /resource/{locator}` - check existence
  - `DELETE /resource/{locator}` - delete resource
  - `GET /content/{locator}` - get content
  - `GET /search?q=xxx` - search resources

  Client uses push/pull (user perspective), Server uses publish (registry perspective).

- Updated dependencies [496c70a]
  - @resourcexjs/loader@2.5.0
  - @resourcexjs/core@2.5.0

## 2.4.1

### Patch Changes

- @resourcexjs/core@2.4.1
- @resourcexjs/type@2.4.1
- @resourcexjs/loader@2.4.1
- @resourcexjs/arp@2.4.1

## 2.4.0

### Minor Changes

- 8669eb7: feat: introduce BundledType for sandbox-compatible execution

  Breaking changes:
  - `ResourceType.resolver` closure replaced with `BundledType.code` string
  - `textType`, `jsonType`, `binaryType` are now BundledType (pre-bundled)
  - `Registry.supportType()` now accepts BundledType instead of ResourceType
  - `TypeHandlerChain.register()` now accepts BundledType

  New exports:
  - `BundledType` interface - pre-bundled type with code string
  - `SandboxType` - "none" | "isolated" | "container"
  - `bundleResourceType()` - bundle custom types from source files

  Migration:

  ```typescript
  // Before (closure-based)
  const customType: ResourceType = {
    name: "custom",
    resolver: {
      schema: undefined,
      async resolve(rxr) { ... }
    }
  };

  // After (code string)
  const customType: BundledType = {
    name: "custom",
    description: "Custom type",
    code: `({ async resolve(rxr) { ... } })`,
    sandbox: "none"
  };
  ```

- 7a46fbf: refactor: remove serializer from ResourceType, unify storage format

  **Breaking Changes:**
  - Removed `ResourceSerializer` interface from `@resourcexjs/type`
  - Removed `serializer` field from `ResourceType` interface
  - Removed `serialize()` and `deserialize()` methods from `TypeHandlerChain`

  **Migration:**

  If you have custom resource types with serializers, remove the `serializer` field:

  ```typescript
  // Before
  const customType: ResourceType = {
    name: "custom",
    description: "Custom type",
    serializer: customSerializer, // Remove this
    resolver: customResolver,
  };

  // After
  const customType: ResourceType = {
    name: "custom",
    description: "Custom type",
    resolver: customResolver,
  };
  ```

  **Internal Changes:**
  - Registry now uses unified storage format (manifest.json + archive.tar.gz)
  - Storage/retrieval uses `archive.buffer()` directly instead of type-specific serialization
  - Type validation happens at `add()` time via `typeHandler.canHandle()`

- f9e6bdf: feat: implement sandbox execution architecture
  - Add ResolverExecutor for executing bundled code in SandboX
  - Add ResolveContext type for sandbox-safe data passing
  - Update TypeHandlerChain to only manage types (no execution)
  - Bundle builtin types with real ESM code via Bun.build
  - Support both ESM bundled and legacy object literal code formats
  - Add srt isolator support with configurable isolation levels
  - Add isolator tests for text, json, and custom types

### Patch Changes

- Updated dependencies [8669eb7]
- Updated dependencies [7a46fbf]
- Updated dependencies [f9e6bdf]
  - @resourcexjs/type@2.4.0
  - @resourcexjs/core@2.4.0
  - @resourcexjs/loader@2.4.0
  - @resourcexjs/arp@2.4.0

## 2.3.0

### Minor Changes

- 724d783: feat(registry): add GitHubRegistry using tarball download
  - Add `GitHubRegistry` class that downloads GitHub repository tarball instead of git clone
  - Faster than `GitRegistry` (isomorphic-git) for read-only access
  - Support `https://github.com/owner/repo` URL format in well-known discovery
  - Add `parseGitHubUrl()` and `isGitHubUrl()` utilities
  - Update well-known worker to return GitHub URL as primary registry

### Patch Changes

- 9138ad5: refactor(core): replace RXC with RXA/RXP architecture
  - Add RXA (Archive) interface for tar.gz storage/transfer
  - Add RXP (Package) interface for runtime file access
  - Update RXR interface: content → archive
  - Rename storage file: content.tar.gz → archive.tar.gz

- Updated dependencies [9138ad5]
  - @resourcexjs/core@2.3.0
  - @resourcexjs/type@2.3.0
  - @resourcexjs/loader@2.3.0
  - @resourcexjs/arp@2.3.0

## 2.2.0

### Minor Changes

- 6790bb0: Refactor Registry API: rename link() to add(), add new link() for symlinks

  **Breaking Changes:**
  - `link(resource: RXR)` renamed to `add(source: string | RXR)`
  - New `link(path: string)` creates symlink to development directory
  - `publish(source: string | RXR, options)` now accepts path or RXR

  **New Features:**
  - `link(path)` - Symlink to dev directory, changes reflect immediately
  - `add(source)` - Copy to local registry (supports path or RXR object)
  - `publish(source, options)` - Publish to remote (supports path or RXR object)

  **Migration:**

  ```typescript
  // Before
  await registry.link(rxr);

  // After
  await registry.add(rxr);
  // Or from directory
  await registry.add("./my-resource");

  // New: symlink for live development
  await registry.link("./my-resource");
  ```

### Patch Changes

- @resourcexjs/core@2.2.0
- @resourcexjs/type@2.2.0
- @resourcexjs/loader@2.2.0
- @resourcexjs/arp@2.2.0

## 2.1.1

### Patch Changes

- bd97ee1: Replace execSync git commands with isomorphic-git
  - Use isomorphic-git for clone/fetch operations (no system git required)
  - Add retry mechanism with exponential backoff for transient network errors
  - Properly handle local paths vs remote URLs
  - @resourcexjs/core@2.1.1
  - @resourcexjs/type@2.1.1
  - @resourcexjs/arp@2.1.1

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

### Patch Changes

- Updated dependencies [f52e49c]
- Updated dependencies [055ff6a]
  - @resourcexjs/arp@2.1.0
  - @resourcexjs/core@2.1.0
  - @resourcexjs/type@2.1.0

## 2.0.0

### Major Changes

- 4cd6fc8: BREAKING CHANGE: Separate local and cache storage directories

  ## Storage Structure Changed

  **Old:**

  ```
  ~/.resourcex/
  └── {domain}/{path}/{name}.{type}/{version}/
  ```

  **New:**

  ```
  ~/.resourcex/
  ├── local/                     # Development resources
  │   └── {name}.{type}/{version}/
  │
  └── cache/                     # Remote cached resources
      └── {domain}/{path}/{name}.{type}/{version}/
  ```

  ## Migration

  Delete `~/.resourcex` and re-link/pull resources:

  ```bash
  rm -rf ~/.resourcex
  ```

  ## New API
  - `registry.pull(locator)` - Pull resource from remote to local cache (TODO)
  - `registry.publish(rxr, options)` - Publish to remote registry (TODO)

  ## Resolution Order
  1. **local/** is checked first (development resources)
  2. **cache/** is checked second (remote cached resources)

### Minor Changes

- aaeb9d2: feat(registry): add GitRegistry with domain security
  - Add GitRegistry for git-based remote registries
  - Security: remote URLs require domain binding to prevent impersonation
  - Well-known format updated to use `registries` array (for future fallback support)
  - `discoverRegistry()` now returns `DiscoveryResult` with domain binding
  - RxrTransport auto-creates GitRegistry for git URLs with domain binding
  - Local paths don't require domain (development use)

### Patch Changes

- @resourcexjs/core@2.0.0
- @resourcexjs/type@2.0.0

## 1.7.0

### Minor Changes

- ad3b2ac: refactor: replace ARPRegistry with LocalRegistry
  - Registry no longer depends on ARP package
  - Uses Node.js `fs` module directly for local storage
  - Exported class renamed: `ARPRegistry` → `LocalRegistry`
  - `createRegistry()` API remains unchanged

  This is Phase 1 of the remote registry support plan (see issues/015-registry-remote-support.md).
  Breaking change: Direct imports of `ARPRegistry` need to be updated to `LocalRegistry`.

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

- Updated dependencies [1408238]
  - @resourcexjs/core@1.7.0
  - @resourcexjs/type@1.7.0

## 1.6.0

### Minor Changes

- d88f26c: refactor: version as subdirectory, content.tar.gz extension

  Storage structure change:
  - Old: `{domain}/{name}.{type}@{version}/content`
  - New: `{domain}/{name}.{type}/{version}/content.tar.gz`

### Patch Changes

- @resourcexjs/core@1.6.0
- @resourcexjs/type@1.6.0
- @resourcexjs/arp@1.6.0

## 1.5.0

### Minor Changes

- 3226956: refactor: Registry owns TypeHandlerChain, resolve returns ResolvedResource

  Breaking changes:
  - `Registry.resolve()` now returns `ResolvedResource` instead of `RXR`
  - Removed `globalTypeHandlerChain` export

  New features:
  - `Registry.supportType(type)` for dynamic type registration
  - `ResolvedResource.resource` contains original RXR
  - `TypeHandlerChain.create()` static factory method

  This refactor solves the bundling issue where singleton pattern failed after bundling, causing type registration to go to a different instance than the one used for resolution.

### Patch Changes

- Updated dependencies [3226956]
  - @resourcexjs/type@1.5.0
  - @resourcexjs/core@1.5.0
  - @resourcexjs/arp@1.5.0

## 1.4.0

### Patch Changes

- Updated dependencies [9ef743c]
  - @resourcexjs/type@1.4.0
  - @resourcexjs/core@1.4.0
  - @resourcexjs/arp@1.4.0

## 1.3.0

### Patch Changes

- Updated dependencies [12a13aa]
  - @resourcexjs/type@1.3.0
  - @resourcexjs/core@1.3.0
  - @resourcexjs/arp@1.3.0

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

### Patch Changes

- Updated dependencies [df801f8]
  - @resourcexjs/arp@1.2.0
  - @resourcexjs/core@1.2.0
  - @resourcexjs/type@1.2.0

## 1.1.0

### Minor Changes

- 7862a52: feat: RXC archive format - multi-file resource support

  **Breaking Changes:**
  - `createRXC` now accepts a files record instead of string/Buffer/Stream
  - `createRXC` is now async (returns `Promise<RXC>`)
  - Removed `loadRXC` function (use `loadResource` instead)
  - Removed `rxc.text()` and `rxc.json()` methods

  **New API:**

  ```typescript
  // Create from files
  await createRXC({ content: "Hello" }); // single file
  await createRXC({ "a.ts": "...", "b.css": "..." }); // multi-file
  await createRXC({ archive: tarGzBuffer }); // from archive

  // Read files
  await rxc.file("content"); // single file → Buffer
  await rxc.files(); // all files → Map<string, Buffer>
  await rxc.buffer(); // raw tar.gz → Buffer
  ```

  **FolderLoader improvements:**
  - No longer requires `content` file name
  - Supports any file names and nested directories
  - All files (except `resource.json`) are packaged into RXC

  **Internal:**
  - RXC now stores content as tar.gz archive internally
  - Uses `modern-tar` for tar packaging

### Patch Changes

- Updated dependencies [7862a52]
  - @resourcexjs/core@1.1.0
  - @resourcexjs/type@1.1.0
  - @resourcexjs/arp@1.1.0

## 1.0.0

### Major Changes

- 355851c: **BREAKING CHANGE**: Refactor package structure - separate type system and loader into dedicated packages

  ## New Packages
  - `@resourcexjs/type` - Type system with global singleton TypeHandlerChain
  - `@resourcexjs/loader` - Resource loading from various sources

  ## Breaking Changes

  ### Removed APIs
  - `defineResourceType()` - **REMOVED** (use `globalTypeHandlerChain.register()` or pass types to `createRegistry()`)
  - `getResourceType()` - **REMOVED**
  - `clearResourceTypes()` - **REMOVED** (use `globalTypeHandlerChain.clearExtensions()` for testing)
  - `createTypeHandlerChain()` - **REMOVED** (use global singleton `globalTypeHandlerChain`)

  ### New APIs

  ```typescript
  import { globalTypeHandlerChain } from "@resourcexjs/type";

  // Register extension types (advanced usage)
  globalTypeHandlerChain.register(customType);

  // Query supported types
  globalTypeHandlerChain.canHandle("text");
  globalTypeHandlerChain.getSupportedTypes();

  // Or pass types when creating registry (recommended)
  const registry = createRegistry({
    types: [promptType, toolType],
  });
  ```

  ### Type System Changes
  - TypeHandlerChain is now a **global singleton**
  - Builtin types (text, json, binary) are automatically registered
  - Extension types are registered globally via `globalTypeHandlerChain.register()` or `createRegistry({ types })`
  - All registries share the same type handler chain

  ### Package Structure

  ```
  @resourcexjs/core       → RXL, RXM, RXC, RXR (data structures)
  @resourcexjs/type       → Type system (NEW)
  @resourcexjs/loader     → Resource loading (NEW)
  @resourcexjs/registry   → Resource storage
  @resourcexjs/arp        → I/O protocol
  resourcexjs             → Main package (re-exports all)
  ```

  ### Migration Guide

  **Before:**

  ```typescript
  import { defineResourceType, createRegistry } from "resourcexjs";

  defineResourceType(promptType); // Global registration
  const registry = createRegistry();
  ```

  **After:**

  ```typescript
  import { createRegistry } from "resourcexjs";

  // Option 1: Pass types to registry (recommended)
  const registry = createRegistry({ types: [promptType] });

  // Option 2: Register globally (advanced)
  import { globalTypeHandlerChain } from "resourcexjs";
  globalTypeHandlerChain.register(promptType);
  ```

  Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>

### Patch Changes

- Updated dependencies [355851c]
  - @resourcexjs/core@1.0.0
  - @resourcexjs/type@1.0.0
  - @resourcexjs/arp@1.0.0

## 0.9.0

### Patch Changes

- Updated dependencies [4d31790]
  - @resourcexjs/core@0.9.0
  - @resourcexjs/arp@0.9.0

## 0.8.1

### Patch Changes

- 3508c58: fix: always include builtinTypes in registry

  Previously, passing custom `types` to `createRegistry()` would override builtinTypes instead of extending them. Now builtinTypes (text, json, binary) are always included, and custom types are appended.

  ```typescript
  // Before: builtinTypes were replaced
  createRegistry({ types: [customType] }); // Only customType, no text/json/binary!

  // After: builtinTypes + custom types
  createRegistry({ types: [customType] }); // text, json, binary + customType
  ```

  - @resourcexjs/core@0.8.1
  - @resourcexjs/arp@0.8.1

## 0.8.0

### Patch Changes

- @resourcexjs/core@0.8.0
- @resourcexjs/arp@0.8.0

## 0.7.1

### Patch Changes

- b277bf1: Test patch release
- Updated dependencies [b277bf1]
  - @resourcexjs/core@0.7.1
  - @resourcexjs/arp@0.7.1

## 0.7.0

### Minor Changes

- a31ad63: Implement ResourceType system and Registry
  - Add ResourceType system with serializer/resolver and type aliases
  - Add @resourcexjs/registry package with ARPRegistry implementation
  - Add TypeHandlerChain for responsibility chain pattern
  - Add built-in types: text (txt, plaintext), json (config, manifest), binary (bin, blob, raw)
  - Remove @resourcexjs/cli package (functionality moved to AgentVM)
  - Remove RXM resolver field (type determines everything)
  - ARP now auto-registers default handlers

  Breaking changes:
  - Remove @resourcexjs/cli package
  - Remove resolver field from RXM manifest

### Patch Changes

- Updated dependencies [a31ad63]
  - @resourcexjs/core@0.7.0
