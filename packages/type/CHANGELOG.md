# @resourcexjs/type

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

- @resourcexjs/core@1.5.0

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

- @resourcexjs/core@1.4.0

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
