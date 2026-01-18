# resourcexjs

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
