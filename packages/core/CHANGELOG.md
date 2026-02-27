# @resourcexjs/core

## 2.16.1

### Patch Changes

- f547272: chore: sync release after manual publish

## 2.16.0

### Minor Changes

- 1063b7c: feat: built-in prototype resource type and detector
  - Add `prototypeType` as built-in type (resolves prototype.json + @filename references)
  - Add `PrototypeDetector` for auto-detecting prototype resources from prototype.json

## 2.15.0

### Minor Changes

- 9bacb4b: feat: tag + digest model, remove version concept

  **Breaking changes:**

  - `ResolveContext.manifest.version` renamed to `tag`
  - `define()` no longer accepts `version` field (use `tag` instead)
  - `ResourceJsonDetector` no longer falls back to `version` field
  - `ResourceXProvider.createLoader()` removed (use `createSourceLoader()`)

  **New features:**

  - Archive digest: deterministic content hash computed from file-level digests
  - `Registry.put()` returns RXM with computed digest
  - Server publish/get responses include digest
  - Client freshness check: compares local vs remote digest before re-pulling
  - Locator format supports digest reference: `name@sha256:abc123`

  **Cleanup:**

  - Removed `SourceLoader.isFresh` — freshness unified to digest comparison
  - Removed provider-level `ResourceLoader` interface (duplicate of loader-level)
  - Simplified `ingest()` — always re-adds from source, CAS deduplicates

## 2.14.1

## 2.14.0

### Minor Changes

- d1989e2: feat: SourceLoader freshness check for cache invalidation

  SourceLoader gains optional `isFresh(source, cachedAt)` method. Each loader implements its own strategy:

  - FolderSourceLoader: compares file mtime against cachedAt (lightweight, no content read)
  - GitHubSourceLoader: not implemented (always stale, re-fetches every time)

  ResourceX.ingest() now checks freshness before re-loading: if the cached version is still fresh, it skips the full add cycle and resolves directly from CAS.

  CASRegistry gains `getStoredManifest()` for lightweight metadata access without blob extraction.

## 2.13.0

### Minor Changes

- 7286d94: feat: expose registry management API (registries, addRegistry, removeRegistry, setDefaultRegistry)

  Provider SPI gains optional registry management methods. NodeProvider implements them.
  ResourceX API proxies to provider, enabling downstream consumers (e.g. RoleX) to manage registries without direct config file access.

## 2.12.0

## 2.11.0

### Minor Changes

- 2b95255: feat: auto-resolve registry from config and support runtime override
  - Provider SPI: add optional `getDefaults()` method for platform-specific config resolution
  - NodeProvider: implement `getDefaults()` — reads `RESOURCEX_REGISTRY` env var and `config.json`
  - `createResourceX()`: auto-resolves registry from provider defaults when not explicitly provided
  - `push()`/`pull()`: accept optional `{ registry }` parameter for per-operation override
  - CLI: rename env vars to `RESOURCEX_REGISTRY`/`RESOURCEX_HOME` (old `RX_*` kept for backward compat)

## 2.10.0

### Minor Changes

- c197c52: Rename RXL to RXI (identifier) and introduce RXL as unified locator type
  - `interface RXL` renamed to `interface RXI` (ResourceX Identifier)
  - `RXR.locator` renamed to `RXR.identifier`
  - New `type RXL = string` as unified locator (RXI string, directory path, or URL)
  - `parse()` returns `RXI`, `format()` accepts `RXI`, `locate()` returns `RXI`
  - Registry interfaces updated to use `RXI` parameter names

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

## 2.8.0

### Minor Changes

- 89233d7: feat: add Docker-style "latest" tag resolution

  - Add `setLatest`/`getLatest` to RXMStore interface for pointer-based latest tracking
  - FileSystemRXMStore stores `.latest` pointer file alongside version manifests
  - MemoryRXMStore tracks latest pointers in memory map
  - CASRegistry.put() automatically updates latest pointer on every add
  - CASRegistry.get()/has() transparently resolve "latest" to actual version
  - Backward compatible: single-version resources resolve without pointer
  - No server changes needed — CAS abstraction propagates resolution transparently

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

