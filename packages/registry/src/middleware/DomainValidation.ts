/**
 * Domain Validation Middleware
 *
 * Validates that resources returned from the registry match the trusted domain.
 * Prevents untrusted registries from impersonating other domains.
 */

import type { RXR } from "@resourcexjs/core";
import type { ResolvedResource } from "@resourcexjs/type";
import type { Registry } from "../Registry.js";
import { RegistryMiddleware } from "./RegistryMiddleware.js";
import { RegistryError } from "../errors.js";

/**
 * Domain validation middleware.
 * Ensures all resources from this registry match the trusted domain.
 */
export class DomainValidation extends RegistryMiddleware {
  constructor(
    inner: Registry,
    private readonly trustedDomain: string
  ) {
    super(inner);
  }

  /**
   * Validate that manifest domain matches trusted domain.
   */
  private validateDomain(rxr: RXR): void {
    if (rxr.manifest.domain !== this.trustedDomain) {
      throw new RegistryError(
        `Untrusted domain: resource claims "${rxr.manifest.domain}" but registry only trusts "${this.trustedDomain}"`
      );
    }
  }

  /**
   * Get resource and validate domain.
   */
  override async get(locator: string): Promise<RXR> {
    const rxr = await this.inner.get(locator);
    this.validateDomain(rxr);
    return rxr;
  }

  /**
   * Resolve resource and validate domain.
   */
  override async resolve<TArgs = void, TResult = unknown>(
    locator: string
  ): Promise<ResolvedResource<TArgs, TResult>> {
    // Get first to validate domain before resolving
    const rxr = await this.inner.get(locator);
    this.validateDomain(rxr);
    return this.inner.resolve<TArgs, TResult>(locator);
  }
}

/**
 * Factory function to create domain validation middleware.
 *
 * @example
 * const registry = withDomainValidation(gitRegistry, "deepractice.ai");
 */
export function withDomainValidation(registry: Registry, trustedDomain: string): Registry {
  return new DomainValidation(registry, trustedDomain);
}
