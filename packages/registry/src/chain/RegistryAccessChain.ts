import type { RXL, RXR } from "@resourcexjs/core";
import { format } from "@resourcexjs/core";
import type { RegistryAccessor } from "./RegistryAccessor.js";
import { RegistryError } from "../errors.js";

/**
 * RegistryAccessChain - Unified resource access chain.
 *
 * Read-through cache pattern:
 * - Iterates through accessors in order
 * - First accessor that can handle returns the result
 * - Results are optionally cached in memory
 *
 * Typical accessor order:
 * 1. LinkedAccessor (dev override, not cached)
 * 2. LocalAccessor (local resources, no domain)
 * 3. RemoteAccessor (remote resources, has domain, auto-cached)
 */
export class RegistryAccessChain {
  private readonly accessors: RegistryAccessor[];
  private readonly memCache: Map<string, RXR> = new Map();
  private readonly useMemCache: boolean;

  constructor(accessors: RegistryAccessor[], options?: { memCache?: boolean }) {
    this.accessors = accessors;
    this.useMemCache = options?.memCache ?? false;
  }

  /**
   * Get resource.
   */
  async get(rxl: RXL): Promise<RXR> {
    const key = format(rxl);

    // 1. Check memory cache
    if (this.useMemCache && this.memCache.has(key)) {
      return this.memCache.get(key)!;
    }

    // 2. Iterate through chain
    for (const accessor of this.accessors) {
      if (await accessor.canHandle(rxl)) {
        const rxr = await accessor.get(rxl);

        // Cache result (except linked, which may change during dev)
        if (this.useMemCache && accessor.name !== "linked") {
          this.memCache.set(key, rxr);
        }

        return rxr;
      }
    }

    throw new RegistryError(`Resource not found: ${key}`);
  }

  /**
   * Check if resource exists.
   */
  async has(rxl: RXL): Promise<boolean> {
    const key = format(rxl);

    if (this.useMemCache && this.memCache.has(key)) {
      return true;
    }

    for (const accessor of this.accessors) {
      if (await accessor.canHandle(rxl)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear memory cache.
   */
  clearCache(): void {
    this.memCache.clear();
  }

  /**
   * Remove specific resource from memory cache.
   */
  invalidate(rxl: RXL): void {
    this.memCache.delete(format(rxl));
  }
}
