/**
 * @resourcexjs/registry
 *
 * ResourceX Registry - Resource storage and retrieval
 */

// Registry
export type { Registry, RegistryConfig } from "./Registry.js";
export { DefaultRegistry } from "./Registry.js";
export { createRegistry } from "./createRegistry.js";
export type {
  ClientRegistryConfig,
  ServerRegistryConfig,
  CreateRegistryConfig,
} from "./createRegistry.js";

// Storage
export type { Storage, SearchOptions } from "./storage/index.js";
export { LocalStorage, GitStorage, GitHubStorage, isGitHubUrl } from "./storage/index.js";
export type { LocalStorageConfig, GitStorageConfig, GitHubStorageConfig } from "./storage/index.js";

// Discovery
export { discoverRegistry } from "./discovery.js";
export type { WellKnownResponse, DiscoveryResult } from "./discovery.js";

// Errors
export { RegistryError } from "./errors.js";

// Middleware
export { RegistryMiddleware, DomainValidation, withDomainValidation } from "./middleware/index.js";
