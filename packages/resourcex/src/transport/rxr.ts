/**
 * RXR Transport Handler
 * Provides access to files inside a resource via ARP protocol.
 * Format: arp:{semantic}:rxr://{rxl}/{internal-path}
 *
 * This is a read-only transport - set and delete operations are not supported.
 *
 * Registry selection:
 * - localhost domain: Uses LocalRegistry (filesystem)
 * - Other domains: Uses RemoteRegistry with well-known discovery
 */

import { TransportError } from "@resourcexjs/arp";
import type { TransportHandler, TransportResult, TransportParams } from "@resourcexjs/arp";
import { createRegistry, discoverRegistry } from "@resourcexjs/registry";
import type { Registry } from "@resourcexjs/registry";

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

// Cache for discovered registry endpoints
const registryCache = new Map<string, Registry>();

/**
 * RXR Transport - Access files inside a resource.
 *
 * Location format: {rxl}/{internal-path}
 * Example: deepractice.ai/nuwa.role@1.0.0/thought/first-principles.md
 *
 * The RXL portion ends at @version, and the internal path follows.
 *
 * When no registry is provided, automatically creates one based on domain:
 * - localhost: LocalRegistry
 * - Other domains: RemoteRegistry with well-known discovery
 */
export class RxrTransport implements TransportHandler {
  readonly name = "rxr";

  constructor(private registry?: RxrTransportRegistry) {}

  /**
   * Get file content from inside a resource.
   */
  async get(location: string, _params?: TransportParams): Promise<TransportResult> {
    const { domain, rxl, internalPath } = this.parseLocation(location);

    const registry = await this.getRegistry(domain);
    const rxr = await registry.get(rxl);
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
      const { domain, rxl, internalPath } = this.parseLocation(location);
      const registry = await this.getRegistry(domain);
      const rxr = await registry.get(rxl);
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
   * Get or create a registry for the given domain.
   * - If a registry was provided in constructor, use it
   * - localhost: create LocalRegistry
   * - Other domains: discover endpoint via well-known and create appropriate registry
   */
  private async getRegistry(domain: string): Promise<RxrTransportRegistry> {
    // Use injected registry if provided
    if (this.registry) {
      return this.registry;
    }

    // Check cache first
    if (registryCache.has(domain)) {
      return registryCache.get(domain)!;
    }

    let registry: Registry;

    if (domain === "localhost") {
      // Use local filesystem registry
      registry = createRegistry();
    } else {
      // Discover remote registry endpoint via well-known
      try {
        const discovery = await discoverRegistry(domain);
        const registryUrl = discovery.registries[0];

        // Determine registry type based on URL format
        if (this.isGitUrl(registryUrl)) {
          // Git registry (SSH or HTTPS git URL)
          registry = createRegistry({
            type: "git",
            url: registryUrl,
            domain: discovery.domain, // Bind domain for security
          });
        } else {
          // HTTP registry
          registry = createRegistry({ endpoint: registryUrl });
        }
      } catch (error) {
        throw new TransportError(
          `Failed to discover registry for domain ${domain}: ${(error as Error).message}`,
          this.name
        );
      }
    }

    // Cache the registry
    registryCache.set(domain, registry);
    return registry;
  }

  /**
   * Check if URL is a git repository URL.
   */
  private isGitUrl(url: string): boolean {
    return url.startsWith("git@") || url.endsWith(".git");
  }

  /**
   * Parse location into domain, RXL and internal path.
   * Format: {domain}/{path}/{name}.{type}@{version}/{internal-path}
   * Example: deepractice.ai/nuwa.role@1.0.0/thought/first-principles.md
   */
  private parseLocation(location: string): { domain: string; rxl: string; internalPath: string } {
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

    // Extract domain (first segment before /)
    const firstSlash = location.indexOf("/");
    const domain = firstSlash > 0 ? location.slice(0, firstSlash) : "localhost";

    return {
      domain,
      rxl: location.slice(0, slashAfterVersion),
      internalPath: location.slice(slashAfterVersion + 1),
    };
  }
}

/**
 * Clear the registry cache. Useful for testing.
 */
export function clearRegistryCache(): void {
  registryCache.clear();
}
