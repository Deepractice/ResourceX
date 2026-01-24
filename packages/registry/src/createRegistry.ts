import type { Registry, RegistryConfig, UrlRegistryConfig } from "./types.js";
import { isRemoteConfig, isGitConfig, isGitHubConfig, isUrlConfig } from "./types.js";
import { LocalRegistry } from "./LocalRegistry.js";
import { RemoteRegistry } from "./RemoteRegistry.js";
import { GitRegistry } from "./GitRegistry.js";
import { GitHubRegistry } from "./GitHubRegistry.js";
import { withDomainValidation } from "./middleware/DomainValidation.js";
import { RegistryError } from "./errors.js";

/**
 * URL handlers in priority order.
 * Each handler checks if it can handle the URL and creates the appropriate registry.
 * Order matters: more specific handlers (GitHub) come before generic ones (Remote).
 */
const URL_HANDLERS = [
  GitHubRegistry, // https://github.com/... → tarball download (fastest)
  GitRegistry, // git@... or *.git → git clone
  RemoteRegistry, // https://... → HTTP API (fallback)
] as const;

/**
 * Check if URL is a remote URL (not local path).
 */
function isRemoteUrl(url: string): boolean {
  return url.startsWith("git@") || url.startsWith("https://") || url.startsWith("http://");
}

/**
 * Create a registry instance.
 *
 * Supports multiple configuration styles:
 * - No config: LocalRegistry (filesystem-based)
 * - `{ url, domain }`: Auto-detects type based on URL format
 * - `{ endpoint }`: RemoteRegistry (HTTP API)
 * - `{ type: "git", url }`: GitRegistry (git clone)
 * - `{ type: "github", url }`: GitHubRegistry (tarball download)
 *
 * @example
 * // Local registry (default)
 * const registry = createRegistry();
 *
 * // URL-based (auto-detect type)
 * const registry2 = createRegistry({
 *   url: "https://github.com/Deepractice/Registry",
 *   domain: "deepractice.dev",
 * });
 *
 * // With discovery
 * const discovery = await discoverRegistry("deepractice.dev");
 * const registry3 = createRegistry({
 *   url: discovery.registries[0],
 *   domain: discovery.domain,
 * });
 */
export function createRegistry(config?: RegistryConfig): Registry {
  // Explicit RemoteRegistryConfig (has endpoint)
  if (isRemoteConfig(config)) {
    return new RemoteRegistry(config);
  }

  // Explicit GitHubRegistryConfig (type: "github")
  if (isGitHubConfig(config)) {
    const registry = new GitHubRegistry(config);
    return config.domain ? withDomainValidation(registry, config.domain) : registry;
  }

  // Explicit GitRegistryConfig (type: "git")
  if (isGitConfig(config)) {
    // Security check: remote URL requires domain binding
    if (isRemoteUrl(config.url) && !config.domain) {
      throw new RegistryError(
        `Remote git registry requires a trusted domain.\n\n` +
          `Use discoverRegistry() or explicitly set domain:\n` +
          `createRegistry({ type: "git", url: "...", domain: "your-domain.com" })`
      );
    }

    const registry = new GitRegistry(config);
    return config.domain ? withDomainValidation(registry, config.domain) : registry;
  }

  // URL-based config (auto-detect type)
  if (isUrlConfig(config)) {
    return createFromUrl(config);
  }

  // Default: LocalRegistry
  return new LocalRegistry(config);
}

/**
 * Create registry from URL config using handler chain.
 */
function createFromUrl(config: UrlRegistryConfig): Registry {
  const { url, domain } = config;

  // Security check: remote URL requires domain binding
  if (isRemoteUrl(url) && !domain) {
    throw new RegistryError(
      `Remote registry URL requires a trusted domain.\n\n` +
        `Use discoverRegistry() or explicitly set domain:\n` +
        `createRegistry({ url: "...", domain: "your-domain.com" })`
    );
  }

  // Find handler that can handle this URL
  for (const Handler of URL_HANDLERS) {
    if (Handler.canHandle(url)) {
      return Handler.create(config);
    }
  }

  // Should not reach here if handlers are configured correctly
  throw new RegistryError(`No handler found for URL: ${url}`);
}
