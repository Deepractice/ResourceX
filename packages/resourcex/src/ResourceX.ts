/**
 * ResourceX - Unified Resource Management API
 *
 * This is the main entry point for ResourceX client.
 * It combines Storage layer and Registry layer to provide
 * a simple, unified API for resource management.
 */

import { homedir } from "node:os";
import { join } from "node:path";
import type { RXL, RXR } from "@resourcexjs/core";
import { parse, format } from "@resourcexjs/core";
import type { BundledType, ResolvedResource, IsolatorType } from "@resourcexjs/type";
import { TypeHandlerChain } from "@resourcexjs/type";
import { FileSystemStorage } from "@resourcexjs/storage";
import {
  HostedRegistry,
  MirrorRegistry,
  LinkedRegistry,
  discoverRegistry,
  RegistryError,
} from "@resourcexjs/registry";
import type { SearchOptions } from "@resourcexjs/registry";
import { loadResource } from "@resourcexjs/loader";

const DEFAULT_BASE_PATH = `${homedir()}/.resourcex`;

/**
 * ResourceX configuration.
 */
export interface ResourceXConfig {
  /**
   * Base path for local storage.
   * Default: ~/.resourcex
   */
  path?: string;

  /**
   * Mirror URL for remote fetch.
   * If configured, tries mirror before well-known discovery.
   */
  mirror?: string;

  /**
   * Additional custom resource types.
   * Built-in types (text, json, binary) are always included.
   */
  types?: BundledType[];

  /**
   * Isolator type for resolver execution.
   * - "none": No isolation (default)
   * - "srt": OS-level isolation
   * - "cloudflare": Container isolation
   * - "e2b": MicroVM isolation
   */
  isolator?: IsolatorType;

  /**
   * Domains that this client owns.
   * Resources for these domains go to hosted storage.
   * Default: ["localhost"]
   */
  domains?: string[];
}

/**
 * ResourceX interface - unified API for resource management.
 *
 * API Levels:
 * - Level 1 (Core): save, get, push, pull, resolve
 * - Level 2 (CRUD): remove, has
 * - Level 3 (Dev): link, load
 * - Level 4 (Search): search
 * - Level 5 (Extension): supportType
 */
export interface ResourceX {
  // ===== Level 1: Core =====

  /**
   * Save resource to local storage.
   * If domain is owned, saves to hosted. Otherwise saves to mirror (cache).
   */
  save(rxr: RXR): Promise<void>;

  /**
   * Get resource by locator.
   * Checks: linked → hosted → mirror → remote
   */
  get(locator: string): Promise<RXR>;

  /**
   * Push resource to remote registry.
   * Uses well-known discovery to find the registry for the resource's domain.
   */
  push(rxr: RXR): Promise<void>;

  /**
   * Pull resource from remote registry.
   * Saves to mirror (cache) after fetching.
   */
  pull(locator: string): Promise<RXR>;

  /**
   * Resolve resource and return executable.
   * Combines get() with type resolution.
   */
  resolve<TArgs = void, TResult = unknown>(
    locator: string
  ): Promise<ResolvedResource<TArgs, TResult>>;

  // ===== Level 2: CRUD =====

  /**
   * Remove resource from local storage.
   */
  remove(locator: string): Promise<void>;

  /**
   * Check if resource exists locally.
   */
  has(locator: string): Promise<boolean>;

  // ===== Level 3: Dev =====

  /**
   * Link development directory.
   * Creates symlink for live development.
   */
  link(path: string): Promise<RXL>;

  /**
   * Load resource from directory.
   * Returns RXR without saving to storage.
   */
  load(path: string): Promise<RXR>;

  // ===== Level 4: Search =====

  /**
   * Search local resources.
   */
  search(options?: SearchOptions): Promise<RXL[]>;

  // ===== Level 5: Extension =====

  /**
   * Add support for custom resource type.
   */
  supportType(type: BundledType): void;
}

/**
 * Default ResourceX implementation.
 */
class DefaultResourceX implements ResourceX {
  private readonly basePath: string;
  private readonly mirror?: string;
  private readonly ownedDomains: Set<string>;
  private readonly typeHandler: TypeHandlerChain;
  private readonly isolator: IsolatorType;

  // Three registries
  private readonly hosted: HostedRegistry;
  private readonly cache: MirrorRegistry;
  private readonly linked: LinkedRegistry;

  // Discovery cache
  private readonly discoveryCache = new Map<string, string>();

