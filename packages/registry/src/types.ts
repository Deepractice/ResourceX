import type { RXR, RXL } from "@resourcexjs/core";
import type { ResourceType } from "@resourcexjs/type";

/**
 * Registry configuration options.
 */
export interface RegistryConfig {
  /**
   * Local storage path. Defaults to ~/.resourcex
   */
  path?: string;

  /**
   * Supported resource types.
   * If not provided, defaults to built-in types (text, json, binary).
   */
  types?: ResourceType[];
}

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
 * Registry interface for resource storage and retrieval.
 */
export interface Registry {
  /**
   * Publish resource to remote registry (based on domain).
   */
  publish(resource: RXR): Promise<void>;

  /**
   * Link resource to local registry (for development/caching).
   */
  link(resource: RXR): Promise<void>;

  /**
   * Resolve resource by locator string.
   * Checks local first, then fetches from remote if not found.
   */
  resolve(locator: string): Promise<RXR>;

  /**
   * Check if resource exists.
   */
  exists(locator: string): Promise<boolean>;

  /**
   * Delete resource from local registry.
   */
  delete(locator: string): Promise<void>;

  /**
   * Search for resources matching options.
   * @param options - Search options (query, limit, offset)
   * @returns Array of matching resource locators
   */
  search(options?: SearchOptions): Promise<RXL[]>;
}
