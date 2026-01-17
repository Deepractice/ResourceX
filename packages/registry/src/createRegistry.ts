import type { Registry, RegistryConfig } from "./types.js";
import { ARPRegistry } from "./ARPRegistry.js";

/**
 * Create a registry instance.
 * Uses ARP protocol for storage operations.
 */
export function createRegistry(config?: RegistryConfig): Registry {
  return new ARPRegistry(config);
}
