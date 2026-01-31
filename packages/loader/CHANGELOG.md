# @resourcexjs/loader

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
  - @resourcexjs/core@2.5.0

## 2.4.1

### Patch Changes

- @resourcexjs/core@2.4.1

## 2.4.0

### Patch Changes

- @resourcexjs/core@2.4.0

## 2.3.0

### Patch Changes

- 9138ad5: refactor(core): replace RXC with RXA/RXP architecture
  - Add RXA (Archive) interface for tar.gz storage/transfer
  - Add RXP (Package) interface for runtime file access
  - Update RXR interface: content → archive
  - Rename storage file: content.tar.gz → archive.tar.gz

- Updated dependencies [9138ad5]
  - @resourcexjs/core@2.3.0

## 2.2.0

### Patch Changes

- @resourcexjs/core@2.2.0

## 2.1.1

### Patch Changes

- @resourcexjs/core@2.1.1

## 2.1.0

### Patch Changes

- @resourcexjs/core@2.1.0

## 2.0.0

### Patch Changes

- @resourcexjs/core@2.0.0

## 1.7.0

### Patch Changes

- Updated dependencies [1408238]
  - @resourcexjs/core@1.7.0

## 1.6.0

### Patch Changes

- @resourcexjs/core@1.6.0

## 1.5.0

### Patch Changes

- @resourcexjs/core@1.5.0

## 1.4.0

### Patch Changes

- @resourcexjs/core@1.4.0

## 1.3.0

### Patch Changes

- @resourcexjs/core@1.3.0

## 1.2.0

### Patch Changes

- @resourcexjs/core@1.2.0

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
