# resourcexjs

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
