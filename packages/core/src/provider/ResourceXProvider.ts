/**
 * ResourceX Provider - Platform SPI Interface
 *
 * Providers implement platform-specific storage and loading.
 * This enables ResourceX to run on different platforms:
 * - Node.js (FileSystem + SQLite)
 * - Cloudflare Workers (R2 + D1)
 * - Browser (IndexedDB)
 * - etc.
 */

import type { SourceLoader } from "~/loader/types.js";
import type { RXAStore } from "~/registry/store/RXAStore.js";
import type { RXMStore } from "~/registry/store/RXMStore.js";

/**
 * Provider configuration passed to createStores/createLoader.
 */
export interface ProviderConfig {
  /**
   * Base path for storage (filesystem) or connection info.
   */
  path?: string;

  /**
   * Platform-specific configuration.
   */
  [key: string]: unknown;
}

/**
 * Stores created by the provider.
 */
export interface ProviderStores {
  rxaStore: RXAStore;
  rxmStore: RXMStore;
}

/**
 * Platform-specific defaults resolved from environment variables and config files.
 */
export interface ProviderDefaults {
  /**
   * Default registry URL.
   */
  registry?: string;
}

/**
 * Registry entry in configuration.
 */
export interface RegistryEntry {
  name: string;
  url: string;
  default?: boolean;
}

/**
 * ResourceX Provider - Platform implementation interface.
 *
 * Platforms implement this interface to provide storage and loading
 * capabilities for their environment.
 */
export interface ResourceXProvider {
  /**
   * Platform identifier.
   */
  readonly platform: string;

  /**
   * Create storage instances for the platform.
   */
  createStores(config: ProviderConfig): ProviderStores;

  /**
   * Create source loader for auto-detection pipeline (optional).
   */
  createSourceLoader?(config: ProviderConfig): SourceLoader;

  /**
   * Resolve platform-specific defaults (optional).
   *
   * Called by createResourceX when config values are not explicitly provided.
   * Reads environment variables and config files to provide sensible defaults.
   *
   * Priority: explicit config > env vars > config file > undefined
   */
  getDefaults?(config: ProviderConfig): ProviderDefaults;

  /**
   * List configured registries (optional).
   */
  getRegistries?(config: ProviderConfig): RegistryEntry[];

  /**
   * Add a registry to configuration (optional).
   */
  addRegistry?(config: ProviderConfig, name: string, url: string, setDefault?: boolean): void;

  /**
   * Remove a registry from configuration (optional).
   */
  removeRegistry?(config: ProviderConfig, name: string): void;

  /**
   * Set a registry as the default (optional).
   */
  setDefaultRegistry?(config: ProviderConfig, name: string): void;
}
