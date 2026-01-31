import type { RXL, RXR } from "@resourcexjs/core";
import type { RegistryAccessor } from "./RegistryAccessor.js";
import type { LocalRegistry } from "../registries/LocalRegistry.js";

/**
 * LocalAccessor - Local resource accessor.
 *
 * Handles resources without domain (local resources).
 * Storage path: {name}.{type}/{version}/
 */
export class LocalAccessor implements RegistryAccessor {
  readonly name = "local";

  constructor(private readonly registry: LocalRegistry) {}

  async canHandle(rxl: RXL): Promise<boolean> {
    // Only handle resources without domain
    if (rxl.domain) {
      return false;
    }
    return this.registry.has(rxl);
  }

  async get(rxl: RXL): Promise<RXR> {
    return this.registry.get(rxl);
  }
}
