import type { Registry, RegistryConfig } from "./types.js";
import { isRemoteConfig, isGitConfig, isGitHubConfig } from "./types.js";
import { LocalRegistry } from "./LocalRegistry.js";
import { RemoteRegistry } from "./RemoteRegistry.js";
import { GitRegistry } from "./GitRegistry.js";
import { GitHubRegistry } from "./GitHubRegistry.js";
import { withDomainValidation } from "./middleware/DomainValidation.js";
import { RegistryError } from "./errors.js";

/**
 * Check if URL is a remote git URL (not local path).
 */
function isRemoteGitUrl(url: string): boolean {
  return url.startsWith("git@") || url.startsWith("https://") || url.startsWith("http://");
}

/**
 * Create a registry instance.
 *
 * When a `domain` is provided in GitRegistryConfig, the registry is automatically
 * wrapped with DomainValidation middleware for security.
 *
 * @param config - Registry configuration
 *   - No config or LocalRegistryConfig: Creates LocalRegistry (filesystem-based)
 *   - RemoteRegistryConfig: Creates RemoteRegistry (HTTP-based)
 *   - GitRegistryConfig: Creates GitRegistry (git clone-based)
 *   - GitHubRegistryConfig: Creates GitHubRegistry (tarball download-based, faster)
 *
 * @example
 * // Local registry (default)
 * const registry = createRegistry();
 * const registry2 = createRegistry({ path: "./custom-path" });
 *
 * // Remote registry
 * const registry3 = createRegistry({ endpoint: "https://registry.deepractice.ai/v1" });
 *
 * // Git registry (requires domain for remote URLs)
 * const registry4 = createRegistry({
 *   type: "git",
 *   url: "git@github.com:Deepractice/Registry.git",
 *   domain: "deepractice.ai",  // Auto-wrapped with DomainValidation
 * });
 */
export function createRegistry(config?: RegistryConfig): Registry {
  if (isRemoteConfig(config)) {
    return new RemoteRegistry(config);
  }

  if (isGitHubConfig(config)) {
    const githubRegistry = new GitHubRegistry(config);

    // Auto-wrap with DomainValidation middleware if domain is provided
    if (config.domain) {
      return withDomainValidation(githubRegistry, config.domain);
    }

    return githubRegistry;
  }

  if (isGitConfig(config)) {
    // Security check: remote URL requires domain binding
    if (isRemoteGitUrl(config.url) && !config.domain) {
      throw new RegistryError(
        `Remote git registry requires a trusted domain.\n\n` +
          `Either:\n` +
          `1. Use discoverRegistry("your-domain.com") to auto-bind domain\n` +
          `2. Explicitly set domain: createRegistry({ type: "git", url: "...", domain: "your-domain.com" })\n\n` +
          `This ensures resources from untrusted sources cannot impersonate your domain.`
      );
    }

    const gitRegistry = new GitRegistry(config);

    // Auto-wrap with DomainValidation middleware if domain is provided
    if (config.domain) {
      return withDomainValidation(gitRegistry, config.domain);
    }

    return gitRegistry;
  }

  return new LocalRegistry(config);
}
