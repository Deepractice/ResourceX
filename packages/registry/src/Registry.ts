import type { RXR, RXL, ManifestData } from "@resourcexjs/core";
import { parseRXL, createRXM, createRXA } from "@resourcexjs/core";
import { TypeHandlerChain, ResourceTypeError } from "@resourcexjs/type";
import type { BundledType, ResolvedResource, IsolatorType } from "@resourcexjs/type";
import { loadResource } from "@resourcexjs/loader";
import type { Storage, SearchOptions } from "./storage/index.js";
import { LocalStorage } from "./storage/index.js";
import { RegistryError } from "./errors.js";
import { createResolverExecutor } from "./executor/index.js";
import type { ResolverExecutor } from "./executor/index.js";

/**
 * Well-known response format.
 */
interface WellKnownResponse {
  version?: string;
  registries: string[];
}

/**
 * Registry configuration.
 */
export interface RegistryConfig {
  /**
   * Storage backend. Defaults to LocalStorage.
   */
  storage?: Storage;

  /**
   * Mirror URL for remote fetch (client mode).
   * If configured, tries mirror before well-known discovery.
   */
  mirror?: string;

  /**
   * Additional custom resource types to support.
   * Built-in types (text, json, binary) are always included by default.
   */
  types?: BundledType[];

  /**
   * Isolator type for resolver execution (SandboX).
   * - "none": No isolation, fastest (~10ms), for development
   * - "srt": OS-level isolation (~50ms), secure local dev
   * - "cloudflare": Container isolation (~100ms), local Docker or edge
   * - "e2b": MicroVM isolation (~150ms), production (planned)
   */
  isolator?: IsolatorType;
}

/**
 * Registry interface for resource management.
 */
export interface Registry {
  /**
   * Add support for a custom resource type.
   */
  supportType(type: BundledType): void;

  /**
   * Link a development directory.
   * Creates a symlink so changes are reflected immediately.
   * Only supported by LocalStorage.
   */
  link(path: string): Promise<void>;

  /**
   * Add resource to storage.
   * @param source - Resource directory path or RXR object
   */
  add(source: string | RXR): Promise<void>;

  /**
   * Get raw resource by locator.
   *
   * Flow:
   * - localhost: Only queries local storage
   * - Other domains: Local cache -> [Mirror] -> Source (well-known)
   */
  get(locator: string): Promise<RXR>;

  /**
   * Resolve resource by locator.
   * Returns ResolvedResource with execute function.
   */
  resolve<TArgs = void, TResult = unknown>(
    locator: string
  ): Promise<ResolvedResource<TArgs, TResult>>;

  /**
   * Check if resource exists.
   */
  exists(locator: string): Promise<boolean>;

  /**
   * Delete resource from storage.
   */
  delete(locator: string): Promise<void>;

  /**
   * Search for resources.
   */
  search(options?: SearchOptions): Promise<RXL[]>;
}

/**
 * Default Registry implementation.
 *
 * Combines Storage (for CRUD) with TypeHandlerChain (for type resolution).
 * Supports remote fetch for non-localhost domains.
 */
export class DefaultRegistry implements Registry {
  private readonly storage: Storage;
  private readonly mirror?: string;
  private readonly typeHandler: TypeHandlerChain;
  private readonly executor: ResolverExecutor;

  // Cache for discovered endpoints
  private readonly discoveryCache = new Map<string, string>();

  constructor(config?: RegistryConfig) {
    this.storage = config?.storage ?? new LocalStorage();
    this.mirror = config?.mirror;
    // TypeHandlerChain includes builtin types by default
    this.typeHandler = TypeHandlerChain.create();
    // Create executor with configured isolator
    this.executor = createResolverExecutor(config?.isolator ?? "none");

    // Register additional custom types
    if (config?.types) {
      for (const type of config.types) {
        this.typeHandler.register(type);
      }
    }
  }

  supportType(type: BundledType): void {
    this.typeHandler.register(type);
  }

  async link(path: string): Promise<void> {
    // Only LocalStorage supports link
    if (this.storage instanceof LocalStorage) {
      return this.storage.link(path);
    }
    throw new RegistryError(`${this.storage.type} storage does not support link`);
  }

