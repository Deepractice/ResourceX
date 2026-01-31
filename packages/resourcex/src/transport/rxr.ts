/**
 * RXR Transport Handler
 * Provides access to files inside a resource via ARP protocol.
 * Format: arp:{semantic}:rxr://{rxl}/{internal-path}
 *
 * This is a read-only transport - set and delete operations are not supported.
 *
 * The transport uses a single Registry instance that handles:
 * - localhost: Local storage only
 * - Other domains: Local cache -> [Mirror] -> Source (well-known)
 */

import { TransportError } from "@resourcexjs/arp";
import type { TransportHandler, TransportResult, TransportParams } from "@resourcexjs/arp";
import { extract } from "@resourcexjs/core";
import type { RXA } from "@resourcexjs/core";
import { createRegistry } from "@resourcexjs/registry";
import type { Registry } from "@resourcexjs/registry";

/**
 * Minimal registry interface required by RxrTransport.
 * This allows RxrTransport to work without depending on the full Registry type.
 */
export interface RxrTransportRegistry {
  get(locator: string): Promise<{
    archive: RXA;
  }>;
}

// Singleton registry instance
let defaultRegistry: Registry | null = null;

/**
 * RXR Transport - Access files inside a resource.
 *
 * Location format: {rxl}/{internal-path}
 * Example: deepractice.ai/nuwa.role@1.0.0/thought/first-principles.md
 *
 * The RXL portion ends at @version, and the internal path follows.
 */
export class RxrTransport implements TransportHandler {
  readonly name = "rxr";

  constructor(private registry?: RxrTransportRegistry) {}

  /**
   * Get file content from inside a resource.
   */
  async get(location: string, _params?: TransportParams): Promise<TransportResult> {
    const { rxl, internalPath } = this.parseLocation(location);

    const registry = this.getRegistry();
    const rxr = await registry.get(rxl);
    const files = await extract(rxr.archive);
    const file = files[internalPath];

    if (!file) {
      throw new TransportError(`File not found in resource: ${internalPath}`, this.name);
    }

    return {
      content: file,
      metadata: { type: "file", size: file.length },
    };
  }

  /**
   * Set is not supported - RXR transport is read-only.
   */
  async set(_location: string, _content: Buffer, _params?: TransportParams): Promise<void> {
    throw new TransportError("RXR transport is read-only", this.name);
  }

  /**
   * Check if a file exists inside a resource.
   */
  async exists(location: string): Promise<boolean> {
    try {
      const { rxl, internalPath } = this.parseLocation(location);
      const registry = this.getRegistry();
      const rxr = await registry.get(rxl);
      const files = await extract(rxr.archive);
      return internalPath in files;
    } catch {
      return false;
    }
  }

  /**
   * Delete is not supported - RXR transport is read-only.
   */
  async delete(_location: string): Promise<void> {
    throw new TransportError("RXR transport is read-only", this.name);
  }

  /**
   * Get the registry instance.
   * Uses injected registry if provided, otherwise creates/returns singleton.
   */
  private getRegistry(): RxrTransportRegistry {
    if (this.registry) {
      return this.registry;
    }

    if (!defaultRegistry) {
      defaultRegistry = createRegistry();
    }
    return defaultRegistry;
  }

  /**
   * Parse location into RXL and internal path.
   * Format: {domain}/{path}/{name}.{type}@{version}/{internal-path}
   * Example: deepractice.ai/nuwa.role@1.0.0/thought/first-principles.md
   */
  private parseLocation(location: string): { rxl: string; internalPath: string } {
    // Find @version marker
    const atIndex = location.indexOf("@");
    if (atIndex === -1) {
      throw new TransportError(`Invalid RXR location (missing @version): ${location}`, this.name);
    }

    // Find the first / after @version
    const slashAfterVersion = location.indexOf("/", atIndex);
    if (slashAfterVersion === -1) {
      throw new TransportError(
        `Invalid RXR location (missing internal path): ${location}`,
        this.name
      );
    }

    return {
      rxl: location.slice(0, slashAfterVersion),
      internalPath: location.slice(slashAfterVersion + 1),
    };
  }
}

/**
 * Clear the default registry. Useful for testing.
 */
export function clearRegistryCache(): void {
  defaultRegistry = null;
}
