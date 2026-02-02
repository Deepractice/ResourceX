/**
 * ResourceX - Unified Resource Management API
 *
 * User-facing API that hides internal objects (RXR, RXL, RXM, RXA).
 * Users only interact with:
 * - path: local directory
 * - locator: resource identifier string
 */

import type { RXR, ResourceXProvider, ProviderConfig } from "@resourcexjs/core";
import {
  parse,
  format,
  extract,
  TypeHandlerChain,
  CASRegistry,
  RegistryError,
  loadResource,
} from "@resourcexjs/core";
import type { BundledType, IsolatorType } from "@resourcexjs/core";
import { getProvider, hasProvider } from "./provider.js";

/**
 * Normalize registry URL to host:port format.
 */
function normalizeRegistryUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const port = parsed.port;
    const protocol = parsed.protocol;

    const isDefaultPort =
      (protocol === "http:" && (port === "" || port === "80")) ||
      (protocol === "https:" && (port === "" || port === "443"));

    if (isDefaultPort || !port) {
      return host;
    }
    return `${host}:${port}`;
  } catch {
    return url;
  }
}

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
   * Central registry URL.
   * Required for push/pull operations.
   */
  registry?: string;

  /**
   * Additional custom resource types.
   * Built-in types (text, json, binary) are always included.
   */
  types?: BundledType[];

  /**
   * Isolator type for resolver execution.
   */
  isolator?: IsolatorType;
}

/**
 * Resource - user-facing resource object.
 */
export interface Resource {
  locator: string;
  registry?: string;
  path?: string;
  name: string;
  type: string;
  tag: string;
  files?: string[];
}

/**
 * Executable resource - result of use().
 */
export interface Executable<T = unknown> {
  execute: (args?: unknown) => Promise<T>;
  schema?: unknown;
}

/**
 * ResourceX interface - unified API for resource management.
 */
export interface ResourceX {
  add(path: string): Promise<Resource>;
  has(locator: string): Promise<boolean>;
  info(locator: string): Promise<Resource>;
  remove(locator: string): Promise<void>;
  use<T = unknown>(locator: string): Promise<Executable<T>>;
  search(query?: string): Promise<string[]>;
  push(locator: string): Promise<void>;
  pull(locator: string): Promise<void>;
  clearCache(registry?: string): Promise<void>;
  supportType(type: BundledType): void;
}

/**
 * Default ResourceX implementation using CASRegistry.
 */
class DefaultResourceX implements ResourceX {
  private readonly registryUrl?: string;
  private readonly typeHandler: TypeHandlerChain;
  private readonly isolator: IsolatorType;
  private readonly cas: CASRegistry;
  private readonly provider: ResourceXProvider;
  private readonly providerConfig: ProviderConfig;

  constructor(config?: ResourceXConfig) {
    this.provider = getProvider();
    this.providerConfig = { path: config?.path };
    this.registryUrl = config?.registry;
    this.isolator = config?.isolator ?? "none";

    // Initialize type handler
    this.typeHandler = TypeHandlerChain.create();
    if (config?.types) {
      for (const type of config.types) {
        this.typeHandler.register(type);
      }
    }

    // Initialize CAS stores via provider
    const stores = this.provider.createStores(this.providerConfig);
    this.cas = new CASRegistry(stores.rxaStore, stores.rxmStore);
  }

  /**
   * Convert RXR to user-facing Resource.
   */
  private toResource(rxr: RXR): Resource {
    return {
      locator: format(rxr.locator),
      registry: rxr.manifest.registry,
      path: rxr.manifest.path,
      name: rxr.manifest.name,
      type: rxr.manifest.type,
      tag: rxr.manifest.tag,
      files: rxr.manifest.files,
    };
  }