  async add(source: string | RXR): Promise<void> {
    // Load resource if path is provided
    const rxr = typeof source === "string" ? await loadResource(source) : source;

    // Validate type is supported before storing
    const typeName = rxr.manifest.type;
    if (!this.typeHandler.canHandle(typeName)) {
      throw new ResourceTypeError(`Unsupported resource type: ${typeName}`);
    }

    await this.storage.put(rxr);
  }

  async get(locator: string): Promise<RXR> {
    const rxl = parseRXL(locator);
    const domain = rxl.domain ?? "localhost";

    // 1. Always check local storage first
    if (await this.storage.exists(locator)) {
      return this.storage.get(locator);
    }

    // 2. localhost: Only local, never go remote
    if (domain === "localhost") {
      throw new RegistryError(`Resource not found: ${locator}`);
    }

    // 3. Remote domain: Try mirror -> source
    const rxr = await this.fetchRemote(locator, domain);

    // 4. Cache to local storage
    await this.storage.put(rxr);

    return rxr;
  }

  async resolve<TArgs = void, TResult = unknown>(
    locator: string
  ): Promise<ResolvedResource<TArgs, TResult>> {
    const rxr = await this.get(locator);
    const handler = this.typeHandler.getHandler(rxr.manifest.type);

    return {
      resource: rxr,
      schema: handler.schema,
      execute: async (args?: TArgs) => {
        return this.executor.execute<TResult>(handler.code, rxr, args);
      },
    } as ResolvedResource<TArgs, TResult>;
  }

  async exists(locator: string): Promise<boolean> {
    // Check local storage
    if (await this.storage.exists(locator)) {
      return true;
    }

    // For localhost, that's it
    const rxl = parseRXL(locator);
    const domain = rxl.domain ?? "localhost";
    if (domain === "localhost") {
      return false;
    }

    // For remote domains, could check remote (but expensive)
    // For now, just return false - caller can try get() to trigger fetch
    return false;
  }

  async delete(locator: string): Promise<void> {
    return this.storage.delete(locator);
  }

  async search(options?: SearchOptions): Promise<RXL[]> {
    return this.storage.search(options);
  }

  // ============================================
  // Remote fetch implementation
  // ============================================

  /**
   * Fetch resource from remote.
   * Flow: Mirror (if configured) -> Source (well-known)
   */
  private async fetchRemote(locator: string, domain: string): Promise<RXR> {
    // Try mirror first if configured
    if (this.mirror) {
      try {
        return await this.fetchFromEndpoint(this.mirror, locator);
      } catch {
        // Mirror miss, fall through to source
      }
    }

    // Discover source via well-known
    const endpoint = await this.discoverEndpoint(domain);
    return await this.fetchFromEndpoint(endpoint, locator);
  }

  /**
   * Discover registry endpoint for a domain via well-known.
   */
  private async discoverEndpoint(domain: string): Promise<string> {
    // Check cache
    const cached = this.discoveryCache.get(domain);
    if (cached) {
      return cached;
    }

    // Fetch well-known
    const wellKnownUrl = `https://${domain}/.well-known/resourcex`;
    const response = await fetch(wellKnownUrl);

    if (!response.ok) {
      throw new RegistryError(`Well-known discovery failed for ${domain}: ${response.statusText}`);
    }

    const data = (await response.json()) as WellKnownResponse;

    if (!data.registries || !Array.isArray(data.registries) || data.registries.length === 0) {
      throw new RegistryError(
        `Invalid well-known response for ${domain}: missing or empty registries`
      );
    }

    // Use first registry (primary)
    const endpoint = data.registries[0];
    this.discoveryCache.set(domain, endpoint);

    return endpoint;
  }

  /**
   * Fetch resource from a specific endpoint via HTTP API.
   */
  private async fetchFromEndpoint(endpoint: string, locator: string): Promise<RXR> {
    // Remove trailing slash
    const baseUrl = endpoint.replace(/\/$/, "");

    // Fetch manifest
    const manifestUrl = `${baseUrl}/resource?locator=${encodeURIComponent(locator)}`;
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
    const contentUrl = `${baseUrl}/content?locator=${encodeURIComponent(locator)}`;
    const contentResponse = await fetch(contentUrl);

    if (!contentResponse.ok) {
      throw new RegistryError(`Failed to fetch content: ${contentResponse.statusText}`);
    }

    const contentBuffer = Buffer.from(await contentResponse.arrayBuffer());

    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ buffer: contentBuffer }),
    };
  }
}
