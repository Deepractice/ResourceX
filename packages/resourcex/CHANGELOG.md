# resourcexjs

## 2.12.0

### Patch Changes

- @resourcexjs/core@2.12.0
- @resourcexjs/arp@2.12.0

## 2.11.0

### Minor Changes

- 2b95255: feat: auto-resolve registry from config and support runtime override

  - Provider SPI: add optional `getDefaults()` method for platform-specific config resolution
  - NodeProvider: implement `getDefaults()` — reads `RESOURCEX_REGISTRY` env var and `config.json`
  - `createResourceX()`: auto-resolves registry from provider defaults when not explicitly provided
  - `push()`/`pull()`: accept optional `{ registry }` parameter for per-operation override
  - CLI: rename env vars to `RESOURCEX_REGISTRY`/`RESOURCEX_HOME` (old `RX_*` kept for backward compat)

### Patch Changes

- Updated dependencies [2b95255]
  - @resourcexjs/core@2.11.0
  - @resourcexjs/arp@2.11.0

## 2.10.0

### Minor Changes

- c197c52: Rename RXL to RXI (identifier) and introduce RXL as unified locator type
  - `interface RXL` renamed to `interface RXI` (ResourceX Identifier)
  - `RXR.locator` renamed to `RXR.identifier`
  - New `type RXL = string` as unified locator (RXI string, directory path, or URL)
  - `parse()` returns `RXI`, `format()` accepts `RXI`, `locate()` returns `RXI`
  - Registry interfaces updated to use `RXI` parameter names

### Patch Changes

- Updated dependencies [c197c52]
  - @resourcexjs/core@2.10.0
  - @resourcexjs/arp@2.10.0

## 2.9.0

### Minor Changes

- 8884adf: feat: restructure RXM as definition/archive/source context

  BREAKING CHANGE: RXM and Resource interfaces restructured from flat to nested.

  - RXM now has three sections: `definition`, `archive`, `source`
  - `definition` includes metadata from RXD: description, author, license, keywords, repository
  - `source.files` is a structured FileTree with sizes (replaces flat string array)
  - `source.preview` provides first 500 chars of primary content file
  - `archive` is an empty placeholder for future packaging metadata (digest, md5)
  - All field access changes from `manifest.name` to `manifest.definition.name`
  - StoredRXM now persists extended definition fields
  - CLI and MCP info commands show structured file tree with sizes and preview

### Patch Changes

- Updated dependencies [8884adf]
  - @resourcexjs/core@2.9.0
  - @resourcexjs/arp@2.9.0

## 2.8.0

### Minor Changes

- adece0b: feat: add auto-detection pipeline, SourceLoaderChain, and API redesign
  - Add RXS intermediate type for raw file representation
  - Add TypeDetector interface and TypeDetectorChain (Chain of Responsibility)
  - Add built-in detectors: ResourceJsonDetector, SkillDetector
  - Add SourceLoader interface and SourceLoaderChain (Chain of Responsibility)
  - Add built-in loaders: FolderSourceLoader, GitHubSourceLoader
  - Add resolveSource() pipeline: load → detect → generate RXD → archive → RXR
  - Split ResourceX API: resolve(locator) + ingest(source) replacing use()
  - Flatten public API: resolve/ingest return T directly (Executable internalized)
  - Rename CLI command and MCP tool from "use" to "ingest"
  - Auto-detect resource type from file patterns (no resource.json required)
  - Support GitHub URLs as source via GitHubSourceLoader

### Patch Changes

- Updated dependencies [89233d7]
- Updated dependencies [adece0b]
  - @resourcexjs/core@2.8.0
  - @resourcexjs/arp@2.8.0

## 2.7.0

### Patch Changes

- @resourcexjs/core@2.7.0
- @resourcexjs/arp@2.7.0

## 2.6.0

### Patch Changes

- Updated dependencies [1f7cf72]
  - @resourcexjs/core@2.6.0
  - @resourcexjs/arp@2.6.0

## 2.5.7

### Patch Changes

