import type { RXR, RXL } from "@resourcexjs/core";
import type { ResourceType, ResolvedResource } from "@resourcexjs/type";

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
   * Add support for a custom resource type.
   * @param type - The resource type to support
   */
  supportType(type: ResourceType): void;

  /**
   * Publish resource to remote registry (based on domain).
   */
  publish(resource: RXR): Promise<void>;

  /**
   * Link resource to local registry (for development/caching).
   */
  link(resource: RXR): Promise<void>;

  /**
   * Get raw resource by locator string.
   * Returns the RXR (locator + manifest + content) without resolving.
   * Use this when you need access to raw resource content.
   */
  get(locator: string): Promise<RXR>;

  /**
   * Resolve resource by locator string.
   * Returns a ResolvedResource with execute function and original resource.
   * Checks local first, then fetches from remote if not found.
   */
  resolve<TArgs = void, TResult = unknown>(
    locator: string
  ): Promise<ResolvedResource<TArgs, TResult>>;

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