  constructor(config?: ResourceXConfig) {
    this.basePath = config?.path ?? DEFAULT_BASE_PATH;
    this.mirror = config?.mirror;
    this.ownedDomains = new Set(config?.domains ?? ["localhost"]);
    this.isolator = config?.isolator ?? "none";

    // Initialize type handler
    this.typeHandler = TypeHandlerChain.create();
    if (config?.types) {
      for (const type of config.types) {
        this.typeHandler.register(type);
      }
    }

    // Initialize registries with Storage layer
    const hostedStorage = new FileSystemStorage(join(this.basePath, "hosted"));
    const cacheStorage = new FileSystemStorage(join(this.basePath, "cache"));

    this.hosted = new HostedRegistry(hostedStorage);
    this.cache = new MirrorRegistry(cacheStorage);
    this.linked = new LinkedRegistry(join(this.basePath, "linked"));
  }

  // ===== Level 1: Core =====

  async save(rxr: RXR): Promise<void> {
    const domain = rxr.locator.domain ?? "localhost";

    if (this.ownedDomains.has(domain)) {
      await this.hosted.put(rxr);
    } else {
      await this.cache.put(rxr);
    }
  }

  async get(locator: string): Promise<RXR> {
    const rxl = parse(locator);
    const domain = rxl.domain ?? "localhost";

    // 1. Check linked (development priority)
    if (await this.linked.has(rxl)) {
      return this.linked.get(rxl);
    }

    // 2. Check hosted (owned resources)
    if (await this.hosted.has(rxl)) {
      return this.hosted.get(rxl);
    }

    // 3. Check cache (mirror)
    if (await this.cache.has(rxl)) {
      return this.cache.get(rxl);
    }

    // 4. localhost: not found
    if (domain === "localhost") {
      throw new RegistryError(`Resource not found: ${locator}`);
    }

    // 5. Remote: fetch and cache
    const rxr = await this.fetchRemote(locator, domain);
    await this.cache.put(rxr);
    return rxr;
  }

  async push(_rxr: RXR): Promise<void> {
    // TODO: Implement push to remote
    throw new RegistryError("Push not implemented yet");
  }

