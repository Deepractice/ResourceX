import type { Registry, RegistryConfig } from "./types.js";
import { isRemoteConfig, isGitConfig } from "./types.js";
import { LocalRegistry } from "./LocalRegistry.js";
import { RemoteRegistry } from "./RemoteRegistry.js";
import { GitRegistry } from "./GitRegistry.js";

/**
 * Create a registry instance.
 *
 * @param config - Registry configuration
 *   - No config or LocalRegistryConfig: Creates LocalRegistry (filesystem-based)
 *   - RemoteRegistryConfig: Creates RemoteRegistry (HTTP-based)
 *   - GitRegistryConfig: Creates GitRegistry (git clone-based)
 *
 * @example
 * // Local registry (default)
 * const registry = createRegistry();
 * const registry2 = createRegistry({ path: "./custom-path" });
 *
 * // Remote registry
 * const registry3 = createRegistry({ endpoint: "https://registry.deepractice.ai/v1" });
 *
 * // Git registry
 * const registry4 = createRegistry({
 *   type: "git",
 *   url: "git@github.com:Deepractice/Registry.git",
 * });
 */
export function createRegistry(config?: RegistryConfig): Registry {
  if (isRemoteConfig(config)) {
    return new RemoteRegistry(config);
  }
  if (isGitConfig(config)) {
    return new GitRegistry(config);
  }
  return new LocalRegistry(config);
}