- 4a866e0: fix(resourcex): add filename to FormData Blob for multipart upload

  Some servers require filename in multipart form uploads. Added explicit filenames
  to manifest.json and archive.tar.gz when publishing to registry.

- b4684d2: fix: add filename to FormData blob when publishing to registry

  FormData.append() without filename causes some environments to return string instead of File object, leading to "Missing manifest file" error on server side.

  - @resourcexjs/core@2.5.7
  - @resourcexjs/arp@2.5.7

## 2.5.6

### Patch Changes

- 3c43d76: docs: update documentation for Provider architecture

  - Update all READMEs to reflect new Provider pattern
  - Add setProvider() requirement in examples
  - Update storage layout documentation to CAS structure
  - Remove references to deleted packages (storage, registry, loader, type)
  - Add node-provider package documentation
  - Update CLAUDE.md with current architecture

- Updated dependencies [3c43d76]
  - @resourcexjs/core@2.5.6
  - @resourcexjs/arp@2.5.6

## 2.5.5

### Patch Changes

- 49e3d04: fix: use correct 'tag' field name in publish manifest
  - @resourcexjs/core@2.5.5
  - @resourcexjs/type@2.5.5
  - @resourcexjs/loader@2.5.5
  - @resourcexjs/arp@2.5.5
  - @resourcexjs/registry@2.5.5
  - @resourcexjs/storage@2.5.5

## 2.5.4

### Patch Changes

- @resourcexjs/core@2.5.4
- @resourcexjs/type@2.5.4
- @resourcexjs/loader@2.5.4
- @resourcexjs/arp@2.5.4
- @resourcexjs/registry@2.5.4
- @resourcexjs/storage@2.5.4

## 2.5.3

### Patch Changes

- @resourcexjs/core@2.5.3
- @resourcexjs/type@2.5.3
- @resourcexjs/loader@2.5.3
- @resourcexjs/arp@2.5.3
- @resourcexjs/registry@2.5.3
- @resourcexjs/storage@2.5.3

## 2.5.2

### Patch Changes

- @resourcexjs/core@2.5.2
- @resourcexjs/type@2.5.2
- @resourcexjs/loader@2.5.2
- @resourcexjs/arp@2.5.2
- @resourcexjs/registry@2.5.2
- @resourcexjs/storage@2.5.2

## 2.5.1

### Patch Changes

- 74629d7: docs: restructure documentation with Divio system
  - Remove old docs/ directory
  - Add new docs structure: tutorials, guides, reference, concepts
  - Add documentation TOC to main README
  - Fix CLI type errors (version → tag, add bun-types)
  - @resourcexjs/core@2.5.1
  - @resourcexjs/type@2.5.1
  - @resourcexjs/loader@2.5.1
  - @resourcexjs/arp@2.5.1
  - @resourcexjs/registry@2.5.1
  - @resourcexjs/storage@2.5.1

## 2.5.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [496c70a]
  - @resourcexjs/registry@2.5.0
  - @resourcexjs/loader@2.5.0
  - @resourcexjs/core@2.5.0
  - @resourcexjs/type@2.5.0
  - @resourcexjs/arp@2.5.0

## 2.4.1

### Patch Changes

- @resourcexjs/core@2.4.1
- @resourcexjs/type@2.4.1
- @resourcexjs/loader@2.4.1
- @resourcexjs/arp@2.4.1
- @resourcexjs/registry@2.4.1

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
  - @resourcexjs/registry@2.4.0
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

- 9138ad5: refactor(core): replace RXC with RXA/RXP architecture
  - Add RXA (Archive) interface for tar.gz storage/transfer
  - Add RXP (Package) interface for runtime file access
  - Update RXR interface: content → archive
  - Rename storage file: content.tar.gz → archive.tar.gz

### Patch Changes

- Updated dependencies [724d783]
- Updated dependencies [9138ad5]
  - @resourcexjs/registry@2.3.0
  - @resourcexjs/core@2.3.0
  - @resourcexjs/type@2.3.0
  - @resourcexjs/loader@2.3.0
  - @resourcexjs/arp@2.3.0

