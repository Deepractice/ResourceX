/**
 * RXR Transport Handler
 * Provides access to files inside a resource via ARP protocol.
 * Format: arp:{semantic}:rxr://{rxl}/{internal-path}
 *
 * This is a read-only transport - set and delete operations are not supported.
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { TransportError } from "@resourcexjs/arp";
import type { TransportHandler, TransportResult, TransportParams } from "@resourcexjs/arp";
import { extract, parse } from "@resourcexjs/core";
import type { RXR } from "@resourcexjs/core";
import { FileSystemStorage } from "@resourcexjs/storage";
import { HostedRegistry, MirrorRegistry, LinkedRegistry } from "@resourcexjs/registry";

const DEFAULT_BASE_PATH = `${homedir()}/.resourcex`;

/**
 * Internal registry access for RxrTransport.
 * Uses the same registry structure as ResourceX.
 */
class InternalRegistryAccess {
  private readonly hosted: HostedRegistry;
  private readonly cache: MirrorRegistry;
  private readonly linked: LinkedRegistry;

  constructor(basePath: string = DEFAULT_BASE_PATH) {
    const hostedStorage = new FileSystemStorage(join(basePath, "hosted"));
    const cacheStorage = new FileSystemStorage(join(basePath, "cache"));

    this.hosted = new HostedRegistry(hostedStorage);
    this.cache = new MirrorRegistry(cacheStorage);
    this.linked = new LinkedRegistry(join(basePath, "linked"));
  }

  async get(locator: string): Promise<RXR> {
    const rxl = parse(locator);

    // Check linked first (development priority)
    if (await this.linked.has(rxl)) {
      return this.linked.get(rxl);
    }

    // Check hosted
    if (await this.hosted.has(rxl)) {
      return this.hosted.get(rxl);
    }

    // Check cache
    if (await this.cache.has(rxl)) {
      return this.cache.get(rxl);
    }

    throw new Error(`Resource not found: ${locator}`);
  }
}

// Singleton registry access
let defaultRegistry: InternalRegistryAccess | null = null;

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

  constructor(private basePath?: string) {}

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
   */
  private getRegistry(): InternalRegistryAccess {
    if (this.basePath) {
      return new InternalRegistryAccess(this.basePath);
    }

    if (!defaultRegistry) {
      defaultRegistry = new InternalRegistryAccess();
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
