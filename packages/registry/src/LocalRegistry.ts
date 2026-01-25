import { homedir } from "node:os";
import { join, resolve as resolvePath } from "node:path";
import { symlink, lstat, readlink } from "node:fs/promises";
import type {
  Registry,
  LocalRegistryConfig,
  SearchOptions,
  PullOptions,
  PublishOptions,
} from "./types.js";
import type { RXR, RXL } from "@resourcexjs/core";
import { parseRXL, createRXM, createRXA } from "@resourcexjs/core";
import { TypeHandlerChain, ResourceTypeError } from "@resourcexjs/type";
import type { BundledType, ResolvedResource } from "@resourcexjs/type";
import { createARP, type ARP } from "@resourcexjs/arp";
import { loadResource } from "@resourcexjs/loader";
import { RegistryError } from "./errors.js";

const DEFAULT_PATH = `${homedir()}/.resourcex`;

/**
 * Local filesystem-based registry implementation.
 * Uses ARP file transport for I/O operations.
 */
export class LocalRegistry implements Registry {
  private readonly basePath: string;
  private readonly typeHandler: TypeHandlerChain;
  private readonly arp: ARP;

  constructor(config?: LocalRegistryConfig) {
    this.basePath = config?.path ?? DEFAULT_PATH;
    this.typeHandler = TypeHandlerChain.create();
    this.arp = createARP();

    // Register extension types
    if (config?.types) {
      for (const type of config.types) {
        this.typeHandler.register(type);
      }
    }
  }

  supportType(type: BundledType): void {
    this.typeHandler.register(type);
  }

  /**
   * Create ARP URL for a file path.
   */
  private toArpUrl(filePath: string): string {
    return `arp:binary:file://${filePath}`;
  }

  /**
   * Build filesystem path for a resource.
   *
   * Storage structure:
   * - local: {basePath}/local/{name}.{type}/{version}
   * - cache: {basePath}/cache/{domain}/{path}/{name}.{type}/{version}
   *
   * @param locator - Resource locator
   * @param area - Storage area ("local" or "cache")
   */
  private buildPath(locator: string | RXL, area: "local" | "cache"): string {
    const rxl = typeof locator === "string" ? parseRXL(locator) : locator;
    const resourceName = rxl.type ? `${rxl.name}.${rxl.type}` : rxl.name;
    const version = rxl.version ?? "latest";

    if (area === "local") {
      // local: {basePath}/local/{name}.{type}/{version}
      return join(this.basePath, "local", resourceName, version);
    } else {
      // cache: {basePath}/cache/{domain}/{path}/{name}.{type}/{version}
      const domain = rxl.domain ?? "localhost";
      let path = join(this.basePath, "cache", domain);
      if (rxl.path) {
        path = join(path, rxl.path);
      }
      return join(path, resourceName, version);
    }
  }

  /**
   * Determine if a locator refers to a local-only resource (no domain or localhost).
   */
  private isLocalOnlyLocator(locator: string | RXL): boolean {
    const rxl = typeof locator === "string" ? parseRXL(locator) : locator;
    return !rxl.domain || rxl.domain === "localhost";
  }

  /**
   * Check if a resource exists at a specific path.
   */
  private async existsAt(resourcePath: string): Promise<boolean> {
    const manifestPath = join(resourcePath, "manifest.json");
    const arl = this.arp.parse(this.toArpUrl(manifestPath));
    return arl.exists();
  }

  /**
   * Find which area a resource exists in.
   * Returns the area ("local" or "cache") or null if not found.
   */
  private async findArea(locator: string): Promise<"local" | "cache" | null> {
    // Check local first
    const localPath = this.buildPath(locator, "local");
    if (await this.existsAt(localPath)) {
      return "local";
    }

    // Then check cache
    const cachePath = this.buildPath(locator, "cache");
    if (await this.existsAt(cachePath)) {
      return "cache";
    }

    return null;
  }

  /**
   * Check if a path is a symlink.
   */
  private async isSymlink(path: string): Promise<boolean> {
    try {
      const stats = await lstat(path);
      return stats.isSymbolicLink();
    } catch {
      return false;
    }
  }

