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
 *
 * Access chain (read-through cache):
 * - RegistryAccessChain: Unified resource access
 * - LinkedAccessor, LocalAccessor, CacheAccessor, RemoteAccessor
 */

// Registry layer
export type { Registry, SearchOptions } from "./registries/index.js";
export { CASRegistry, LinkedRegistry } from "./registries/index.js";

// Legacy registries (to be removed)
export { LocalRegistry, MirrorRegistry } from "./registries/index.js";

// Store SPI interfaces
export type { RXAStore, RXMStore, StoredRXM, RXMSearchOptions } from "./store/index.js";
export { computeDigest, isValidDigest } from "./store/index.js";

// Memory implementations (for testing)
export { MemoryRXAStore, MemoryRXMStore } from "./store/index.js";

// Access chain
export type { RegistryAccessor, RemoteFetcher } from "./chain/index.js";
export {
  RegistryAccessChain,
  LinkedAccessor,
  LocalAccessor,
  CacheAccessor,
  RemoteAccessor,
} from "./chain/index.js";

// Discovery
export { discoverRegistry } from "./discovery.js";
export type { WellKnownResponse, DiscoveryResult } from "./discovery.js";

// Errors
export { RegistryError } from "./errors.js";

// Middleware
export { RegistryMiddleware, DomainValidation, withDomainValidation } from "./middleware/index.js";
