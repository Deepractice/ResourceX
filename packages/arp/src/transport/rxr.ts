/**
 * RXR Transport Handler
 * Provides access to files inside a resource via ARP protocol.
 * Format: arp:{semantic}:rxr://{rxl}/{internal-path}
 *
 * This is a read-only transport - set and delete operations are not supported.
 */

import { TransportError } from "../errors.js";
import type { TransportHandler, TransportResult, TransportParams } from "./types.js";

/**
 * Minimal registry interface required by RxrTransport.
 * This allows RxrTransport to work without depending on the full Registry type.
 */
export interface RxrTransportRegistry {
  get(locator: string): Promise<{
    content: {
      files(): Promise<Map<string, Buffer>>;
    };
  }>;
}

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

  constructor(private registry: RxrTransportRegistry) {}

  /**
   * Get file content from inside a resource.
   */
  async get(location: string, _params?: TransportParams): Promise<TransportResult> {
    const { rxl, internalPath } = this.parseLocation(location);

    const rxr = await this.registry.get(rxl);
    const files = await rxr.content.files();
    const file = files.get(internalPath);

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
      const rxr = await this.registry.get(rxl);
      const files = await rxr.content.files();
      return files.has(internalPath);
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
   * Parse location into RXL and internal path.
   * Format: {rxl}/{internal-path}
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