  async add(path: string): Promise<Resource> {
    // Use provider's loader if available, otherwise use default
    const loader = this.provider.createLoader?.(this.providerConfig);
    const rxr = loader ? await loader.load(path) as RXR : await loadResource(path);

    // Local resources should not have registry
    if (rxr.manifest.registry) {
      const { manifest: createManifest, resource: createResource } =
        await import("@resourcexjs/core");
      const newManifest = createManifest({
        registry: undefined,
        path: rxr.manifest.path,
        name: rxr.manifest.name,
        type: rxr.manifest.type,
        version: rxr.manifest.tag,
      });
      const newRxr = createResource(newManifest, rxr.archive);
      await this.cas.put(newRxr);
      return this.toResource(newRxr);
    }

    await this.cas.put(rxr);
    return this.toResource(rxr);
  }

  async has(locator: string): Promise<boolean> {
    const rxl = parse(locator);
    return this.cas.has(rxl);
  }

  async info(locator: string): Promise<Resource> {
    const rxl = parse(locator);
    const rxr = await this.cas.get(rxl);

    const filesRecord = await extract(rxr.archive);
    const files = Object.keys(filesRecord);

    return {
      locator: format(rxr.locator),
      registry: rxr.manifest.registry,
      path: rxr.manifest.path,
      name: rxr.manifest.name,
      type: rxr.manifest.type,
      tag: rxr.manifest.tag,
      files,
    };
  }

  async remove(locator: string): Promise<void> {
    const rxl = parse(locator);
    await this.cas.remove(rxl);
  }

  async use<T = unknown>(locator: string): Promise<Executable<T>> {
    const rxl = parse(locator);
    let rxr: RXR;

    try {
      rxr = await this.cas.get(rxl);
    } catch (error) {
      // Auto-pull if not found locally
      if (!rxl.registry && this.registryUrl) {
        const normalizedRegistry = normalizeRegistryUrl(this.registryUrl);
        try {
          rxr = await this.fetchFromRegistry(format(rxl), this.registryUrl, normalizedRegistry);
          await this.cas.put(rxr);
        } catch {
          throw error;
        }
      } else if (rxl.registry) {
        const registryUrl = `http://${rxl.registry}`;
        const locatorWithoutRegistry = format({ ...rxl, registry: undefined });
        try {
          rxr = await this.fetchFromRegistry(locatorWithoutRegistry, registryUrl, rxl.registry);
          await this.cas.put(rxr);
        } catch {
          throw error;
        }
      } else {
        throw error;
      }
    }

    const handler = this.typeHandler.getHandler(rxr.manifest.type);

    return {
      schema: handler.schema,
      execute: async (args?: unknown) => {
        return this.executeResolver<T>(handler.code, rxr, args);
      },
    };
  }

  async search(query?: string): Promise<string[]> {
    const results = await this.cas.list(query ? { query } : undefined);
    return results.map((rxl) => format(rxl));
  }

  async push(locator: string): Promise<void> {
    if (!this.registryUrl) {
      throw new RegistryError("Registry URL not configured. Set 'registry' in config.");
    }

    const rxl = parse(locator);
    const rxr = await this.cas.get(rxl);
    await this.publishToRegistry(rxr);
  }

  async pull(locator: string): Promise<void> {
    if (!this.registryUrl) {
      throw new RegistryError("Registry URL not configured. Set 'registry' in config.");
    }

    const normalizedRegistry = normalizeRegistryUrl(this.registryUrl);
    const rxr = await this.fetchFromRegistry(locator, this.registryUrl, normalizedRegistry);
    await this.cas.put(rxr);
  }

  async clearCache(registry?: string): Promise<void> {
    await this.cas.clearCache(registry);
  }

  supportType(type: BundledType): void {
    this.typeHandler.register(type);
  }

  async putResource(rxr: RXR): Promise<Resource> {
    await this.cas.put(rxr);
    return this.toResource(rxr);
  }

  async getArchive(locator: string): Promise<Buffer> {
    const rxl = parse(locator);
    const rxr = await this.cas.get(rxl);
    return rxr.archive.buffer();
  }

  // ===== Private methods =====

