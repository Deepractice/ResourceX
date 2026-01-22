import type { Registry, RegistryConfig } from "./types.js";
import { isRemoteConfig } from "./types.js";
import { LocalRegistry } from "./LocalRegistry.js";
import { RemoteRegistry } from "./RemoteRegistry.js";

/**
 * Create a registry instance.
 *
 * @param config - Registry configuration
 *   - No config or LocalRegistryConfig: Creates LocalRegistry (filesystem-based)
 *   - RemoteRegistryConfig: Creates RemoteRegistry (HTTP-based)
 *
 * @example
 * // Local registry (default)
 * const registry = createRegistry();
 * const registry2 = createRegistry({ path: "./custom-path" });
 *
 * // Remote registry
 * const registry3 = createRegistry({ endpoint: "https://registry.deepractice.ai/v1" });
 */
export function createRegistry(config?: RegistryConfig): Registry {
  if (isRemoteConfig(config)) {
    return new RemoteRegistry(config);
  }
  return new LocalRegistry(config);
}
