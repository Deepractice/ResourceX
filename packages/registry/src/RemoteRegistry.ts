import type { Registry, RemoteRegistryConfig, SearchOptions } from "./types.js";
import type { RXR, RXL, ManifestData } from "@resourcexjs/core";
import { parseRXL, createRXM } from "@resourcexjs/core";
import { TypeHandlerChain } from "@resourcexjs/type";
import type { ResourceType, ResolvedResource } from "@resourcexjs/type";
import { RegistryError } from "./errors.js";

/**
 * Remote registry implementation.
 * Uses HTTP API for resource access.
 */
export class RemoteRegistry implements Registry {
  private readonly endpoint: string;
  private readonly typeHandler: TypeHandlerChain;

  constructor(config: RemoteRegistryConfig) {
    // Remove trailing slash if present
    this.endpoint = config.endpoint.replace(/\/$/, "");
    this.typeHandler = TypeHandlerChain.create();
  }

  supportType(type: ResourceType): void {
    this.typeHandler.register(type);
  }

  async publish(_resource: RXR): Promise<void> {
    throw new RegistryError("Remote registry publish not implemented yet");
  }

  async link(_resource: RXR): Promise<void> {
    throw new RegistryError("Cannot link to remote registry - use local registry for linking");
  }

  async get(locator: string): Promise<RXR> {
    // Fetch manifest
    const manifestUrl = `${this.endpoint}/resource?locator=${encodeURIComponent(locator)}`;
    const manifestResponse = await fetch(manifestUrl);

    if (!manifestResponse.ok) {
      if (manifestResponse.status === 404) {
        throw new RegistryError(`Resource not found: ${locator}`);
      }
      throw new RegistryError(`Failed to fetch resource: ${manifestResponse.statusText}`);
    }

    const manifestData = (await manifestResponse.json()) as ManifestData;
    const manifest = createRXM(manifestData);

    // Fetch content
    const contentUrl = `${this.endpoint}/content?locator=${encodeURIComponent(locator)}`;
    const contentResponse = await fetch(contentUrl);

    if (!contentResponse.ok) {
      throw new RegistryError(`Failed to fetch content: ${contentResponse.statusText}`);
    }

    const contentBuffer = Buffer.from(await contentResponse.arrayBuffer());

    // Deserialize to RXR
    return this.typeHandler.deserialize(contentBuffer, manifest);
  }

  async resolve<TArgs = void, TResult = unknown>(
    locator: string
  ): Promise<ResolvedResource<TArgs, TResult>> {
    const rxr = await this.get(locator);
    return this.typeHandler.resolve<TArgs, TResult>(rxr);
  }

  async exists(locator: string): Promise<boolean> {
    const url = `${this.endpoint}/exists?locator=${encodeURIComponent(locator)}`;
    const response = await fetch(url);

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { exists: boolean };
    return data.exists === true;
  }

  async delete(_locator: string): Promise<void> {
    throw new RegistryError("Cannot delete from remote registry - use local registry for deletion");
  }

  async search(options?: SearchOptions): Promise<RXL[]> {
    const params = new URLSearchParams();
    if (options?.query) params.set("query", options.query);
    if (options?.limit !== undefined) params.set("limit", String(options.limit));
    if (options?.offset !== undefined) params.set("offset", String(options.offset));

    const url = `${this.endpoint}/search?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new RegistryError(`Search failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { results?: string[] };
    return (data.results || []).map((locator: string) => parseRXL(locator));
  }
}

/**
 * Well-known discovery response format.
 */
interface WellKnownResponse {
  version: string;
  registry: string;
}

/**
 * Discover registry endpoint for a domain using well-known.
 * @param domain - The domain to discover (e.g., "deepractice.ai")
 * @returns The registry endpoint URL
 */
export async function discoverRegistry(domain: string): Promise<string> {
  const wellKnownUrl = `https://${domain}/.well-known/resourcex`;

  try {
    const response = await fetch(wellKnownUrl);
    if (!response.ok) {
      throw new RegistryError(`Well-known discovery failed for ${domain}: ${response.statusText}`);
    }

    const data = (await response.json()) as WellKnownResponse;
    return data.registry;
  } catch (error) {
    if (error instanceof RegistryError) {
      throw error;
    }
    throw new RegistryError(
      `Failed to discover registry for ${domain}: ${(error as Error).message}`
    );
  }
}
