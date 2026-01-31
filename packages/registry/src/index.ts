/**
 * @resourcexjs/registry
 *
 * Registry layer - business logic for RXR operations.
 *
 * Three registry types:
 * - HostedRegistry: Resources you own (authoritative data)
 * - MirrorRegistry: Cached/mirrored remote resources
 * - LinkedRegistry: Development symlinks
 *
 * All registries use @resourcexjs/storage for persistence.
 */

// Registry layer
export type { Registry, SearchOptions } from "./registries/index.js";
export { HostedRegistry, MirrorRegistry, LinkedRegistry } from "./registries/index.js";

// Discovery
export { discoverRegistry } from "./discovery.js";
export type { WellKnownResponse, DiscoveryResult } from "./discovery.js";

// Errors
export { RegistryError } from "./errors.js";

// Middleware
export { RegistryMiddleware, DomainValidation, withDomainValidation } from "./middleware/index.js";
