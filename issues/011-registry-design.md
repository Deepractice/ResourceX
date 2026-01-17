# Issue 011: Registry Design

## Overview

Registry 是 ResourceX 的资源仓库抽象层，负责资源的存取。支持本地和远程两种模式，通过 localhost 作为本地镜像/缓存层。

## Architecture

```
                                    ┌─────────────────────────────────┐
                                    │      Remote Registries          │
                                    │                                 │
                                    │  ┌───────────┐  ┌───────────┐  │
                                    │  │deepractice│  │ github.com│  │
                                    │  │   .ai     │  │           │  │
                                    │  └─────┬─────┘  └─────┬─────┘  │
                                    │        │              │        │
                                    └────────┼──────────────┼────────┘
                                             │              │
                        publish              │   resolve    │
                    (by domain) ─────────────┤   (fetch)    │
                                             │              │
┌──────────────────────────────────────────────────────────────────────┐
│                           ResourceX                                   │
│                                                                       │
│   resolve(locator)                                                    │
│      │                                                                │
│      ▼                                                                │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │                     localhost (Local Mirror)                  │   │
│   │                                                               │   │
│   │  ┌─────────────────────────────────────────────────────────┐ │   │
│   │  │                   ~/.resourcex/                          │ │   │
│   │  │                                                          │ │   │
│   │  │  deepractice.ai/           github.com/                   │ │   │
│   │  │    └── assistant/            └── user/                   │ │   │
│   │  │         └── prompt@1.0.0          └── tool@2.0.0         │ │   │
│   │  │              ├── manifest.json         ├── manifest.json │ │   │
│   │  │              └── content               └── content       │ │   │
│   │  │                                                          │ │   │
│   │  └─────────────────────────────────────────────────────────┘ │   │
│   │                                                               │   │
│   │   - Cache any domain's resources                              │   │
│   │   - link() writes here directly                               │   │
│   │   - resolve() checks here first                               │   │
│   │                                                               │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

## Resolve Flow

```
resolve("deepractice.ai/assistant.prompt@1.0.0")
                │
                ▼
    ┌───────────────────────┐
    │ Check localhost cache │
    │   ~/.resourcex/...    │
    └───────────┬───────────┘
                │
        ┌───────┴───────┐
        │               │
      Found          Not Found
        │               │
        ▼               ▼
    ┌───────┐    ┌─────────────┐
    │ Return│    │Fetch remote │
    │  RXR  │    │  registry   │
    └───────┘    └──────┬──────┘
                        │
                        ▼
                ┌───────────────┐
                │ Cache locally │
                │   (auto)      │
                └───────┬───────┘
                        │
                        ▼
                    ┌───────┐
                    │ Return│
                    │  RXR  │
                    └───────┘
```

## Interface

```typescript
interface Registry {
  // Write operations
  publish(resource: RXR): Promise<void>; // → Remote (by domain)
  link(resource: RXR): Promise<void>; // → Local (localhost)

  // Read operations
  resolve(locator: string): Promise<RXR>;
  exists(locator: string): Promise<boolean>;

  // Management
  delete(locator: string): Promise<void>;
  search(query: string): Promise<RXL[]>;
}
```

## Operations

### `publish(rxr: RXR)`

Publish resource to remote registry based on domain:

```typescript
// rxr.manifest.domain = "deepractice.ai"
await registry.publish(rxr);
// → Uploads to https://registry.deepractice.ai/...
```

### `link(rxr: RXR)`

Link resource to local mirror (for development/testing):

```typescript
// Any domain can be linked locally
await registry.link(rxr);
// → Writes to ~/.resourcex/{domain}/{path}/{name}.{type}@{version}/
```

### `resolve(locator: string)`

Resolve resource (local-first, then remote):

```typescript
const rxr = await registry.resolve("deepractice.ai/assistant.prompt@1.0.0");
// 1. Check ~/.resourcex/deepractice.ai/assistant/prompt@1.0.0/
// 2. If not found, fetch from remote
// 3. Cache locally, then return
```

## Implementation Plan

1. **Registry Interface** - `packages/core/src/registry/types.ts`
2. **FileRegistry** - Local filesystem implementation
3. **RemoteRegistry** - HTTP-based remote registry client
4. **CachedRegistry** - Combines local + remote with caching

## Storage Structure

```
~/.resourcex/
├── deepractice.ai/
│   └── assistant/
│       └── prompt@1.0.0/
│           ├── manifest.json    # RXM serialized
│           └── content          # RXC raw data
├── github.com/
│   └── user/
│       └── repo/
│           └── tool@2.0.0/
│               ├── manifest.json
│               └── content
└── localhost/
    └── my-project/
        └── dev-prompt@0.0.1/
            ├── manifest.json
            └── content
```

## Similar Systems

| System        | Local           | Remote        | Cache     |
| ------------- | --------------- | ------------- | --------- |
| Maven         | `~/.m2/`        | Central/Nexus | Yes       |
| npm           | `node_modules/` | npmjs.com     | `~/.npm/` |
| Docker        | local images    | Docker Hub    | Yes       |
| **ResourceX** | `~/.resourcex/` | domain-based  | Yes       |

## Open Questions

1. Version resolution strategy (semver ranges?)
2. Authentication for private registries
3. Conflict resolution when same resource exists locally and remotely
4. Garbage collection for cached resources
