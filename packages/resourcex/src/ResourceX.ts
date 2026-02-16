/**
 * ResourceX - Unified Resource Management API
 *
 * User-facing API that hides internal objects (RXR, RXL, RXM, RXA).
 * Users only interact with:
 * - path: local directory
 * - locator: resource identifier string
 */

/* global FormData, Blob */

import type {
  BundledType,
  IsolatorType,
  ProviderConfig,
  ResourceXProvider,
  RXR,
  TypeDetector,
} from "@resourcexjs/core";
import {
  CASRegistry,
  extract,
  format,
  parse,
  RegistryError,
  resolveSource,
  SourceLoaderChain,
  TypeHandlerChain,
} from "@resourcexjs/core";
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

  /**
   * Custom type detectors for auto-detection.
   * Built-in detectors (resource.json, SKILL.md) are always included.
   */
  detectors?: TypeDetector[];
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
 * Internal executable - lazy execution wrapper.
 */
interface Executable<T = unknown> {
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
  resolve<T = unknown>(locator: string, args?: unknown): Promise<T>;
  ingest<T = unknown>(source: string, args?: unknown): Promise<T>;
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
  private readonly customDetectors: TypeDetector[];
  private readonly loaderChain: SourceLoaderChain;

  constructor(config?: ResourceXConfig) {
    this.provider = getProvider();
    this.providerConfig = { path: config?.path };
    this.registryUrl = config?.registry;
    this.isolator = config?.isolator ?? "none";
    this.customDetectors = config?.detectors ?? [];

    // Initialize type handler
    this.typeHandler = TypeHandlerChain.create();
    if (config?.types) {
      for (const type of config.types) {
        this.typeHandler.register(type);
      }
    }

    // Initialize loader chain
    this.loaderChain = SourceLoaderChain.create();
    const providerLoader = this.provider.createSourceLoader?.(this.providerConfig);
    if (providerLoader) {
      this.loaderChain.register(providerLoader);
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
    // Use resolveSource pipeline with auto-detection
    const rxr = await resolveSource(path, {
      loaderChain: this.loaderChain,
      detectors: this.customDetectors,
    });

    // Local resources should not have registry
    if (rxr.manifest.registry) {
      const { manifest: createManifest, resource: createResource } = await import(
        "@resourcexjs/core"
      );
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

  async resolve<T = unknown>(locator: string, args?: unknown): Promise<T> {
    const executable = await this.prepareExecutable<T>(locator);
    return executable.execute(args);
  }

  async ingest<T = unknown>(source: string, args?: unknown): Promise<T> {
    // Check if input is a loadable source (directory, URL, etc.)
    const isSource = await this.canLoadSource(source);

    if (isSource) {
      // Source: add to CAS first, then resolve
      const resource = await this.add(source);
      return this.resolve<T>(resource.locator, args);
    }

    // RXL locator: resolve directly
    return this.resolve<T>(source, args);
  }

  /**
   * Check if input is a loadable source (directory, URL, etc.)
   * by delegating to the loader chain.
   */
  private async canLoadSource(source: string): Promise<boolean> {
    return this.loaderChain.canLoad(source);
  }

  /**
   * Internal: prepare an executable from a locator (lazy resolution).
   */
  private async prepareExecutable<T = unknown>(locator: string): Promise<Executable<T>> {
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
      ),
      "manifest.json"
    );

    const archiveBuffer = await rxr.archive.buffer();
    formData.append(
      "content",
      new Blob([archiveBuffer], { type: "application/octet-stream" }),
      "archive.tar.gz"
    );

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
