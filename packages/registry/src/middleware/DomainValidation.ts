/**
 * Registry Validation Middleware
 *
 * Validates that resources returned from the registry match the trusted registry.
 * Prevents untrusted registries from impersonating other registries.
 */

import type { RXR, RXL } from "@resourcexjs/core";
import type { Registry } from "../registries/index.js";
import { RegistryMiddleware } from "./RegistryMiddleware.js";
import { RegistryError } from "../errors.js";

/**
 * Registry validation middleware.
 * Ensures all resources from this registry match the trusted registry.
 */
export class RegistryValidation extends RegistryMiddleware {
  constructor(
    inner: Registry,
    private readonly trustedRegistry: string
  ) {
    super(inner);
  }

  /**
   * Validate that manifest registry matches trusted registry.
   */
  private validateRegistry(rxr: RXR): void {
    if (rxr.manifest.registry !== this.trustedRegistry) {
      throw new RegistryError(
        `Untrusted registry: resource claims "${rxr.manifest.registry}" but registry only trusts "${this.trustedRegistry}"`
      );
    }
  }

  /**
   * Get resource and validate registry.
   */
  override async get(rxl: RXL): Promise<RXR> {
    const rxr = await this.inner.get(rxl);
    this.validateRegistry(rxr);
    return rxr;
  }
}

/**
 * Factory function to create registry validation middleware.
 *
 * @example
 * const registry = withRegistryValidation(hostedRegistry, "deepractice.ai");
 */
export function withRegistryValidation(registry: Registry, trustedRegistry: string): Registry {
  return new RegistryValidation(registry, trustedRegistry);
}

// Backwards compatibility aliases
export const DomainValidation: typeof RegistryValidation = RegistryValidation;
export const withDomainValidation: typeof withRegistryValidation = withRegistryValidation;
