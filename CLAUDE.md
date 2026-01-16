# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ResourceX implements ARP (Agent Resource Protocol), a URL format for AI agents to reference and access resources. The URL format is: `arp:{semantic}:{transport}://{location}`

- **semantic**: What the resource is (text, binary)
- **transport**: How to fetch it (https, http, file)
- **location**: Where to find it

## Commands

```bash
# Install dependencies
bun install

# Build all packages (uses Turborepo)
bun run build

# Run all unit tests
bun run test

# Run a single test file
bun test packages/core/tests/unit/parser.test.ts

# Run BDD tests (Cucumber)
bun run test:bdd

# Run BDD tests with specific tags
cd bdd && bun run test:tags "@tagname"

# Lint
bun run lint

# Type check
bun run typecheck

# Format code
bun run format
```

## Architecture

### Package Structure

```
packages/
├── core/        # @resourcexjs/core - Parser, handlers, resolution logic
├── resourcex/   # resourcexjs - Main API (depends on core)
└── cli/         # @resourcexjs/cli - CLI tool (depends on resourcex)
```

### Core Concepts

**Transport** handles WHERE + I/O primitives:

- `read(location)` - Read content
- `write(location, content)` - Write content
- `list(location)` - List directory
- `exists(location)` - Check existence
- `delete(location)` - Delete resource

**Semantic** handles WHAT + HOW (orchestrates Transport):

- `resolve(transport, location, context)` - Fetch and parse resource
- `deposit(transport, location, data, context)` - Serialize and store resource

**Resource Definition** provides URL shortcuts:

- Define `name`, `semantic`, `transport`, `basePath`
- Use `name://location` instead of full ARP URL

### Resolution Flow

The core resolution logic (see `packages/core/src/resolve.ts`):

```
resolve(url):
  1. Parse URL → { semantic, transport, location }
  2. Get handlers → transport, semantic
  3. Semantic orchestrates → semantic.resolve(transport, location, context)
                              └── calls transport.read/list internally

deposit(url, data):
  1. Parse URL → { semantic, transport, location }
  2. Get handlers → transport, semantic
  3. Semantic orchestrates → semantic.deposit(transport, location, data, context)
                              └── calls transport.write internally
```

### Handler System

Transport handlers (`packages/core/src/transport/`) provide I/O primitives:

- `https`, `http` - Read-only network access
- `file` - Full filesystem access (read/write/list/delete)

Semantic handlers (`packages/core/src/semantic/`) orchestrate transport primitives:

- `text` - Plain text (UTF-8 encoding/decoding)
- `binary` - Raw binary (Buffer passthrough, no transformation)

Custom handlers are registered via config when creating ResourceX instance:

```typescript
createResourceX({
  transports: [customTransport],
  semantics: [customSemantic],
});
```

### Resource Definition System

Resource definitions (`packages/core/src/resource/`) provide URL shortcuts:

```typescript
createResourceX({
  resources: [{ name: "mydata", semantic: "text", transport: "file", basePath: "/path/to/data" }],
});

// Then use: mydata://file.txt
// Instead of: arp:text:file:///path/to/data/file.txt
```

### Main API

The `resourcexjs` package exposes `createResourceX()` factory and `ResourceX` class:

- `resolve(url)` - Read resource (supports ARP and Resource URLs)
- `deposit(url, data)` - Write resource
- `exists(url)` - Check existence
- `delete(url)` - Delete resource

## Conventions

- Uses Bun as package manager and runtime
- ESM modules only (`"type": "module"`)
- TypeScript with strict mode
- Commits follow Conventional Commits (enforced by commitlint via lefthook)
- Pre-commit hooks auto-format and lint staged files
- Turborepo manages build orchestration across packages
