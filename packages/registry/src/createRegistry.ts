import type { Registry, RegistryConfig } from "./types.js";
import { LocalRegistry } from "./LocalRegistry.js";

/**
 * Create a registry instance.
 * Uses local filesystem for storage operations.
 */
export function createRegistry(config?: RegistryConfig): Registry {
  return new LocalRegistry(config);
}
