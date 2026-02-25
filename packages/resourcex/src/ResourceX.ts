/**
 * ResourceX - Unified Resource Management API
 *
 * User-facing API that hides internal objects (RXR, RXI, RXM, RXA).
 * Users only interact with:
 * - path: local directory
 * - locator: resource identifier string
 */

/* global FormData, Blob */

import type {
  BundledType,
  FileTree,
  IsolatorType,
  ProviderConfig,
  RegistryEntry,
  ResourceXProvider,
  RXL,
  RXM,
  RXMArchive,
  RXMDefinition,
  RXMSource,
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
 * Build a structured file tree from flat file paths.
 */
function buildFileTree(files: Record<string, Buffer>): FileTree {
  const tree: Record<string, any> = {};

  for (const [filePath, buffer] of Object.entries(files)) {
    const parts = filePath.split("/");
    let current = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const dirKey = `${parts[i]}/`;
      if (!current[dirKey]) {
        current[dirKey] = {};
      }
      current = current[dirKey];
    }

    const fileName = parts[parts.length - 1];
    current[fileName] = { size: buffer.length };
  }

  return tree as FileTree;
}

/**
 * Primary content file names in priority order.
 */
const PRIMARY_FILES = ["SKILL.md", "content", "README.md", "index.md"];

/**
 * Max preview length in characters.
 */
const PREVIEW_MAX_LENGTH = 500;

/**
 * Extract a content preview from the primary file.
 */
function extractPreview(files: Record<string, Buffer>): string | null {
  for (const name of PRIMARY_FILES) {
    const buffer = files[name];
    if (buffer) {
      const text = buffer.toString("utf-8");
      if (text.length <= PREVIEW_MAX_LENGTH) return text;
      return text.slice(0, PREVIEW_MAX_LENGTH);
    }
  }

  // Fallback: try the first text-like file
  for (const [name, buffer] of Object.entries(files)) {
    if (/\.(md|txt|feature|json|ya?ml|toml)$/i.test(name) || !name.includes(".")) {
      const text = buffer.toString("utf-8");
      if (text.length <= PREVIEW_MAX_LENGTH) return text;
      return text.slice(0, PREVIEW_MAX_LENGTH);
    }
  }

  return null;
}

/** Built-in default registry — always available as fallback. */
const DEFAULT_REGISTRY = "https://registry.deepractice.dev";

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
 * Structured by RX primitives: definition, archive, source.
 */
export interface Resource {
  locator: string;
  definition: RXMDefinition;
  archive: RXMArchive;
  source: RXMSource;
}

/**
 * Internal executable - lazy execution wrapper.
 */
interface Executable<T = unknown> {
  execute: (args?: unknown) => Promise<T>;
  schema?: unknown;
}

/**
 * Options for push/pull operations.
 */
