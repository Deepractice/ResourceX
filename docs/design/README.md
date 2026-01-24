# Design Documents

This directory contains Architecture Decision Records (ADRs) for ResourceX.

## What is an ADR?

An ADR is a lightweight document that records important architectural decisions. Each ADR describes a specific decision, including context, the decision itself, and its consequences.

## Document Index

| ADR                                            | Title                   | Status   | Date    |
| ---------------------------------------------- | ----------------------- | -------- | ------- |
| [ADR-001](./adr-001-two-layer-architecture.md) | Two-Layer Architecture  | Accepted | 2025-01 |
| [ADR-002](./adr-002-locator-format.md)         | Locator Format Design   | Accepted | 2025-01 |
| [ADR-003](./adr-003-registry-storage.md)       | Registry Storage Design | Accepted | 2025-01 |

## ADR Status Definitions

- **Proposed**: Under discussion, final decision not yet made
- **Accepted**: Decision confirmed and being implemented
- **Deprecated**: Decision superseded by a new ADR
- **Rejected**: Decision was not adopted

## Design Decisions Overview

### ADR-001: Two-Layer Architecture

ResourceX adopts a two-layer architecture:

- **ARP (Agent Resource Protocol)**: Low-level I/O protocol providing unified resource access primitives
- **ResourceX**: High-level resource management layer with RXL/RXM/RXA/RXP/RXR core objects and Registry functionality

This layered design allows flexible extension of transports (file, http, git, etc.) while the upper layer provides a consistent resource management API.

### ADR-002: Locator Format Design

Defines two locator formats:

- **ARL (Agent Resource Locator)**: Used by ARP layer, format: `arp:{semantic}:{transport}://{location}`
- **RXL (ResourceX Locator)**: Used by ResourceX layer, format: `[domain/path/]name[.type][@version]`

Inspired by Go modules' decentralized design philosophy, using domains as namespaces.

### ADR-003: Registry Storage Design

Registry supports multiple storage backends:

- **LocalRegistry**: Local filesystem storage
- **RemoteRegistry**: HTTP API access
- **GitRegistry**: Git repository as storage backend

Uses local/cache separated storage structure, supporting local development and remote resource caching.

## Key Design Principles

### 1. Decentralization

ResourceX follows the Go modules approach:

- **Namespace = Domain**: You own your domain, you control your namespace
- **Storage = Anywhere**: GitHub, self-hosted, platform-hosted
- **Registry = Optional Cache**: Accelerates discovery, not mandatory

### 2. Open Protocol

ResourceX is an open protocol, not a closed platform:

| We Do                           | We Don't                        |
| ------------------------------- | ------------------------------- |
| Define protocol specifications  | Dictate specific resource types |
| Provide extension mechanisms    | Monopolize registries           |
| Offer reference implementations | Lock in users                   |

### 3. Separation of Concerns

- **Transport**: WHERE is the resource? (file, http, git)
- **Semantic**: WHAT is the resource and HOW to handle it? (text, json, binary)
- **Registry**: HOW to store and retrieve versioned resources?

## Related Resources

- [Project README](/README.md)
- [CLAUDE.md](/CLAUDE.md) - Complete API and architecture documentation
- [Contributing Guide](/docs/contributing/)
