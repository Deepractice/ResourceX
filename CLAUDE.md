# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ResourceX implements ARP (Agent Resource Protocol), a URL format for AI agents to reference and access resources. The URL format is: `arp:{semantic}:{transport}://{location}`

- **semantic**: What the resource is (text, json, image, prompt)
- **transport**: How to fetch it (https, http, file, arr)
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

### Resolution Flow

The core resolution logic follows this pipeline (see `packages/core/src/resolve.ts`):

1. **Parse** - `parseARP(url)` extracts semantic, transport, and location from the ARP URL
2. **Transport** - `getTransportHandler(transport).fetch(location)` fetches raw content (Buffer)
3. **Semantic** - `getSemanticHandler(semantic).parse(content, context)` transforms to typed Resource

### Handler System

Transport handlers (`packages/core/src/transport/`) and semantic handlers (`packages/core/src/semantic/`) are registered in global registries. Built-in handlers:

- Transport: `https`, `http`, `file`
- Semantic: `text`

Custom handlers can be registered via `registerTransportHandler()` and `registerSemanticHandler()`.

### Main API

The `resourcexjs` package exposes `createResourceX()` factory and `ResourceX` class which wraps core functionality with a fluent API for registering custom handlers.

## Conventions

- Uses Bun as package manager and runtime
- ESM modules only (`"type": "module"`)
- TypeScript with strict mode
- Commits follow Conventional Commits (enforced by commitlint via lefthook)
- Pre-commit hooks auto-format and lint staged files
- Turborepo manages build orchestration across packages
