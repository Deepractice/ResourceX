# @resourcexjs/registry

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
