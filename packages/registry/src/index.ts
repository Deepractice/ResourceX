/**
 * @resourcexjs/registry
 *
 * ResourceX Registry - Resource storage and retrieval
 */

export type {
  Registry,
  RegistryConfig,
  LocalRegistryConfig,
  RemoteRegistryConfig,
  UrlRegistryConfig,
  SearchOptions,
  PullOptions,
  PublishOptions,
  PublishTarget,
  WellKnownResponse,
  DiscoveryResult,
} from "./types.js";
export { RegistryError } from "./errors.js";
export { LocalRegistry } from "./LocalRegistry.js";
export { discoverRegistry } from "./RemoteRegistry.js";
export { createRegistry } from "./createRegistry.js";

// Middleware
export { RegistryMiddleware, DomainValidation, withDomainValidation } from "./middleware/index.js";
