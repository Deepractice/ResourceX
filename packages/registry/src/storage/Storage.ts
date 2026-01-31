import type { RXR, RXL } from "@resourcexjs/core";

/**
 * Search options for querying resources.
 */
export interface SearchOptions {
  /**
   * Search query string (matches against name, domain, path).
   */
  query?: string;

  /**
   * Maximum number of results to return.
   */
  limit?: number;

  /**
   * Number of results to skip (for pagination).
   */
  offset?: number;
}

/**
 * Storage interface - pure storage abstraction.
 * Handles CRUD operations for resources.
 *
 * Different implementations:
 * - LocalStorage: filesystem, read-write
 * - GitStorage: git clone, read-only
 * - HttpStorage: HTTP API, typically read-only
 */
export interface Storage {
  /**
   * Storage type identifier.
   */
  readonly type: string;

  /**
   * Get resource by locator.
   * @throws RegistryError if not found
   */
  get(rxl: RXL): Promise<RXR>;

  /**
   * Store a resource.
   * @throws RegistryError if storage is read-only
   */
  put(rxr: RXR): Promise<void>;

  /**
   * Check if resource exists.
   */
  exists(rxl: RXL): Promise<boolean>;

  /**
   * Delete a resource.
   * @throws RegistryError if storage is read-only
   */
  delete(rxl: RXL): Promise<void>;

  /**
   * Search for resources.
   */
  search(options?: SearchOptions): Promise<RXL[]>;
}

/**
 * Read-only storage error helper.
 */
export function throwReadOnly(operation: string, storageType: string): never {
  throw new Error(`${storageType} is read-only: ${operation} not supported`);
}
