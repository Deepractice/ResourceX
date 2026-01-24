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
 * Git registry configuration.
 * Uses git clone to fetch registry content.
 */
export interface GitRegistryConfig {
  type: "git";
  /** Git repository URL (SSH format: git@github.com:owner/repo.git) */
  url: string;
  /** Git ref (branch, tag, or commit). Default: "main" */
  ref?: string;
  /** Base path in repo for resources. Default: ".resourcex" */
  basePath?: string;
  /**
   * Trusted domain for this registry.
   * If set, only resources with this domain in manifest are allowed.
   * Required for security - prevents untrusted registries from claiming any domain.
   */
  domain?: string;
}

/**
 * GitHub registry configuration.
 * Uses GitHub's archive API to download tarball (faster than git clone).
 */
export interface GitHubRegistryConfig {
  type: "github";
  /** GitHub repository URL (format: https://github.com/owner/repo) */
  url: string;
  /** Git ref (branch, tag, or commit). Default: "main" */
  ref?: string;
  /** Base path in repo for resources. Default: ".resourcex" */
  basePath?: string;
  /**
   * Trusted domain for this registry.
   * If set, only resources with this domain in manifest are allowed.
   */
  domain?: string;
}

/**
 * Well-known discovery response format.
 * Used by discoverRegistry() to find registry for a domain.
 */
export interface WellKnownResponse {
  version: string;
  /**
   * List of registry URLs (git or http).
   * First one is primary, rest are fallbacks (for future use).
   */
  registries: string[];
}

/**
 * Result from discoverRegistry().
 * Contains domain and its authorized registries.
 */
export interface DiscoveryResult {
  /** The domain that was discovered */
  domain: string;
  /** Authorized registry URLs for this domain */
  registries: string[];
}

/**
 * Registry configuration - local, remote, git, or github.
 */
export type RegistryConfig =
  | LocalRegistryConfig
  | RemoteRegistryConfig
  | GitRegistryConfig
  | GitHubRegistryConfig;

/**
 * Type guard to check if config is for remote registry.
 */
export function isRemoteConfig(config?: RegistryConfig): config is RemoteRegistryConfig {
  return config !== undefined && "endpoint" in config;
}

/**
 * Type guard to check if config is for git registry.
 */
export function isGitConfig(config?: RegistryConfig): config is GitRegistryConfig {
  return config !== undefined && "type" in config && config.type === "git";
}

/**
 * Type guard to check if config is for GitHub registry.
 */
export function isGitHubConfig(config?: RegistryConfig): config is GitHubRegistryConfig {
  return config !== undefined && "type" in config && config.type === "github";
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
   * Link a development directory to local registry.
   * Creates a symlink so changes are reflected immediately.
   * @param path - Path to resource directory (must contain resource.json)
   */
  link(path: string): Promise<void>;

  /**
   * Add resource to local registry.
   * Copies resource content to local storage.
   * @param source - Resource directory path or RXR object
   */
  add(source: string | RXR): Promise<void>;

  /**
   * Pull resource from remote registry to local cache.
   * Discovers remote registry via well-known and caches locally.
   * @param locator - Resource locator (must include domain)
   * @param options - Pull options
   */
  pull(locator: string, options?: PullOptions): Promise<void>;

  /**
   * Publish resource to remote registry.
   * @param source - Resource directory path or RXR object
   * @param options - Publish target configuration (required)
   */
  publish(source: string | RXR, options: PublishOptions): Promise<void>;

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