export interface RegistryOptions {
  /**
   * Registry URL override for this operation.
   * Takes precedence over the default registry.
   */
  registry?: string;
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
  ingest<T = unknown>(locator: RXL, args?: unknown): Promise<T>;
  search(query?: string): Promise<string[]>;
  push(locator: string, options?: RegistryOptions): Promise<RXM>;
  pull(locator: string, options?: RegistryOptions): Promise<void>;
  clearCache(registry?: string): Promise<void>;
  supportType(type: BundledType): void;
  registries(): RegistryEntry[];
  addRegistry(name: string, url: string, setDefault?: boolean): void;
  removeRegistry(name: string): void;
  setDefaultRegistry(name: string): void;
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
      locator: format(rxr.identifier),
      definition: rxr.manifest.definition,
      archive: rxr.manifest.archive,
      source: rxr.manifest.source,
    };
  }

  async add(path: string): Promise<Resource> {
    // Use resolveSource pipeline with auto-detection
    const rxr = await resolveSource(path, {
      loaderChain: this.loaderChain,
      detectors: this.customDetectors,
    });

    // Local resources should not have registry
    if (rxr.manifest.definition.registry) {
      const { manifest: createManifest, resource: createResource } = await import(
        "@resourcexjs/core"
      );
      const newManifest = createManifest({
        registry: undefined,
        path: rxr.manifest.definition.path,
        name: rxr.manifest.definition.name,
        type: rxr.manifest.definition.type,
        tag: rxr.manifest.definition.tag,
      });
      const newRxr = createResource(newManifest, rxr.archive);
      await this.cas.put(newRxr);
      const res = this.toResource(newRxr);

      return res;
    }

    await this.cas.put(rxr);
    const res = this.toResource(rxr);

    return res;
  }

  async has(locator: string): Promise<boolean> {
    const rxl = parse(locator);
    return this.cas.has(rxl);
  }

  async info(locator: string): Promise<Resource> {
    const rxl = parse(locator);
    const rxr = await this.cas.get(rxl);

    const filesRecord = await extract(rxr.archive);
    const fileTree = buildFileTree(filesRecord);
    const preview = extractPreview(filesRecord);

    return {
      locator: format(rxr.identifier),
      definition: rxr.manifest.definition,
      archive: rxr.manifest.archive,
      source: {
        files: fileTree,
        preview: preview ?? undefined,
      },
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

  async ingest<T = unknown>(locator: RXL, args?: unknown): Promise<T> {
    // Check if input is a loadable source (directory, URL, etc.)
    const isSource = await this.loaderChain.canLoad(locator);

    if (isSource) {
      // Always re-add from source — CAS deduplicates identical content
      const resource = await this.add(locator);
      return this.resolve<T>(resource.locator, args);
    }

    // RXI identifier: resolve directly
    return this.resolve<T>(locator, args);
  }

  /**
   * Internal: prepare an executable from a locator (lazy resolution).
   */
  private async prepareExecutable<T = unknown>(locator: string): Promise<Executable<T>> {
    const rxl = parse(locator);
    let rxr: RXR;

    try {
      rxr = await this.cas.get(rxl);

      // Freshness check: if resource came from a registry, verify digest is still current
      if (rxl.registry) {
        const stale = await this.isRegistryCacheStale(rxl, rxr);
        if (stale) {
          const protocol = rxl.registry.startsWith("localhost") ? "http" : "https";
          const registryUrl = `${protocol}://${rxl.registry}`;
          const locatorWithoutRegistry = format({ ...rxl, registry: undefined });
          rxr = await this.fetchFromRegistry(locatorWithoutRegistry, registryUrl, rxl.registry);
          await this.cas.put(rxr);
        }
      }
    } catch (error) {
      if (rxl.registry) {
        // Pinned registry — fetch from the specified registry only
        const protocol = rxl.registry.startsWith("localhost") ? "http" : "https";
        const registryUrl = `${protocol}://${rxl.registry}`;
        const locatorWithoutRegistry = format({ ...rxl, registry: undefined });
        try {
          rxr = await this.fetchFromRegistry(locatorWithoutRegistry, registryUrl, rxl.registry);
          await this.cas.put(rxr);
        } catch {
          throw error;
        }
      } else {
        // No registry prefix — try registry chain in order
        const pulled = await this.pullFromChain(format(rxl));
        if (!pulled) throw error;
        rxr = pulled;
      }
    }

    const handler = this.typeHandler.getHandler(rxr.manifest.definition.type);

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

  async push(locator: string, options?: RegistryOptions): Promise<RXM> {
    const registry = options?.registry ?? this.registryUrl;
    if (!registry) {
      throw new RegistryError("Registry URL not configured. Set 'registry' in config.");
    }

    const rxl = parse(locator);
    const rxr = await this.cas.get(rxl);
    await this.publishToRegistry(rxr, registry);
    return rxr.manifest;
  }

  async pull(locator: string, options?: RegistryOptions): Promise<void> {
    const registry = options?.registry ?? this.registryUrl;
    if (!registry) {
      throw new RegistryError("Registry URL not configured. Set 'registry' in config.");
    }

    const normalizedRegistry = normalizeRegistryUrl(registry);
    const rxr = await this.fetchFromRegistry(locator, registry, normalizedRegistry);
    await this.cas.put(rxr);
  }

  async clearCache(registry?: string): Promise<void> {
    await this.cas.clearCache(registry);
  }

  supportType(type: BundledType): void {
    this.typeHandler.register(type);
  }

  registries(): RegistryEntry[] {
    return this.provider.getRegistries?.(this.providerConfig) ?? [];
  }

  addRegistry(name: string, url: string, setDefault?: boolean): void {
    if (!this.provider.addRegistry) {
      throw new Error("Provider does not support registry management");
    }
    this.provider.addRegistry(this.providerConfig, name, url, setDefault);
  }

  removeRegistry(name: string): void {
    if (!this.provider.removeRegistry) {
      throw new Error("Provider does not support registry management");
    }
    this.provider.removeRegistry(this.providerConfig, name);
  }

  setDefaultRegistry(name: string): void {
    if (!this.provider.setDefaultRegistry) {
      throw new Error("Provider does not support registry management");
    }
    this.provider.setDefaultRegistry(this.providerConfig, name);
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

  private async publishToRegistry(rxr: RXR, registryUrl: string): Promise<void> {
    const baseUrl = registryUrl.replace(/\/$/, "");
    const publishUrl = `${baseUrl}/api/v1/publish`;

    const formData = new FormData();
    formData.append("locator", format(rxr.identifier));
    formData.append(
      "manifest",
      new Blob(
        [
          JSON.stringify({
            registry: rxr.manifest.definition.registry,
            path: rxr.manifest.definition.path,
            name: rxr.manifest.definition.name,
            type: rxr.manifest.definition.type,
            tag: rxr.manifest.definition.tag,
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

  /**
   * Try each registry in the chain until one succeeds.
   * Order: configured registries → built-in default.
   */
  private async pullFromChain(locator: string): Promise<RXR | null> {
    const entries = this.registries();
    const urls = entries.map((e) => e.url);

    // Append built-in default if not already in the list
    const defaultUrl = DEFAULT_REGISTRY;
    const normalizedUrls = urls.map((u) => normalizeRegistryUrl(u));
    if (!normalizedUrls.includes(normalizeRegistryUrl(defaultUrl))) {
      urls.push(defaultUrl);
    }

    for (const url of urls) {
      const normalized = normalizeRegistryUrl(url);
      try {
        // Check if we already have a cached version from this registry
        const rxlWithRegistry = parse(`${normalized}/${locator}`);
        const stored = await this.cas.getStoredManifest(rxlWithRegistry);

        if (stored?.digest) {
          // Have cache — check remote digest before downloading content
          const remoteDigest = await this.fetchRemoteDigest(locator, url);
          if (remoteDigest && stored.digest === remoteDigest) {
            return this.cas.get(rxlWithRegistry);
          }
        }

        const rxr = await this.fetchFromRegistry(locator, url, normalized);
        await this.cas.put(rxr);
        return rxr;
      } catch {
        // Try next registry
      }
    }
    return null;
  }

  /**
   * Check if a cached registry resource is stale by comparing local digest with remote.
   * Returns true if stale (remote has different digest), false if fresh.
   * On network errors, returns false (use cache as fallback).
   */
  private async isRegistryCacheStale(rxl: ReturnType<typeof parse>, rxr: RXR): Promise<boolean> {
    const localDigest = rxr.manifest.archive.digest;
    if (!localDigest) return true; // No local digest — assume stale

    try {
      const protocol = rxl.registry!.startsWith("localhost") ? "http" : "https";
      const registryUrl = `${protocol}://${rxl.registry}`;
      const locatorWithoutRegistry = format({ ...rxl, registry: undefined });
      const remoteDigest = await this.fetchRemoteDigest(locatorWithoutRegistry, registryUrl);
      if (!remoteDigest) return true; // Remote doesn't return digest — assume stale
      return localDigest !== remoteDigest;
    } catch {
      // Network error — use cache as fallback
      return false;
    }
  }

  /**
   * Fetch only the manifest from a registry to get the digest (no content download).
   */
  private async fetchRemoteDigest(
    locator: string,
    registryUrl: string
  ): Promise<string | undefined> {
    const baseUrl = registryUrl.replace(/\/$/, "");
    const manifestUrl = `${baseUrl}/api/v1/resource/${encodeURIComponent(locator)}`;
    const response = await fetch(manifestUrl);
    if (!response.ok) return undefined;
    const data = (await response.json()) as { digest?: string };
    return data.digest;
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
      digest?: string;
    };

    const {
      manifest: createManifest,
      wrap,
      resource: createResource,
    } = await import("@resourcexjs/core");

    const baseRxm = createManifest({
      registry,
      path: manifestData.path,
      name: manifestData.name,
      type: manifestData.type,
      tag: manifestData.tag,
    });

    // Inject digest from server response into archive metadata
    const rxm = manifestData.digest
      ? { ...baseRxm, archive: { ...baseRxm.archive, digest: manifestData.digest } }
      : baseRxm;

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
        registry: rxr.manifest.definition.registry,
        path: rxr.manifest.definition.path,
        name: rxr.manifest.definition.name,
        type: rxr.manifest.definition.type,
        tag: rxr.manifest.definition.tag,
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
 *
 * When registry is not explicitly provided, the provider's getDefaults()
 * is consulted for environment variables and config file defaults.
 */
export function createResourceX(config?: ResourceXConfig): ResourceX {
  if (!hasProvider()) {
    throw new Error(
      "No ResourceX provider configured. " +
        'Import a platform entry point (e.g., "resourcexjs/node") or call setProvider() first.'
    );
  }

  // Resolve registry from provider defaults when not explicitly provided
  if (config?.registry === undefined) {
    const provider = getProvider();
    const defaults = provider.getDefaults?.({ path: config?.path });
    if (defaults?.registry) {
      config = { ...config, registry: defaults.registry };
    }
  }

  return new DefaultResourceX(config);
}
