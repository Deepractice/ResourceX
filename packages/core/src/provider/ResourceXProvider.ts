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
 * Resource loader interface for loading from directories/archives.
 */
export interface ResourceLoader {
  /**
   * Check if this loader can handle the given source.
   */
  canLoad(source: string): boolean | Promise<boolean>;

  /**
   * Load resource from source.
   */
  load(source: string): Promise<unknown>; // Returns RXR
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
   * Create resource loader (optional).
   * Not all platforms support loading from filesystem.
   */
  createLoader?(config: ProviderConfig): ResourceLoader;
}
