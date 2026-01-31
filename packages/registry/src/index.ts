/**
 * @resourcexjs/registry
 *
 * Registry layer - business logic for RXR operations.
 *
 * Three registry types:
 * - LocalRegistry: Local/owned resources (no domain in path)
 * - MirrorRegistry: Cached remote resources (domain in path)
 * - LinkedRegistry: Development symlinks
 *
 * Access chain (read-through cache):
 * - RegistryAccessChain: Unified resource access
 * - LinkedAccessor, LocalAccessor, CacheAccessor, RemoteAccessor
 *
 * All registries use @resourcexjs/storage for persistence.
 */

// Registry layer
export type { Registry, SearchOptions } from "./registries/index.js";
export { LocalRegistry, MirrorRegistry, LinkedRegistry } from "./registries/index.js";

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
