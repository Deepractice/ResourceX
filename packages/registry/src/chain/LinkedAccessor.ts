import type { RXL, RXR } from "@resourcexjs/core";
import type { RegistryAccessor } from "./RegistryAccessor.js";
import type { LinkedRegistry } from "../registries/LinkedRegistry.js";

/**
 * LinkedAccessor - Development symlink accessor.
 *
 * Highest priority in chain. Used for live development.
 * Does not cache results since files may change.
 */
export class LinkedAccessor implements RegistryAccessor {
  readonly name = "linked";

  constructor(private readonly registry: LinkedRegistry) {}

  async canHandle(rxl: RXL): Promise<boolean> {
    return this.registry.has(rxl);
  }

  async get(rxl: RXL): Promise<RXR> {
    return this.registry.get(rxl);
  }
}
