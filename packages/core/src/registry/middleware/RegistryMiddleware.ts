/**
 * Registry Middleware Base Class
 *
 * Provides a base for creating middleware that wraps Registry implementations.
 * All methods delegate to the inner registry by default.
 * Subclasses can override specific methods to add behavior.
 */

import type { RXR, RXL } from "~/model/index.js";
import type { Registry, SearchOptions } from "../registries/index.js";

/**
 * Base class for Registry middleware.
 * Delegates all operations to the inner registry.
 * Override specific methods to add custom behavior.
 */
export abstract class RegistryMiddleware implements Registry {
  constructor(protected readonly inner: Registry) {}

  get(rxl: RXL): Promise<RXR> {
    return this.inner.get(rxl);
  }

  put(rxr: RXR): Promise<void> {
    return this.inner.put(rxr);
  }

  has(rxl: RXL): Promise<boolean> {
    return this.inner.has(rxl);
  }

  remove(rxl: RXL): Promise<void> {
    return this.inner.remove(rxl);
  }

  list(options?: SearchOptions): Promise<RXL[]> {
    return this.inner.list(options);
  }
}
