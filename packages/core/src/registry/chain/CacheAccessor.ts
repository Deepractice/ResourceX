import type { RXL, RXR } from "~/model/index.js";
import type { RegistryAccessor } from "./RegistryAccessor.js";
import type { MirrorRegistry } from "../registries/MirrorRegistry.js";

/**
 * CacheAccessor - Cached remote resource accessor.
 *
 * Handles resources with domain (remote resources).
 * Storage path: {domain}/{name}.{type}/{version}/
 */
export class CacheAccessor implements RegistryAccessor {
  readonly name = "cache";

  constructor(private readonly registry: MirrorRegistry) {}

  async canHandle(rxl: RXL): Promise<boolean> {
    // Only handle resources with registry
    if (!rxl.registry) {
      return false;
    }
    return this.registry.has(rxl);
  }

  async get(rxl: RXL): Promise<RXR> {
    return this.registry.get(rxl);
  }
}
