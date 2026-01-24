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
  GitRegistryConfig,
  GitHubRegistryConfig,
  SearchOptions,
  PullOptions,
  PublishOptions,
  PublishTarget,
  WellKnownResponse,
  DiscoveryResult,
} from "./types.js";
export { isRemoteConfig, isGitConfig, isGitHubConfig } from "./types.js";
export { RegistryError } from "./errors.js";
export { LocalRegistry } from "./LocalRegistry.js";
export { RemoteRegistry, discoverRegistry } from "./RemoteRegistry.js";
export { GitRegistry } from "./GitRegistry.js";
export { GitHubRegistry, parseGitHubUrl, isGitHubUrl } from "./GitHubRegistry.js";
export { createRegistry } from "./createRegistry.js";

// Middleware
export { RegistryMiddleware, DomainValidation, withDomainValidation } from "./middleware/index.js";
