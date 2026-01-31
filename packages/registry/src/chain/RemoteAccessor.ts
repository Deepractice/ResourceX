import type { RXL, RXR } from "@resourcexjs/core";
import type { RegistryAccessor } from "./RegistryAccessor.js";
import type { MirrorRegistry } from "../registries/MirrorRegistry.js";

/**
 * RemoteFetcher - Interface for fetching resources from remote registry.
 */
export interface RemoteFetcher {
  fetch(rxl: RXL): Promise<RXR>;
}

/**
 * RemoteAccessor - Remote resource accessor with auto-caching.
 *
 * Fetches from remote registry and caches to MirrorRegistry.
 * Only handles resources with registry.
 */
export class RemoteAccessor implements RegistryAccessor {
  readonly name = "remote";

  constructor(
    private readonly fetcher: RemoteFetcher,
    private readonly cache: MirrorRegistry
  ) {}

  async canHandle(rxl: RXL): Promise<boolean> {
    // Only handle resources with registry
    return !!rxl.registry;
  }

  async get(rxl: RXL): Promise<RXR> {
    const rxr = await this.fetcher.fetch(rxl);

    // Auto-cache the result
    await this.cache.put(rxr);

    return rxr;
  }
}
