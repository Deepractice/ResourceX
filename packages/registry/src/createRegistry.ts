import type { Registry } from "./Registry.js";
import { DefaultRegistry } from "./Registry.js";
import type { Storage } from "./storage/index.js";
import { LocalStorage } from "./storage/index.js";
import type { BundledType, IsolatorType } from "@resourcexjs/type";

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
   * Additional custom resource types.
   * Built-in types (text, json, binary) are always included.
   */
  types?: BundledType[];

  /**
   * Isolator type for resolver execution.
   * Defaults to "none".
   */
  isolator?: IsolatorType;
}

/**
 * Server registry configuration.
 * Uses custom Storage implementation.
 */
export interface ServerRegistryConfig {
  /**
   * Custom storage implementation.
   * Example: new LocalStorage({ path: "..." })
   */
  storage: Storage;

  /**
   * Additional custom resource types.
   * Built-in types (text, json, binary) are always included.
   */
  types?: BundledType[];

  /**
   * Isolator type for resolver execution.
   * Defaults to "none".
   */
  isolator?: IsolatorType;
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
 * Built-in types (text, json, binary) are always included by default.
 *
 * Two modes:
 * 1. Client mode (default): Uses LocalStorage as cache, fetches from remote when cache miss
 * 2. Server mode: Uses custom Storage implementation
 *
 * @example
 * // Simple usage - builtin types included
 * const registry = createRegistry();
 *
 * @example
 * // With custom types
 * const registry = createRegistry({ types: [myPromptType] });
 *
 * @example
 * // With isolator (SandboX)
 * const registry = createRegistry({
 *   isolator: "srt",  // or "none", "cloudflare", "e2b"
 * });
 *
 * @example
 * // Server mode - custom storage
 * const registry = createRegistry({
 *   storage: new LocalStorage({ path: "./data" }),
 * });
 */
export function createRegistry(config?: CreateRegistryConfig): Registry {
  // Server mode: use provided storage
  if (isServerConfig(config)) {
    return new DefaultRegistry({
      storage: config.storage,
      types: config.types,
      isolator: config.isolator,
    });
  }

  // Client mode: use LocalStorage with optional mirror
  const storage = new LocalStorage({ path: config?.path });
  return new DefaultRegistry({
    storage,
    mirror: config?.mirror,
    types: config?.types,
    isolator: config?.isolator,
  });
}