## 2.2.0

### Patch Changes

- Updated dependencies [6790bb0]
  - @resourcexjs/registry@2.2.0
  - @resourcexjs/core@2.2.0
  - @resourcexjs/type@2.2.0
  - @resourcexjs/loader@2.2.0
  - @resourcexjs/arp@2.2.0

## 2.1.1

### Patch Changes

- Updated dependencies [bd97ee1]
  - @resourcexjs/registry@2.1.1
  - @resourcexjs/core@2.1.1
  - @resourcexjs/type@2.1.1
  - @resourcexjs/loader@2.1.1
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

### Patch Changes

- Updated dependencies [f52e49c]
- Updated dependencies [055ff6a]
  - @resourcexjs/arp@2.1.0
  - @resourcexjs/registry@2.1.0
  - @resourcexjs/core@2.1.0
  - @resourcexjs/type@2.1.0
  - @resourcexjs/loader@2.1.0

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

- Updated dependencies [aaeb9d2]
- Updated dependencies [4cd6fc8]
  - @resourcexjs/registry@2.0.0
  - @resourcexjs/arp@2.0.0
  - @resourcexjs/core@2.0.0
  - @resourcexjs/type@2.0.0
  - @resourcexjs/loader@2.0.0

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

### Patch Changes

- Updated dependencies [ad3b2ac]
- Updated dependencies [1408238]
- Updated dependencies [d1a5f15]
  - @resourcexjs/registry@1.7.0
  - @resourcexjs/arp@1.7.0
  - @resourcexjs/core@1.7.0
  - @resourcexjs/loader@1.7.0
  - @resourcexjs/type@1.7.0

## 1.6.0

### Patch Changes

- Updated dependencies [d88f26c]
  - @resourcexjs/registry@1.6.0
  - @resourcexjs/core@1.6.0
  - @resourcexjs/type@1.6.0
  - @resourcexjs/loader@1.6.0
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
  - @resourcexjs/registry@1.5.0
  - @resourcexjs/core@1.5.0
  - @resourcexjs/loader@1.5.0
  - @resourcexjs/arp@1.5.0

## 1.4.0

### Minor Changes

- 9ef743c: feat: add schema support to resolver with structured result object

  **Breaking Change**: `ResolvedResource` is now a structured object instead of a function.

  **Before:**

  ```typescript
  const fn = await typeChain.resolve(rxr);
  const content = await fn();
  ```

  **After:**

  ```typescript
  const result = await typeChain.resolve(rxr);
  const content = await result.execute();
  const schema = result.schema; // JSON Schema for UI form rendering
  ```

  **New Features:**

  - `ResolvedResource` returns structured object with `execute` and `schema`
  - `ResourceResolver` requires `schema` field (undefined for void args, JSONSchema for typed args)
  - Added `JSONSchema` and `JSONSchemaProperty` types for schema definition
  - UI can use `result.schema` to render parameter forms

  **Type Definitions:**

  ```typescript
  interface ResolvedResource<TArgs, TResult> {
    execute: (args?: TArgs) => TResult | Promise<TResult>;
    schema: TArgs extends void ? undefined : JSONSchema;
  }

  interface ResourceResolver<TArgs, TResult> {
    schema: TArgs extends void ? undefined : JSONSchema;
    resolve(rxr: RXR): Promise<ResolvedResource<TArgs, TResult>>;
  }
  ```

  **Built-in types** (text/json/binary) have `schema: undefined` since they take no arguments.

### Patch Changes

- Updated dependencies [9ef743c]
  - @resourcexjs/type@1.4.0
  - @resourcexjs/registry@1.4.0
  - @resourcexjs/core@1.4.0
  - @resourcexjs/loader@1.4.0
  - @resourcexjs/arp@1.4.0

## 1.3.0

### Minor Changes