## 2.7.0

## 2.6.0

### Minor Changes

- 1f7cf72: feat(core): add skill resource type for agent skill packages

  Add built-in `skill` type that resolves SKILL.md content from resource archives. Supports optional `references/` directory for progressive disclosure — pass `{ reference: "filename.md" }` to load a specific reference file instead of the main SKILL.md.

## 2.5.7

## 2.5.6

### Patch Changes

- 3c43d76: docs: update documentation for Provider architecture
  - Update all READMEs to reflect new Provider pattern
  - Add setProvider() requirement in examples
  - Update storage layout documentation to CAS structure
  - Remove references to deleted packages (storage, registry, loader, type)
  - Add node-provider package documentation
  - Update CLAUDE.md with current architecture

## 2.5.5

## 2.5.4

## 2.5.3

## 2.5.2

## 2.5.1

## 2.5.0

## 2.4.1

## 2.4.0

## 2.3.0

### Minor Changes

- 9138ad5: refactor(core): replace RXC with RXA/RXP architecture
  - Add RXA (Archive) interface for tar.gz storage/transfer
  - Add RXP (Package) interface for runtime file access
  - Update RXR interface: content → archive
  - Rename storage file: content.tar.gz → archive.tar.gz

## 2.2.0

## 2.1.1

## 2.1.0

## 2.0.0

## 1.7.0

### Patch Changes

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

## 1.6.0

### Patch Changes

- @resourcexjs/arp@1.6.0

## 1.5.0

### Patch Changes

- @resourcexjs/arp@1.5.0

## 1.4.0

### Patch Changes

- @resourcexjs/arp@1.4.0

## 1.3.0

### Patch Changes

- @resourcexjs/arp@1.3.0

## 1.2.0

### Patch Changes

- Updated dependencies [df801f8]
  - @resourcexjs/arp@1.2.0

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

- @resourcexjs/arp@0.9.0

## 0.8.1

### Patch Changes

- @resourcexjs/arp@0.8.1

## 0.8.0

### Patch Changes

- @resourcexjs/arp@0.8.0

## 0.7.1

### Patch Changes

- b277bf1: Test patch release
- Updated dependencies [b277bf1]
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

## 0.5.0

### Minor Changes

- 5577d4c: Rename deepractice transport to agentvm:

  - Rename `deepracticeHandler` to `agentvmHandler`
  - Rename `DeepracticeConfig` to `AgentVMConfig`
  - Change directory from `~/.deepractice/` to `~/.agentvm/`
  - Update all URLs from `deepractice://` to `agentvm://`
  - Align with AgentVM product naming

  **Note**: `deepractice` name is reserved for future cloud platform transport.

## 0.4.0

### Minor Changes

- 2ca58a0: Add built-in Deepractice transport for ecosystem local storage:
  - Add `deepracticeHandler(config?)` factory function
  - Maps `deepractice://path` to `~/.deepractice/path`
  - Configurable `parentDir` for testing and custom installations
  - Full capabilities: read/write/list/delete/exists/stat

## 0.3.0

## 0.2.0

### Minor Changes

- 5be5743: Add binary semantic handler and resource definition support:
  - **Binary Semantic**: Handle raw binary resources (Buffer, Uint8Array, ArrayBuffer, number[])
  - **Resource Definition**: Define custom URL shortcuts via config
    - `createResourceX({ resources: [{ name, semantic, transport, basePath }] })`
    - Use `name://location` instead of full ARP URL
  - Use local HTTP server for network tests (improved CI stability)

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

## 0.0.3

### Patch Changes

- a74019b: feat: auto-inject version from package.json at build time
