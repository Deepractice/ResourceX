import type { RXI, RXM, RXR } from "~/model/index.js";

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
   * Get resource by identifier.
   * @throws RegistryError if not found
   */
  get(rxi: RXI): Promise<RXR>;

  /**
   * Store resource.
   * @returns The stored manifest (with computed digest).
   */
  put(rxr: RXR): Promise<RXM>;

  /**
   * Check if resource exists.
   */
  has(rxi: RXI): Promise<boolean>;

  /**
   * Delete resource.
   */
  remove(rxi: RXI): Promise<void>;

  /**
   * List resources matching options.
   */
  list(options?: SearchOptions): Promise<RXI[]>;
}