  /**
   * Load resource from a specific path.
   * If path is a symlink, loads from the linked directory using FolderLoader.
   */
  private async loadFrom(resourcePath: string): Promise<RXR> {
    // Check if this is a symlink (created by link())
    if (await this.isSymlink(resourcePath)) {
      const targetPath = await readlink(resourcePath);
      return loadResource(targetPath);
    }

    // Regular resource: read manifest and content
    const manifestPath = join(resourcePath, "manifest.json");
    const manifestArl = this.arp.parse(this.toArpUrl(manifestPath));
    const manifestResource = await manifestArl.resolve();
    const manifestContent = (manifestResource.content as Buffer).toString("utf-8");
    const manifestData = JSON.parse(manifestContent);
    const manifest = createRXM(manifestData);

    // Read content
    const contentPath = join(resourcePath, "archive.tar.gz");
    const contentArl = this.arp.parse(this.toArpUrl(contentPath));
    const contentResource = await contentArl.resolve();
    const data = contentResource.content as Buffer;

    // Build RXR directly (unified serialization format)
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ buffer: data }),
    };
  }

  async link(path: string): Promise<void> {
    // Load resource from directory to get locator info
    const rxr = await loadResource(path);
    const locator = rxr.manifest.toLocator();
    const resourcePath = this.buildPath(locator, "local");

    // Remove existing if any
    try {
      const arl = this.arp.parse(this.toArpUrl(resourcePath));
      if (await arl.exists()) {
        await arl.delete();
      }
    } catch {
      // Ignore
    }

    // Ensure parent directory exists
    const parentPath = join(resourcePath, "..");
    const parentArl = this.arp.parse(this.toArpUrl(parentPath));
    await parentArl.mkdir();

    // Create symlink to absolute path
    const absolutePath = resolvePath(path);
    await symlink(absolutePath, resourcePath);
  }

  async add(source: string | RXR): Promise<void> {
    // Load resource if path is provided
    const resource = typeof source === "string" ? await loadResource(source) : source;

    // Validate type is supported before storing
    const typeName = resource.manifest.type;
    if (!this.typeHandler.canHandle(typeName)) {
      throw new ResourceTypeError(`Unsupported resource type: ${typeName}`);
    }

    // Always add to local/ directory
    const locator = resource.manifest.toLocator();
    const resourcePath = this.buildPath(locator, "local");

    // Remove existing symlink if any
    if (await this.isSymlink(resourcePath)) {
      const arl = this.arp.parse(this.toArpUrl(resourcePath));
      await arl.delete();
    }

    // Ensure directory exists using ARP mkdir
    const dirArl = this.arp.parse(this.toArpUrl(resourcePath));
    await dirArl.mkdir();

    // Write manifest (text/json) - preserves original domain
    const manifestPath = join(resourcePath, "manifest.json");
    const manifestArl = this.arp.parse(this.toArpUrl(manifestPath));
    const manifestContent = Buffer.from(
      JSON.stringify(resource.manifest.toJSON(), null, 2),
      "utf-8"
    );
    await manifestArl.deposit(manifestContent);

    // Store archive directly (unified serialization format)
    const contentPath = join(resourcePath, "archive.tar.gz");
    const contentArl = this.arp.parse(this.toArpUrl(contentPath));
    const archiveBuffer = await resource.archive.buffer();
    await contentArl.deposit(archiveBuffer);
  }

  async pull(_locator: string, _options?: PullOptions): Promise<void> {
    // TODO: Implement in #018 (GitHubRegistry)
    throw new RegistryError("Pull not implemented yet - see issue #018");
  }

  async publish(_source: string | RXR, _options: PublishOptions): Promise<void> {
    // TODO: Implement in #018 (GitHubRegistry)
    throw new RegistryError("Publish not implemented yet - see issue #018");
  }

  async get(locator: string): Promise<RXR> {
    // Find in local first, then cache
    const area = await this.findArea(locator);
    if (!area) {
      throw new RegistryError(`Resource not found: ${locator}`);
    }

    const resourcePath = this.buildPath(locator, area);
    return this.loadFrom(resourcePath);
  }

  async resolve<TArgs = void, TResult = unknown>(
    locator: string
  ): Promise<ResolvedResource<TArgs, TResult>> {
    // Get the raw RXR first
    const rxr = await this.get(locator);
    // Resolve to ResolvedResource
    return this.typeHandler.resolve<TArgs, TResult>(rxr);
  }

  async exists(locator: string): Promise<boolean> {
    // Check both local and cache
    const area = await this.findArea(locator);
    return area !== null;
  }

  async delete(locator: string): Promise<void> {
    // Determine which area to delete from based on locator
    // - If locator has no domain or localhost: delete from local/
    // - If locator has domain: delete from cache/
    const isLocal = this.isLocalOnlyLocator(locator);

    if (isLocal) {
      // Delete from local/
      const localPath = this.buildPath(locator, "local");
      if (await this.existsAt(localPath)) {
        const arl = this.arp.parse(this.toArpUrl(localPath));
        await arl.delete();
      }
    } else {
      // Delete from cache/
      const cachePath = this.buildPath(locator, "cache");
      if (await this.existsAt(cachePath)) {
        const arl = this.arp.parse(this.toArpUrl(cachePath));
        await arl.delete();
      }
    }
  }

  async search(options?: SearchOptions): Promise<RXL[]> {
    const { query, limit, offset = 0 } = options ?? {};

    const locators: RXL[] = [];

    // Search in local/ directory using ARP list
    const localDir = join(this.basePath, "local");
    try {
      const localArl = this.arp.parse(this.toArpUrl(localDir));
      const localEntries = await localArl.list({ recursive: true, pattern: "*.json" });
      for (const entry of localEntries) {
        if (!entry.endsWith("manifest.json")) continue;
        const rxl = this.parseLocalEntry(entry);
        if (rxl) locators.push(rxl);
      }
    } catch {
      // local/ doesn't exist
    }

    // Search in cache/ directory using ARP list
    const cacheDir = join(this.basePath, "cache");
    try {
      const cacheArl = this.arp.parse(this.toArpUrl(cacheDir));
      const cacheEntries = await cacheArl.list({ recursive: true, pattern: "*.json" });
      for (const entry of cacheEntries) {
        if (!entry.endsWith("manifest.json")) continue;
        const rxl = this.parseCacheEntry(entry);
        if (rxl) locators.push(rxl);
      }
    } catch {
      // cache/ doesn't exist
    }

    // Filter by query if provided
    let filtered = locators;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = locators.filter((rxl) => {
        const searchText =
          `${rxl.domain ?? ""} ${rxl.path ?? ""} ${rxl.name} ${rxl.type ?? ""}`.toLowerCase();
        return searchText.includes(lowerQuery);
      });
    }

    // Apply pagination
    let result = filtered.slice(offset);
    if (limit !== undefined) {
      result = result.slice(0, limit);
    }

    return result;
  }

  /**
   * Parse a local entry path to RXL.
   * Entry format: {name}.{type}/{version}/manifest.json
   */
  private parseLocalEntry(entry: string): RXL | null {
    // Remove /manifest.json suffix
    const dirPath = entry.replace(/[/\\]manifest\.json$/, "");
    const parts = dirPath.split(/[/\\]/);

    if (parts.length < 2) {
      // Need at least: name.type, version
      return null;
    }

    // Last part is version
    const version = parts.pop()!;
    // First part is {name}.{type} or {name}
    const nameTypePart = parts.shift()!;

    // Split name and type
    const { name, type } = this.parseNameType(nameTypePart);

    // Construct locator string (no domain for local)
    let locatorStr = name;
    if (type) {
      locatorStr += `.${type}`;
    }
    locatorStr += `@${version}`;

    try {
      return parseRXL(locatorStr);
    } catch {
      return null;
    }
  }

  /**
   * Parse a cache entry path to RXL.
   * Entry format: {domain}/{path}/{name}.{type}/{version}/manifest.json
   */
  private parseCacheEntry(entry: string): RXL | null {
    // Remove /manifest.json suffix
    const dirPath = entry.replace(/[/\\]manifest\.json$/, "");
    const parts = dirPath.split(/[/\\]/);

    if (parts.length < 3) {
      // Need at least: domain, name.type, version
      return null;
    }

    // Last part is version
    const version = parts.pop()!;
    // Second to last is {name}.{type} or {name}
    const nameTypePart = parts.pop()!;
    // First part is domain
    const domain = parts.shift()!;
    // Remaining parts are path (if any)
    const path = parts.length > 0 ? parts.join("/") : undefined;

    // Split name and type
    const { name, type } = this.parseNameType(nameTypePart);

    // Construct locator string
    let locatorStr = domain;
    if (path) {
      locatorStr += `/${path}`;
    }
    locatorStr += `/${name}`;
    if (type) {
      locatorStr += `.${type}`;
    }
    locatorStr += `@${version}`;

    try {
      return parseRXL(locatorStr);
    } catch {
      return null;
    }
  }

  /**
   * Parse name and type from a combined string like "name.type" or "name".
   */
  private parseNameType(nameTypePart: string): { name: string; type: string | undefined } {
    const dotIndex = nameTypePart.lastIndexOf(".");
    if (dotIndex !== -1) {
      return {
        name: nameTypePart.substring(0, dotIndex),
        type: nameTypePart.substring(dotIndex + 1),
      };
    } else {
      return { name: nameTypePart, type: undefined };
    }
  }
}
