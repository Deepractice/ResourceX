/**
 * Registry Middleware Base Class
 *
 * Provides a base for creating middleware that wraps Registry implementations.
 * All methods delegate to the inner registry by default.
 * Subclasses can override specific methods to add behavior.
 */

import type { RXR, RXL } from "@resourcexjs/core";
import type { BundledType, ResolvedResource } from "@resourcexjs/type";
import type { Registry } from "../Registry.js";
import type { SearchOptions } from "../storage/Storage.js";

/**
 * Base class for Registry middleware.
 * Delegates all operations to the inner registry.
 * Override specific methods to add custom behavior.
 */
export abstract class RegistryMiddleware implements Registry {
  constructor(protected readonly inner: Registry) {}

  supportType(type: BundledType): void {
    this.inner.supportType(type);
  }

  link(path: string): Promise<void> {
    return this.inner.link(path);
  }

  add(source: string | RXR): Promise<void> {
    return this.inner.add(source);
  }

  get(locator: string): Promise<RXR> {
    return this.inner.get(locator);
  }

  resolve<TArgs = void, TResult = unknown>(
    locator: string
  ): Promise<ResolvedResource<TArgs, TResult>> {
    return this.inner.resolve<TArgs, TResult>(locator);
  }

  exists(locator: string): Promise<boolean> {
    return this.inner.exists(locator);
  }

  delete(locator: string): Promise<void> {
    return this.inner.delete(locator);
  }

  search(options?: SearchOptions): Promise<RXL[]> {
    return this.inner.search(options);
  }
}
