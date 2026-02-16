/**
 * @resourcexjs/core - Registry Layer
 *
 * Registry layer - business logic for RXR operations.
 *
 * Registry types:
 * - CASRegistry: Content-addressable storage (primary)
 * - LinkedRegistry: Development symlinks
 *
 * Store SPI interfaces:
 * - RXAStore: Blob storage by digest
 * - RXMStore: Manifest storage
 */

export type { DiscoveryResult, WellKnownResponse } from "./discovery.js";
// Discovery
export { discoverRegistry } from "./discovery.js";
// Errors
export { RegistryError } from "./errors.js";
// Middleware
export { DomainValidation, RegistryMiddleware, withDomainValidation } from "./middleware/index.js";
// Registry layer
export type { Registry, SearchOptions } from "./registries/index.js";
export { CASRegistry, LinkedRegistry } from "./registries/index.js";
// Store SPI interfaces
export type { RXAStore, RXMSearchOptions, RXMStore, StoredRXM } from "./store/index.js";
// Memory implementations (for testing)
export { computeDigest, isValidDigest, MemoryRXAStore, MemoryRXMStore } from "./store/index.js";
