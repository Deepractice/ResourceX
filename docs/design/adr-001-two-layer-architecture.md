# ADR-001: Two-Layer Architecture

**Status**: Accepted
**Date**: 2025-01

## Context

ResourceX aims to be a resource management protocol for AI Agents, similar to npm for packages. The design needs to address several challenges:

1. **Multiple data sources**: Resources may come from local filesystem, HTTP endpoints, Git repositories, or cloud storage
2. **Multiple data formats**: Resources may be text, JSON, binary, or complex multi-file packages
3. **Version management**: Resources need versioning, dependency resolution, and registry support
4. **Extensibility**: New transports and formats should be easy to add without modifying core logic

A monolithic design would tightly couple I/O operations with resource management logic, making it difficult to extend and maintain.

## Decision

ResourceX adopts a **two-layer architecture**:

```
+-------------------------------------------+
|            ResourceX Layer                |
|  (Resource Management)                    |
|                                           |
|  - RXL (Locator): Resource addressing     |
|  - RXM (Manifest): Resource metadata      |
|  - RXA (Archive): Resource content        |
|  - RXR (Resource): Complete resource      |
|  - Registry: Storage and retrieval        |
|  - TypeSystem: Type handlers              |
+-------------------------------------------+
                    |
                    | uses
                    v
+-------------------------------------------+
|              ARP Layer                    |
|  (Agent Resource Protocol)                |
|                                           |
|  - Transport: WHERE (file, http, git)     |
|  - Semantic: WHAT/HOW (text, json, binary)|
|  - ARL: URL format for addressing         |
+-------------------------------------------+
```

### ARP Layer (Low-Level I/O)

ARP provides primitive I/O operations with pluggable transports and semantics:

**URL Format**: `arp:{semantic}:{transport}://{location}`

**Transport (WHERE + I/O Primitives)**:

- Answers: Where is the resource? How to perform I/O?
- Provides: `get`, `set`, `exists`, `delete` primitives
- Examples: `file://`, `http://`, `https://`

**Semantic (WHAT + HOW)**:

- Answers: What is the resource? How to encode/decode?
- Handles: Parsing and serialization
- Examples: `text`, `json`, `binary`

**Key Insight**: Semantic orchestrates Transport primitives to complete operations.

```typescript
// Transport only provides I/O primitives
interface TransportHandler {
  name: string;
  get(location: string): Promise<TransportResult>;
  set?(location: string, content: Buffer): Promise<void>;
  exists(location: string): Promise<boolean>;
  delete?(location: string): Promise<void>;
}

// Semantic controls how to use Transport
interface SemanticHandler<T> {
  name: string;
  resolve(transport: TransportHandler, location: string): Promise<Resource<T>>;
  deposit?(transport: TransportHandler, location: string, data: T): Promise<void>;
}
```

### ResourceX Layer (High-Level Management)

ResourceX provides resource management abstractions:

**Core Objects**:

| Object | Full Name          | Responsibility              |
| ------ | ------------------ | --------------------------- |
| RXL    | ResourceX Locator  | Parse and locate resources  |
| RXM    | ResourceX Manifest | Resource metadata           |
| RXA    | ResourceX Archive  | Resource archive (tar.gz)   |
| RXP    | ResourceX Package  | Extracted files for runtime |
| RXR    | ResourceX Resource | RXL + RXM + RXA             |

**Registry**: Maven-style resource storage with `link`, `get`, `resolve`, `exists`, `delete`, `search` operations.

**TypeSystem**: Extensible type handlers for serialization and resolution.

### Layer Interaction

```
User Code
    |
    v
Registry.resolve("deepractice.ai/nuwa.role@1.0.0")
    |
    v
LocalRegistry (checks local/cache storage)
    |
    v
TypeHandlerChain.deserialize(buffer, manifest)
    |
    v
Returns RXR { locator, manifest, content }
```

## Consequences

### Positive

1. **Separation of Concerns**: Transport handles I/O, Semantic handles encoding, Registry handles storage
2. **Extensibility**: New transports (S3, FTP) or semantics (YAML, TOML) can be added independently
3. **Testability**: Each layer can be tested in isolation with mock dependencies
4. **Flexibility**: Same semantic can work with different transports (e.g., `package` semantic works with `file://` for local directories or `https://` for archives)

### Negative

1. **Complexity**: Two layers add indirection and learning curve
2. **Performance**: Extra abstraction may introduce overhead for simple operations
3. **Coordination**: Changes affecting both layers require careful coordination

### Comparison with Similar Systems

| System    | Approach                    | Trade-off                           |
| --------- | --------------------------- | ----------------------------------- |
| npm       | Single layer with plugins   | Simpler but less flexible           |
| Maven     | Repository + Transport      | Similar two-layer, proven at scale  |
| Docker    | Registry API + Blob Storage | Clear separation, industry standard |
| ResourceX | ARP + ResourceX             | Optimized for AI agent use cases    |

## Related Decisions

- ADR-002: Locator Format Design
- ADR-003: Registry Storage Design

## References

- Issue #001: Add Deposit Capability
- Issue #004: Resource Definition
- Issue #010: ResourceX API Design
