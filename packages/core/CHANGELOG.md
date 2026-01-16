# @resourcexjs/core

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
