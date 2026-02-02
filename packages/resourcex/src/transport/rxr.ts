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
import { extract, parse, CASRegistry } from "@resourcexjs/core";
import type { RXR } from "@resourcexjs/core";
import { FileSystemRXAStore } from "../stores/FileSystemRXAStore.js";
import { FileSystemRXMStore } from "../stores/FileSystemRXMStore.js";

const DEFAULT_BASE_PATH = `${homedir()}/.resourcex`;

/**
 * Internal registry access for RxrTransport.
 * Uses CASRegistry with same storage paths as ResourceX.
 */
class InternalRegistryAccess {
  private readonly cas: CASRegistry;

  constructor(basePath: string = DEFAULT_BASE_PATH) {
    const rxaStore = new FileSystemRXAStore(join(basePath, "blobs"));
    const rxmStore = new FileSystemRXMStore(join(basePath, "manifests"));
    this.cas = new CASRegistry(rxaStore, rxmStore);
  }

  async get(locator: string): Promise<RXR> {
    const rxl = parse(locator);
    return this.cas.get(rxl);
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
   * Format: {registry}/{path}/{name}.{type}@{version}/{internal-path}
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