  private async publishToRegistry(rxr: RXR): Promise<void> {
    const baseUrl = this.registryUrl!.replace(/\/$/, "");
    const publishUrl = `${baseUrl}/api/v1/publish`;

    const formData = new FormData();
    formData.append("locator", format(rxr.locator));
    formData.append(
      "manifest",
      new Blob(
        [
          JSON.stringify({
            registry: rxr.manifest.registry,
            path: rxr.manifest.path,
            name: rxr.manifest.name,
            type: rxr.manifest.type,
            tag: rxr.manifest.tag,
          }),
        ],
        { type: "application/json" }
      )
    );

    const archiveBuffer = await rxr.archive.buffer();
    formData.append("content", new Blob([archiveBuffer], { type: "application/octet-stream" }));

    const response = await fetch(publishUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new RegistryError(`Failed to publish: ${response.statusText}`);
    }
  }

  private async fetchFromRegistry(
    locator: string,
    registryUrl: string,
    normalizedRegistry?: string
  ): Promise<RXR> {
    const baseUrl = registryUrl.replace(/\/$/, "");
    const registry = normalizedRegistry ?? normalizeRegistryUrl(registryUrl);

    const manifestUrl = `${baseUrl}/api/v1/resource/${encodeURIComponent(locator)}`;
    const manifestResponse = await fetch(manifestUrl);

    if (!manifestResponse.ok) {
      if (manifestResponse.status === 404) {
        throw new RegistryError(`Resource not found: ${locator}`);
      }
      throw new RegistryError(`Failed to fetch resource: ${manifestResponse.statusText}`);
    }

    const manifestData = (await manifestResponse.json()) as {
      registry?: string;
      path?: string;
      name: string;
      type: string;
      tag: string;
    };

    const {
      manifest: createManifest,
      wrap,
      resource: createResource,
    } = await import("@resourcexjs/core");

    const rxm = createManifest({
      registry: registry,
      path: manifestData.path,
      name: manifestData.name,
      type: manifestData.type,
      tag: manifestData.tag,
    });

    const contentUrl = `${baseUrl}/api/v1/content/${encodeURIComponent(locator)}`;
    const contentResponse = await fetch(contentUrl);

    if (!contentResponse.ok) {
      throw new RegistryError(`Failed to fetch content: ${contentResponse.statusText}`);
    }

    const contentBuffer = Buffer.from(await contentResponse.arrayBuffer());
    const rxa = wrap(contentBuffer);

    return createResource(rxm, rxa);
  }

  private async executeResolver<TResult>(code: string, rxr: RXR, args?: unknown): Promise<TResult> {
    const filesRecord = await extract(rxr.archive);

    const files: Record<string, Uint8Array> = {};
    for (const [filePath, buffer] of Object.entries(filesRecord)) {
      files[filePath] = new Uint8Array(buffer);
    }

    const context = {
      manifest: {
        registry: rxr.manifest.registry,
        path: rxr.manifest.path,
        name: rxr.manifest.name,
        type: rxr.manifest.type,
        version: rxr.manifest.tag,
      },
      files,
    };

    if (this.isolator === "none") {
      const resolverMatch = code.match(/\/\/ @resolver: (\w+)/);

      if (resolverMatch) {
        const resolverName = resolverMatch[1];
        const evalCode = `
          ${code}
          ${resolverName};
        `;
        const resolver = eval(evalCode);
        return resolver.resolve(context, args);
      } else {
        const resolver = eval(`(${code})`);
        return resolver.resolve(context, args);
      }
    } else {
      const { createSandbox } = await import("sandboxxjs");
      const sandbox = createSandbox({ type: this.isolator } as any);

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
 * Requires a provider to be set first via setProvider() or by importing
 * a platform entry point like 'resourcexjs/node'.
 */
export function createResourceX(config?: ResourceXConfig): ResourceX {
  if (!hasProvider()) {
    throw new Error(
      "No ResourceX provider configured. " +
        'Import a platform entry point (e.g., "resourcexjs/node") or call setProvider() first.'
    );
  }
  return new DefaultResourceX(config);
}
