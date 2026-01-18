# @resourcexjs/registry

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
