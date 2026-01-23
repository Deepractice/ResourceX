# ADR-002: Locator Format Design

**Status**: Accepted
**Date**: 2025-01

## Context

ResourceX needs to address resources across different sources and contexts. The addressing scheme must:

1. Support local development without network
2. Support remote resources from multiple registries
3. Enable decentralized ownership (not a single central registry)
4. Be intuitive and familiar to developers
5. Support versioning

Existing approaches have trade-offs:

| System | Format                   | Limitation              |
| ------ | ------------------------ | ----------------------- |
| npm    | `@scope/name@version`    | Centralized (npmjs.com) |
| Go     | `domain/path@version`    | No type information     |
| Docker | `registry/name:tag`      | Uses `:` for version    |
| Maven  | `group:artifact:version` | Uses `:` as separator   |

## Decision

ResourceX defines two locator formats for different layers:

### ARL (Agent Resource Locator) - ARP Layer

**Format**: `arp:{semantic}:{transport}://{location}`

**Components**:

- `arp:` - Protocol prefix (always required)
- `{semantic}` - Data format handler (text, json, binary)
- `{transport}` - I/O mechanism (file, http, https)
- `{location}` - Resource location (path, URL)

**Examples**:

```
arp:text:file://./config.txt
arp:json:https://api.example.com/data.json
arp:binary:file:///usr/local/bin/tool
```

**Design Rationale**:

- Explicit semantic and transport for unambiguous resolution
- Standard URL-like syntax for familiarity
- Supports any transport/semantic combination

### RXL (ResourceX Locator) - ResourceX Layer

**Format**: `[domain/path/]name[.type][@version]`

**Components**:

| Part    | Required | Description                         |
| ------- | -------- | ----------------------------------- |
| domain  | Optional | Resource origin domain              |
| path    | Optional | Organization/user hierarchy         |
| name    | Required | Resource name                       |
| type    | Optional | Resource type (like file extension) |
| version | Optional | Version (defaults to latest)        |

**Symbol Semantics**:

| Symbol | Meaning   | Example            |
| ------ | --------- | ------------------ |
| `/`    | Hierarchy | `domain/path/name` |
| `.`    | Type      | `name.prompt`      |
| `@`    | Version   | `name@1.0.0`       |

**Examples**:

```bash
# Local resources (no domain)
assistant
assistant.prompt
assistant.prompt@1.0.0

# Platform-hosted
deepractice.ai/assistant
deepractice.ai/sean/assistant.prompt@1.0.0

# Self-hosted
mycompany.com/ai-team/assistant.agent

# GitHub
github.com/user/repo/tool.text@2.0.0
```

### Decentralization Principle

Inspired by Go modules:

1. **Namespace = Domain**: You own your domain, you control your namespace
2. **No Central Registry**: Resources can be hosted anywhere
3. **Discovery via Well-Known**: `https://{domain}/.well-known/resourcex` for registry discovery

```
+------------------------------------------+
|  deepractice.ai                          |
|  TypeHandlers: prompt, tool, agent       |
+------------------------------------------+
|  mycompany.com                           |
|  TypeHandlers: model, dataset, pipeline  |
+------------------------------------------+
|  ResourceX Protocol                      |
|  - Locator format                        |
|  - Manifest base fields                  |
|  - registerType() extension              |
|  - Does NOT dictate types                |
+------------------------------------------+
```

### Type Openness

Types are not hardcoded in the protocol:

- Each registry defines its own types
- `deepractice.ai` may have: `prompt`, `tool`, `agent`
- `mycompany.com` may have: `model`, `dataset`, `pipeline`

TypeHandler extension mechanism:

```typescript
rx.registerType({
  name: "prompt",
  schema: promptManifestSchema,
  resolve: async (manifest) => {
    /* custom logic */
  },
});
```

### Special Domain: localhost

`localhost` represents local development resources:

- No network access required
- Stored in `~/.resourcex/local/`
- Cannot be published (must set real domain first)

```bash
localhost/my-tool.prompt@1.0.0  # Local development
assistant.prompt@1.0.0           # Shorthand for localhost
```

## Consequences

### Positive

1. **Decentralized**: No single point of failure or control
2. **Familiar**: URL-like syntax, version syntax like npm
3. **Flexible**: Optional components for progressive complexity
4. **Extensible**: Type system is open for any domain

### Negative

1. **Discovery Complexity**: Need well-known mechanism for registry lookup
2. **Namespace Collision**: Same name can exist under different domains
3. **Long Locators**: Full form can be verbose

### Comparison

| Aspect           | npm        | Go         | ResourceX  |
| ---------------- | ---------- | ---------- | ---------- |
| Namespace        | `@scope`   | domain     | domain     |
| Central Registry | Yes        | No         | No         |
| Version Syntax   | `@version` | `@version` | `@version` |
| Type Info        | No         | No         | `.type`    |
| Hierarchy        | Flat       | Path       | Path       |

## Related Decisions

- ADR-001: Two-Layer Architecture
- ADR-003: Registry Storage Design

## References

- Issue #008: Resource Locator
- Issue #005: URL Prefix Aliases
- Issue #014: Registry HTTP Protocol
