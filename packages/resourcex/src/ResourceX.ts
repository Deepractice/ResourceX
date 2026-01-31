/**
 * ResourceX - Unified Resource Management API
 *
 * User-facing API that hides internal objects (RXR, RXL, RXM, RXA).
 * Users only interact with:
 * - path: local directory
 * - locator: resource identifier string
 */

import { homedir } from "node:os";
import { join } from "node:path";
import type { RXR } from "@resourcexjs/core";
import { parse, format, extract } from "@resourcexjs/core";
import type { BundledType, IsolatorType } from "@resourcexjs/type";
import { TypeHandlerChain } from "@resourcexjs/type";
import { FileSystemStorage } from "@resourcexjs/storage";
import {
  HostedRegistry,
  MirrorRegistry,
  LinkedRegistry,
  RegistryError,
} from "@resourcexjs/registry";
import type { SearchOptions } from "@resourcexjs/registry";
import { loadResource } from "@resourcexjs/loader";

const DEFAULT_BASE_PATH = `${homedir()}/.resourcex`;
const DEFAULT_DOMAIN = "localhost";

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
   * Default domain for resources.
   * Used when locator doesn't include domain.
   * Default: "localhost"
   */
  domain?: string;

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
   * - "none": No isolation (default)
   * - "srt": OS-level isolation
   * - "cloudflare": Container isolation
   * - "e2b": MicroVM isolation
   */
  isolator?: IsolatorType;
}

/**
 * Resource - user-facing resource object.
 *
 * Three forms of resource reference:
 * - path: local directory (e.g., "./my-prompt")
 * - locator: identifier string (e.g., "hello.text@1.0.0")
 * - resource: this object with full metadata
 */
export interface Resource {
  /** Full locator string (e.g., "localhost/hello.text@1.0.0") */
  locator: string;

  /** Resource domain */
  domain: string;

  /** Resource path within domain (optional) */
  path?: string;

  /** Resource name */
  name: string;

  /** Resource type (e.g., "text", "json") */
  type: string;

  /** Semantic version */
  version: string;

  /** File list in the resource archive */
  files?: string[];
}

/**
 * Executable resource - result of resolve().
 */
export interface Executable<T = unknown> {
  /**
   * Execute the resource resolver.
   */
  execute: (args?: unknown) => Promise<T>;

  /**
   * JSON schema for arguments (if any).
   */
  schema?: unknown;
}

/**
 * ResourceX interface - unified API for resource management.
 *
 * Users interact only with:
 * - path: local directory
 * - locator: resource identifier string (e.g., "hello.text@1.0.0")
 */
export interface ResourceX {
  // ===== Local operations =====

  /**
   * Add resource from directory to local storage.
   * @returns The added resource
   */
  add(path: string): Promise<Resource>;

  /**
   * Link development directory (symlink for live editing).
   */
  link(path: string): Promise<void>;

  /**
   * Check if resource exists locally.
   */
  has(locator: string): Promise<boolean>;

  /**
   * Get detailed resource information.
   * @returns Resource with files list
   */
  info(locator: string): Promise<Resource>;

  /**
   * Remove resource from local storage.
   */
  remove(locator: string): Promise<void>;

  /**
   * Resolve resource and return executable.
   * Checks: linked → local → cache → remote
   */
  resolve<T = unknown>(locator: string): Promise<Executable<T>>;

  /**
   * Search local resources.
   * @returns Array of locator strings
   */
  search(query?: string): Promise<string[]>;

  // ===== Remote operations =====

  /**
   * Push local resource to remote registry.
   */
  push(locator: string): Promise<void>;

  /**
   * Pull resource from remote to local cache.
   */
  pull(locator: string): Promise<void>;

  // ===== Extension =====

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
  private readonly domain: string;
  private readonly registry?: string;
  private readonly typeHandler: TypeHandlerChain;
  private readonly isolator: IsolatorType;

  // Three registries
  private readonly local: HostedRegistry;
  private readonly cache: MirrorRegistry;
  private readonly linked: LinkedRegistry;

  constructor(config?: ResourceXConfig) {
    this.basePath = config?.path ?? DEFAULT_BASE_PATH;
    this.domain = config?.domain ?? DEFAULT_DOMAIN;
    this.registry = config?.registry;
    this.isolator = config?.isolator ?? "none";

    // Initialize type handler
    this.typeHandler = TypeHandlerChain.create();
    if (config?.types) {
      for (const type of config.types) {
        this.typeHandler.register(type);
      }
    }

    // Initialize registries with Storage layer
    const localStorage = new FileSystemStorage(join(this.basePath, "local"));
    const cacheStorage = new FileSystemStorage(join(this.basePath, "cache"));

    this.local = new HostedRegistry(localStorage);
    this.cache = new MirrorRegistry(cacheStorage);
    this.linked = new LinkedRegistry(join(this.basePath, "linked"));
  }