- 12a13aa: feat: redesign resolver to return callable functions

  **Breaking Change**: `ResourceResolver.resolve()` now returns a callable function instead of a value.

  **Before:**

  ```typescript
  const content = await typeChain.resolve<string>(rxr);
  // content is already loaded
  ```

  **After:**

  ```typescript
  const fn = await typeChain.resolve<void, string>(rxr);
  const content = await fn(); // lazy load
  ```

  **Benefits:**

  - Lazy loading: content is only read when the function is called
  - Parameterized execution: custom types can accept arguments (e.g., tools)
  - Unified interface: all types return functions

  **Type Changes:**

  - `ResolvedResource<TArgs, TResult>` - callable function type
  - `ResourceResolver<TArgs, TResult>` - resolve returns ResolvedResource
  - `ResourceType<TArgs, TResult>` - type definition with generics

  **Built-in types now return:**

  - text: `() => Promise<string>`
  - json: `() => Promise<unknown>`
  - binary: `() => Promise<Buffer>`

### Patch Changes

- Updated dependencies [12a13aa]
  - @resourcexjs/type@1.3.0
  - @resourcexjs/registry@1.3.0
  - @resourcexjs/core@1.3.0
  - @resourcexjs/loader@1.3.0
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
  - @resourcexjs/registry@1.2.0
  - @resourcexjs/core@1.2.0
  - @resourcexjs/loader@1.2.0
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
  - @resourcexjs/loader@1.1.0
  - @resourcexjs/type@1.1.0
  - @resourcexjs/registry@1.1.0
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
  - @resourcexjs/loader@1.0.0
  - @resourcexjs/registry@1.0.0
  - @resourcexjs/arp@1.0.0

## 0.9.0

### Minor Changes

- 4d31790: feat: add loadResource API for loading resources from folders

  Added `loadResource()` function with pluggable loader architecture to easily load resources from different sources:

  - **ResourceLoader interface**: Strategy pattern for custom loaders
  - **FolderLoader**: Default implementation for loading from folders
  - **loadResource()**: Main API with support for custom loaders

  **Folder structure:**

  ```
  my-resource/
  ├── resource.json    # { name, type, version, domain?, path? }
  └── content          # Resource content
  ```

  **Usage:**

  ```typescript
  import { loadResource, createRegistry } from "resourcexjs";

  // Load from folder
  const rxr = await loadResource("./my-resource");

  // Link to registry
  const registry = createRegistry();
  await registry.link(rxr);

  // Custom loader support
  const rxr = await loadResource("resource.zip", {
    loader: new ZipLoader(),
  });
  ```

  **Breaking changes:**

  - BDD tests now only depend on `resourcexjs` package (removed `@resourcexjs/core` and `@resourcexjs/registry` dependencies)

### Patch Changes

- Updated dependencies [4d31790]
  - @resourcexjs/core@0.9.0
  - @resourcexjs/registry@0.9.0
  - @resourcexjs/arp@0.9.0

## 0.8.1

### Patch Changes

- Updated dependencies [3508c58]
  - @resourcexjs/registry@0.8.1
  - @resourcexjs/core@0.8.1
  - @resourcexjs/arp@0.8.1

## 0.8.0

### Minor Changes

- 0727b7b: Add missing exports to main package
  - Export RXR, ResourceType, ResourceSerializer, ResourceResolver types
  - Export defineResourceType, getResourceType, clearResourceTypes functions
  - Export textType, jsonType, binaryType, builtinTypes
  - Export TypeHandlerChain, createTypeHandlerChain
  - Export Registry, RegistryConfig, createRegistry, ARPRegistry from registry
  - Export ResourceTypeError, RegistryError errors

### Patch Changes

- @resourcexjs/core@0.8.0
- @resourcexjs/arp@0.8.0
- @resourcexjs/registry@0.8.0

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

## 0.5.0

### Minor Changes

- 5577d4c: Rename deepractice transport to agentvm:

  - Rename `deepracticeHandler` to `agentvmHandler`
  - Rename `DeepracticeConfig` to `AgentVMConfig`
  - Change directory from `~/.deepractice/` to `~/.agentvm/`
  - Update all URLs from `deepractice://` to `agentvm://`
  - Align with AgentVM product naming

  **Note**: `deepractice` name is reserved for future cloud platform transport.

