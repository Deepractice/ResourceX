# @resourcexjs/mcp-server

## 2.7.0

### Minor Changes

- 2166a63: feat: add multi-registry management (Maven-style)
  - Add `rx registry add/remove/list/default` CLI commands for managing multiple registries
  - Support named registries with default flag in config.json
  - Auto-migrate old single `registry` field to `registries[]` array
  - First added registry automatically becomes the default
  - Push command resolves `--registry` flag by name or URL
  - MCP Server reads shared `~/.resourcex/config.json` for default registry
  - Environment variables still take precedence as override

### Patch Changes

- resourcexjs@2.7.0
- @resourcexjs/node-provider@2.7.0

## 2.6.0

### Patch Changes

- @resourcexjs/node-provider@2.6.0
- resourcexjs@2.6.0

## 2.5.7

### Patch Changes

- Updated dependencies [4a866e0]
- Updated dependencies [b4684d2]
  - resourcexjs@2.5.7
  - @resourcexjs/node-provider@2.5.7

## 2.5.6

### Patch Changes

- Updated dependencies [3c43d76]
  - resourcexjs@2.5.6
  - @resourcexjs/node-provider@2.5.6

## 2.5.5

### Patch Changes

- Updated dependencies [49e3d04]
  - resourcexjs@2.5.5

## 2.5.4

### Patch Changes

- 40baee5: feat: integrate roleType from RoleX for role resource support
  - resourcexjs@2.5.4

## 2.5.3

### Patch Changes

- a5694e5: fix: add bin aliases for npx compatibility
  - resourcexjs@2.5.3

## 2.5.2

### Patch Changes

- 0ef96d1: fix: resolve workspace protocol for npm compatibility
  - resourcexjs@2.5.2

## 2.5.1

### Patch Changes

- Updated dependencies [74629d7]
  - resourcexjs@2.5.1
