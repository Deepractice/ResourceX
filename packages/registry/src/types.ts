import type { RXR, RXL } from "@resourcexjs/core";
import type { ResourceType, ResolvedResource } from "@resourcexjs/type";

/**
 * Local registry configuration.
 * Uses filesystem for storage.
 */
export interface LocalRegistryConfig {
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
 * Remote registry configuration.
 * Uses HTTP API for access.
 */
export interface RemoteRegistryConfig {
  /**
   * Remote registry API endpoint.
   * Example: "https://registry.deepractice.ai/v1"
   */
  endpoint: string;
}

/**
 * Registry configuration - local or remote.
 */
export type RegistryConfig = LocalRegistryConfig | RemoteRegistryConfig;

/**
 * Type guard to check if config is for remote registry.
 */
export function isRemoteConfig(config?: RegistryConfig): config is RemoteRegistryConfig {
  return config !== undefined && "endpoint" in config;
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
 * Options for pulling resources from remote registry.
 */
export interface PullOptions {
  /**
   * Pull from a specific registry instead of auto-discovering.
   */
  from?: Registry;
}

/**
 * Target configuration for publishing resources.
 */
export interface PublishTarget {
  type: "http" | "git";
  /** HTTP endpoint (for type: "http") */
  endpoint?: string;
  /** Git repository URL (for type: "git") */
  url?: string;
  /** Git ref - branch/tag (for type: "git"). Default: "main" */
  ref?: string;
}

/**
 * Options for publishing resources to remote registry.
 */
export interface PublishOptions {
  /**
   * Target registry configuration.
   */
  to: PublishTarget;
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
   * Pull resource from remote registry to local cache.
   * Discovers remote registry via well-known and caches locally.
   * @param locator - Resource locator (must include domain)
   * @param options - Pull options
   */
  pull(locator: string, options?: PullOptions): Promise<void>;

  /**
   * Publish resource to remote registry.
   * Resource must exist in local first.
   * @param resource - Resource to publish
   * @param options - Publish target configuration
   */
  publish(resource: RXR, options: PublishOptions): Promise<void>;

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
