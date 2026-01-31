import type { RXL, RXR } from "@resourcexjs/core";

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
 * Registry interface - business layer for RXR operations.
 *
 * This interface defines CRUD operations on RXR objects.
 * Different implementations (HostedRegistry, MirrorRegistry, LinkedRegistry)
 * provide different semantics on top of the same Storage layer.
 */
export interface Registry {
  /**
   * Get resource by locator.
   * @throws RegistryError if not found
   */
  get(rxl: RXL): Promise<RXR>;

  /**
   * Store resource.
   */
  put(rxr: RXR): Promise<void>;

  /**
   * Check if resource exists.
   */
  has(rxl: RXL): Promise<boolean>;

  /**
   * Delete resource.
   */
  remove(rxl: RXL): Promise<void>;

  /**
   * List resources matching options.
   */
  list(options?: SearchOptions): Promise<RXL[]>;
}
