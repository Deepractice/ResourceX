---
"@resourcexjs/core": minor
"resourcexjs": minor
---

feat: add deposit capability and refactor architecture

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
