import type { Registry } from "./Registry.js";
import { DefaultRegistry } from "./Registry.js";
import type { Storage } from "./storage/index.js";
import { LocalStorage } from "./storage/index.js";
import type { BundledType } from "@resourcexjs/type";

/**
 * Client registry configuration.
 * Uses LocalStorage as cache, optionally fetches from remote via mirror or well-known.
 */
export interface ClientRegistryConfig {
  /**
   * Local cache path. Defaults to ~/.resourcex
   */
  path?: string;

  /**
   * Mirror URL for remote fetch.
   * If configured, tries mirror before well-known discovery.
   */
  mirror?: string;

  /**
   * Custom resource types to support.
   */
  types?: BundledType[];
}

/**
 * Server registry configuration.
 * Uses custom Storage implementation.
 */
export interface ServerRegistryConfig {
  /**
   * Custom storage implementation.
   * Example: new GitStorage({ url: "..." }), new LocalStorage({ path: "..." })
   */
  storage: Storage;

  /**
   * Custom resource types to support.
   */
  types?: BundledType[];
}

/**
 * All supported registry configurations.
 */
export type CreateRegistryConfig = ClientRegistryConfig | ServerRegistryConfig;

/**
 * Type guard: check if config is server mode (has storage).
 */
function isServerConfig(config?: CreateRegistryConfig): config is ServerRegistryConfig {
  return config !== undefined && "storage" in config;
}

/**
 * Create a registry instance.
 *
 * Two modes:
 * 1. Client mode (default): Uses LocalStorage as cache, fetches from remote when cache miss
 * 2. Server mode: Uses custom Storage implementation
 *
 * @example
 * // Client mode - local cache + remote fetch
 * const registry = createRegistry();
 * const registry2 = createRegistry({ path: "./custom-cache" });
 * const registry3 = createRegistry({ mirror: "https://mirror.company.com" });
 *
 * @example
 * // Server mode - custom storage
 * const registry = createRegistry({
 *   storage: new GitStorage({ url: "git@github.com:org/registry.git" }),
 * });
 */
export function createRegistry(config?: CreateRegistryConfig): Registry {
  // Server mode: use provided storage
  if (isServerConfig(config)) {
    return new DefaultRegistry({
      storage: config.storage,
      types: config.types,
    });
  }

  // Client mode: use LocalStorage with optional mirror
  const storage = new LocalStorage({ path: config?.path });
  return new DefaultRegistry({
    storage,
    mirror: config?.mirror,
    types: config?.types,
  });
}