  async pull(locator: string): Promise<RXR> {
    const rxl = parse(locator);
    const domain = rxl.domain ?? "localhost";

    if (domain === "localhost") {
      throw new RegistryError("Cannot pull localhost resources");
    }

    const rxr = await this.fetchRemote(locator, domain);
    await this.cache.put(rxr);
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
        return this.executeResolver<TResult>(handler.code, rxr, args);
      },
    } as ResolvedResource<TArgs, TResult>;
  }

  // ===== Level 2: CRUD =====

  async remove(locator: string): Promise<void> {
    const rxl = parse(locator);

    // Try to remove from all registries
    if (await this.linked.has(rxl)) {
      await this.linked.remove(rxl);
    }
    if (await this.hosted.has(rxl)) {
      await this.hosted.remove(rxl);
    }
    if (await this.cache.has(rxl)) {
      await this.cache.remove(rxl);
    }
  }

  async has(locator: string): Promise<boolean> {
    const rxl = parse(locator);

    return (
      (await this.linked.has(rxl)) || (await this.hosted.has(rxl)) || (await this.cache.has(rxl))
    );
  }

  // ===== Level 3: Dev =====

  async link(path: string): Promise<RXL> {
    return this.linked.link(path);
  }

  async load(path: string): Promise<RXR> {
    return loadResource(path);
  }

  // ===== Level 4: Search =====

  async search(options?: SearchOptions): Promise<RXL[]> {
    // Combine results from all registries
    const [linkedResults, hostedResults, cacheResults] = await Promise.all([
      this.linked.list(options),
      this.hosted.list(options),
      this.cache.list(options),
    ]);

    // Deduplicate by locator string
    const seen = new Set<string>();
    const results: RXL[] = [];

    for (const rxl of [...linkedResults, ...hostedResults, ...cacheResults]) {
      const key = format(rxl);
      if (!seen.has(key)) {
        seen.add(key);
        results.push(rxl);
      }
    }

    // Apply limit after deduplication
    if (options?.limit !== undefined) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  // ===== Level 5: Extension =====

  supportType(type: BundledType): void {
    this.typeHandler.register(type);
  }

  // ===== Private methods =====

  /**
   * Fetch resource from remote.
   */
  private async fetchRemote(locator: string, domain: string): Promise<RXR> {
    // Try mirror first
    if (this.mirror) {
      try {
        return await this.fetchFromEndpoint(this.mirror, locator);
      } catch {
        // Mirror miss, continue to source
      }
    }

    // Discover source via well-known
    const endpoint = await this.discoverEndpoint(domain);
    return this.fetchFromEndpoint(endpoint, locator);
  }

  /**
   * Discover registry endpoint for domain.
   */
  private async discoverEndpoint(domain: string): Promise<string> {
    const cached = this.discoveryCache.get(domain);
    if (cached) return cached;

    const result = await discoverRegistry(domain);
    const endpoint = result.registries[0];
    this.discoveryCache.set(domain, endpoint);

    return endpoint;
  }

  /**
   * Fetch resource from endpoint.
   */
  private async fetchFromEndpoint(endpoint: string, locator: string): Promise<RXR> {
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

    const manifestData = await manifestResponse.json();

    // Import dynamically to avoid circular deps
    const {
      manifest: createManifest,
      wrap,
      resource: createResource,
    } = await import("@resourcexjs/core");

    const rxm = createManifest(manifestData);

    // Fetch content
    const contentUrl = `${baseUrl}/content?locator=${encodeURIComponent(locator)}`;
    const contentResponse = await fetch(contentUrl);

    if (!contentResponse.ok) {
      throw new RegistryError(`Failed to fetch content: ${contentResponse.statusText}`);
    }

    const contentBuffer = Buffer.from(await contentResponse.arrayBuffer());
    const rxa = wrap(contentBuffer);

    return createResource(rxm, rxa);
  }

  /**
   * Execute resolver code.
   *
   * Bundled code format:
   * ```
   * // @resolver: variable_name
   * // source file comment
   * var variable_name = { ... };
   * ```
   */
  private async executeResolver<TResult>(code: string, rxr: RXR, args?: unknown): Promise<TResult> {
    // Import extract dynamically
    const { extract } = await import("@resourcexjs/core");
    const filesRecord = await extract(rxr.archive);

    // Convert Buffer to Uint8Array
    const files: Record<string, Uint8Array> = {};
    for (const [path, buffer] of Object.entries(filesRecord)) {
      files[path] = new Uint8Array(buffer);
    }

    // Build context
    const context = {
      manifest: {
        domain: rxr.manifest.domain,
        path: rxr.manifest.path,
        name: rxr.manifest.name,
        type: rxr.manifest.type,
        version: rxr.manifest.version,
      },
      files,
    };

    // Execute based on isolator
    if (this.isolator === "none") {
      // Direct execution (no sandbox)
      // Extract resolver variable name from code comment
      const resolverMatch = code.match(/\/\/ @resolver: (\w+)/);

      if (resolverMatch) {
        // Bundled code format: var xxx = {...};
        const resolverName = resolverMatch[1];
        const evalCode = `
          ${code}
          ${resolverName};
        `;
        const resolver = eval(evalCode);
        return resolver.resolve(context, args);
      } else {
        // Simple object literal format: ({ resolve(ctx) {...} })
        const resolver = eval(`(${code})`);
        return resolver.resolve(context, args);
      }
    } else {
      // Use sandbox
      const { createSandbox } = await import("sandboxxjs");
      const sandbox = createSandbox({ type: this.isolator });

      // Extract resolver variable name
      const resolverMatch = code.match(/\/\/ @resolver: (\w+)/);
      const resolverName = resolverMatch ? resolverMatch[1] : "resolver";

      const script = resolverMatch
        ? `
          ${code}
          const ctx = ${JSON.stringify(context)};
          const args = ${JSON.stringify(args)};
          const result = await ${resolverName}.resolve(ctx, args);
          console.log(JSON.stringify(result));
        `
        : `
          const resolver = ${code};
          const ctx = ${JSON.stringify(context)};
          const args = ${JSON.stringify(args)};
          const result = await resolver.resolve(ctx, args);
          console.log(JSON.stringify(result));
        `;

      const result = await sandbox.execute(script);
      return JSON.parse(result.stdout) as TResult;
    }
  }
}

/**
 * Create a ResourceX client instance.
 *
 * @example
 * ```typescript
 * // Default configuration
 * const rx = createResourceX();
 *
 * // With mirror
 * const rx = createResourceX({
 *   mirror: "https://cn.deepractice.ai"
 * });
 *
 * // With custom types
 * const rx = createResourceX({
 *   types: [myCustomType]
 * });
 * ```
 */
export function createResourceX(config?: ResourceXConfig): ResourceX {
  return new DefaultResourceX(config);
}
