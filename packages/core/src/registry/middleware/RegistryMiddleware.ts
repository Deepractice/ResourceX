/**
 * Registry Middleware Base Class
 *
 * Provides a base for creating middleware that wraps Registry implementations.
 * All methods delegate to the inner registry by default.
 * Subclasses can override specific methods to add behavior.
 */

import type { RXI, RXR } from "~/model/index.js";
import type { Registry, SearchOptions } from "../registries/index.js";

/**
 * Base class for Registry middleware.
 * Delegates all operations to the inner registry.
 * Override specific methods to add custom behavior.
 */
export abstract class RegistryMiddleware implements Registry {
  constructor(protected readonly inner: Registry) {}

  get(rxi: RXI): Promise<RXR> {
    return this.inner.get(rxi);
  }

  put(rxr: RXR): Promise<void> {
    return this.inner.put(rxr);
  }

  has(rxi: RXI): Promise<boolean> {
    return this.inner.has(rxi);
  }

  remove(rxi: RXI): Promise<void> {
    return this.inner.remove(rxi);
  }

  list(options?: SearchOptions): Promise<RXI[]> {
    return this.inner.list(options);
  }
}