  /**
   * Normalize locator by adding default domain if missing.
   */
  private normalizeLocator(locator: string): string {
    // If locator already has domain (contains / before @), return as-is
    const atIndex = locator.indexOf("@");
    const slashIndex = locator.indexOf("/");

    if (slashIndex !== -1 && (atIndex === -1 || slashIndex < atIndex)) {
      // Has domain already
      return locator;
    }

    // Add default domain
    return `${this.domain}/${locator}`;
  }

  /**
   * Convert RXR to user-facing Resource.
   */
  private toResource(rxr: RXR): Resource {
    return {
      locator: format(rxr.locator),
      domain: rxr.manifest.domain,
      path: rxr.manifest.path,
      name: rxr.manifest.name,
      type: rxr.manifest.type,
      version: rxr.manifest.version,
      files: rxr.manifest.files,
    };
  }

  // ===== Directory operations =====

  async add(path: string): Promise<Resource> {
    const rxr = await loadResource(path);

    // Override domain with configured default if not set
    if (!rxr.manifest.domain || rxr.manifest.domain === "localhost") {
      // Update manifest domain
      const { manifest: createManifest, resource: createResource } =
        await import("@resourcexjs/core");
      const newManifest = createManifest({
        domain: this.domain,
        path: rxr.manifest.path,
        name: rxr.manifest.name,
        type: rxr.manifest.type,
        version: rxr.manifest.version,
      });
      const newRxr = createResource(newManifest, rxr.archive);
      await this.local.put(newRxr);
      return this.toResource(newRxr);
    } else {
      await this.local.put(rxr);
      return this.toResource(rxr);
    }
  }

  async link(path: string): Promise<void> {
    await this.linked.link(path);
  }

  async has(locator: string): Promise<boolean> {
    const normalizedLocator = this.normalizeLocator(locator);
    const rxl = parse(normalizedLocator);

    return (
      (await this.linked.has(rxl)) || (await this.local.has(rxl)) || (await this.cache.has(rxl))
    );
  }

  async info(locator: string): Promise<Resource> {
    const normalizedLocator = this.normalizeLocator(locator);
    const rxr = await this.getRxr(normalizedLocator);

    // Extract file list from archive
    const filesRecord = await extract(rxr.archive);
    const files = Object.keys(filesRecord);

    return {
      locator: format(rxr.locator),
      domain: rxr.manifest.domain,
      path: rxr.manifest.path,
      name: rxr.manifest.name,
      type: rxr.manifest.type,
      version: rxr.manifest.version,
      files,
    };
  }

  async remove(locator: string): Promise<void> {
    const normalizedLocator = this.normalizeLocator(locator);
    const rxl = parse(normalizedLocator);

    // Remove from all registries
    if (await this.linked.has(rxl)) {
      await this.linked.remove(rxl);
    }
    if (await this.local.has(rxl)) {
      await this.local.remove(rxl);
    }
    if (await this.cache.has(rxl)) {
      await this.cache.remove(rxl);
    }
  }

  // ===== Resolve =====

  async resolve<T = unknown>(locator: string): Promise<Executable<T>> {
    const normalizedLocator = this.normalizeLocator(locator);
    const rxr = await this.getRxr(normalizedLocator);
    const handler = this.typeHandler.getHandler(rxr.manifest.type);

    return {
      schema: handler.schema,
      execute: async (args?: unknown) => {
        return this.executeResolver<T>(handler.code, rxr, args);
      },
    };
  }

  // ===== Search =====

  async search(query?: string): Promise<string[]> {
    const options: SearchOptions | undefined = query ? { query } : undefined;

    // Combine results from all registries
    const [linkedResults, localResults, cacheResults] = await Promise.all([
      this.linked.list(options),
      this.local.list(options),
      this.cache.list(options),
    ]);

    // Deduplicate and convert to locator strings
    const seen = new Set<string>();
    const results: string[] = [];

    for (const rxl of [...linkedResults, ...localResults, ...cacheResults]) {
      const key = format(rxl);
      if (!seen.has(key)) {
        seen.add(key);
        results.push(key);
      }
    }

    return results;
  }

  // ===== Remote operations =====

  async push(locator: string): Promise<void> {
    if (!this.registry) {
      throw new RegistryError("Registry URL not configured. Set 'registry' in config.");
    }

    const normalizedLocator = this.normalizeLocator(locator);
    const rxr = await this.getRxr(normalizedLocator);

    await this.publishToRegistry(rxr);
  }