### Patch Changes

- Updated dependencies [5577d4c]
  - @resourcexjs/core@0.5.0

## 0.4.0

### Minor Changes

- 2ca58a0: Add built-in Deepractice transport for ecosystem local storage:

  - Add `deepracticeHandler(config?)` factory function
  - Maps `deepractice://path` to `~/.deepractice/path`
  - Configurable `parentDir` for testing and custom installations
  - Full capabilities: read/write/list/delete/exists/stat

- 1f1df8d: Add URL prefix alias support:
  - Support `@` as shorthand alias (default)
  - Standard `arp:` prefix always supported
  - Configurable via `alias` config option
  - Examples: `@text:file://...`, `@sandbox://...`

### Patch Changes

- Updated dependencies [2ca58a0]
  - @resourcexjs/core@0.4.0

## 0.3.0

### Minor Changes

- a11ac9a: Remove runtime register methods, unify to config-only approach:
  - Remove `rx.registerTransport()` / `rx.registerSemantic()` methods
  - Remove `rx.getTransport()` / `rx.getSemantic()` helper methods
  - All customization now via `createResourceX()` config only
  - Update documentation to reflect config-only approach

### Patch Changes

- @resourcexjs/core@0.3.0

## 0.2.0

### Minor Changes

- 5be5743: Add binary semantic handler and resource definition support:
  - **Binary Semantic**: Handle raw binary resources (Buffer, Uint8Array, ArrayBuffer, number[])
  - **Resource Definition**: Define custom URL shortcuts via config
    - `createResourceX({ resources: [{ name, semantic, transport, basePath }] })`
    - Use `name://location` instead of full ARP URL
  - Use local HTTP server for network tests (improved CI stability)

### Patch Changes

- Updated dependencies [5be5743]
  - @resourcexjs/core@0.2.0

## 0.1.0

### Minor Changes

- bcbc247: feat: add deposit capability and refactor architecture

  ## New Features

  - **deposit**: Store resources using `rx.deposit(url, data)`
  - **exists**: Check if resource exists using `rx.exists(url)`
  - **delete**: Delete resource using `rx.delete(url)`

  ## Architecture Changes

  ### Transport Handler (I/O Primitives)

  Transport now provides low-level I/O primitives instead of just `fetch`:

  ```typescript
  interface TransportHandler {
    name: string;
    capabilities: TransportCapabilities;
    read(location): Promise<Buffer>;
    write?(location, content): Promise<void>;
    list?(location): Promise<string[]>;
    exists?(location): Promise<boolean>;
    delete?(location): Promise<void>;
    stat?(location): Promise<ResourceStat>;
  }
  ```

  ### Semantic Handler (Resource Orchestration)

  Semantic now orchestrates Transport primitives to handle resource structure:

  ```typescript
  interface SemanticHandler<T> {
    name: string;
    resolve(transport, location, context): Promise<Resource<T>>;
    deposit?(transport, location, data, context): Promise<void>;
    exists?(transport, location, context): Promise<boolean>;
    delete?(transport, location, context): Promise<void>;
  }
  ```

  ### Design Philosophy

  - **Transport**: WHERE + I/O primitives (read/write/list)
  - **Semantic**: WHAT + HOW (orchestrates transport primitives)

  This enables complex resources (directories, packages) where semantic controls the fetch/store logic.

  ## Breaking Changes

  - `TransportHandler.fetch` renamed to `read`
  - `TransportHandler.type` renamed to `name`
  - `SemanticHandler.type` renamed to `name`
  - `SemanticHandler.parse` replaced by `resolve(transport, location, context)`
  - `ParseContext` renamed to `SemanticContext`
  - `ResourceMeta.fetchedAt` renamed to `resolvedAt`

### Patch Changes

- Updated dependencies [bcbc247]
  - @resourcexjs/core@0.1.0

## 0.0.3

### Patch Changes

- a74019b: feat: auto-inject version from package.json at build time
- Updated dependencies [a74019b]
  - @resourcexjs/core@0.0.3