  async pull(locator: string): Promise<void> {
    if (!this.registry) {
      throw new RegistryError("Registry URL not configured. Set 'registry' in config.");
    }

    const normalizedLocator = this.normalizeLocator(locator);
    const rxr = await this.fetchFromRegistry(normalizedLocator);
    await this.cache.put(rxr);
  }

  // ===== Extension =====

  supportType(type: BundledType): void {
    this.typeHandler.register(type);
  }

  // ===== Private methods =====

  /**
   * Get RXR from local or remote.
   */
  private async getRxr(locator: string): Promise<RXR> {
    const rxl = parse(locator);

    // 1. Check linked (development priority)
    if (await this.linked.has(rxl)) {
      return this.linked.get(rxl);
    }

    // 2. Check local
    if (await this.local.has(rxl)) {
      return this.local.get(rxl);
    }

    // 3. Check cache
    if (await this.cache.has(rxl)) {
      return this.cache.get(rxl);
    }

    // 4. Try remote if registry configured
    if (this.registry) {
      const rxr = await this.fetchFromRegistry(locator);
      await this.cache.put(rxr);
      return rxr;
    }

    throw new RegistryError(`Resource not found: ${locator}`);
  }

  /**
   * Publish RXR to remote registry via POST /publish.
   */
  private async publishToRegistry(rxr: RXR): Promise<void> {
    const baseUrl = this.registry!.replace(/\/$/, "");
    const publishUrl = `${baseUrl}/publish`;

    // Create multipart form data
    // eslint-disable-next-line no-undef
    const formData = new FormData();
    formData.append("locator", format(rxr.locator));
    formData.append(
      "manifest",
      // eslint-disable-next-line no-undef
      new Blob(
        [
          JSON.stringify({
            domain: rxr.manifest.domain,
            path: rxr.manifest.path,
            name: rxr.manifest.name,
            type: rxr.manifest.type,
            version: rxr.manifest.version,
          }),
        ],
        { type: "application/json" }
      )
    );

    const archiveBuffer = await rxr.archive.buffer();
    // eslint-disable-next-line no-undef
    formData.append("content", new Blob([archiveBuffer], { type: "application/octet-stream" }));

    const response = await fetch(publishUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new RegistryError(`Failed to publish: ${response.statusText}`);
    }
  }

  /**
   * Fetch resource from registry via GET /resource/{locator} and GET /content/{locator}.
   */
  private async fetchFromRegistry(locator: string): Promise<RXR> {
    const baseUrl = this.registry!.replace(/\/$/, "");

    // Fetch manifest
    const manifestUrl = `${baseUrl}/resource/${encodeURIComponent(locator)}`;
    const manifestResponse = await fetch(manifestUrl);

    if (!manifestResponse.ok) {
      if (manifestResponse.status === 404) {
        throw new RegistryError(`Resource not found: ${locator}`);
      }
      throw new RegistryError(`Failed to fetch resource: ${manifestResponse.statusText}`);
    }

    const manifestData = (await manifestResponse.json()) as {
      domain: string;
      path?: string;
      name: string;
      type: string;
      version: string;
    };

    const {
      manifest: createManifest,
      wrap,
      resource: createResource,
    } = await import("@resourcexjs/core");

    const rxm = createManifest({
      domain: manifestData.domain,
      path: manifestData.path,
      name: manifestData.name,
      type: manifestData.type,
      version: manifestData.version,
    });

    // Fetch content
    const contentUrl = `${baseUrl}/content/${encodeURIComponent(locator)}`;
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
   */
  private async executeResolver<TResult>(code: string, rxr: RXR, args?: unknown): Promise<TResult> {
    const filesRecord = await extract(rxr.archive);

    // Convert Buffer to Uint8Array
    const files: Record<string, Uint8Array> = {};
    for (const [filePath, buffer] of Object.entries(filesRecord)) {
      files[filePath] = new Uint8Array(buffer);
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
 * @example
 * ```typescript
 * const rx = createResourceX({
 *   domain: "mycompany.com",
 *   registry: "https://registry.mycompany.com"
 * });
 *
 * // Add from directory to local
 * await rx.add("./my-prompt");
 *
 * // Resolve and execute
 * const result = await rx.resolve("my-prompt.text@1.0.0");
 * await result.execute();
 *
 * // Push to remote registry
 * await rx.push("./my-prompt");
 *
 * // Pull from remote registry
 * await rx.pull("my-prompt.text@1.0.0");
 * ```
 */
export function createResourceX(config?: ResourceXConfig): ResourceX {
  return new DefaultResourceX(config);
}
