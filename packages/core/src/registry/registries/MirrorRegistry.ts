import type { RXL, RXR, RXM } from "~/model/index.js";
import { format, resource, wrap, parse } from "~/model/index.js";
import type { Storage } from "@resourcexjs/storage";
import type { Registry, SearchOptions } from "./Registry.js";
import { RegistryError } from "../errors.js";

/**
 * MirrorRegistry - Registry for cached/mirrored remote resources.
 *
 * Similar to LocalRegistry but includes registry in path.
 * Resources can be cleared (evicted from cache).
 *
 * Storage structure:
 *   {registry}/{path}/{name}/{tag}/
 *     - manifest.json
 *     - archive.tar.gz
 */
export class MirrorRegistry implements Registry {
  constructor(private readonly storage: Storage) {}

  /**
   * Build storage key prefix for a resource.
   */
  private buildKeyPrefix(rxl: RXL): string {
    const registry = rxl.registry ?? "localhost";
    const tag = rxl.tag ?? "latest";

    let key = registry;
    if (rxl.path) {
      key += `/${rxl.path}`;
    }
    key += `/${rxl.name}/${tag}`;

    return key;
  }

  async get(rxl: RXL): Promise<RXR> {
    const prefix = this.buildKeyPrefix(rxl);
    const manifestKey = `${prefix}/manifest.json`;
    const archiveKey = `${prefix}/archive.tar.gz`;

    // Read manifest
    let manifestData: Buffer;
    try {
      manifestData = await this.storage.get(manifestKey);
    } catch {
      throw new RegistryError(`Resource not found in cache: ${format(rxl)}`);
    }

    const manifestJson = JSON.parse(manifestData.toString("utf-8"));
    const rxm: RXM = {
      registry: manifestJson.registry,
      path: manifestJson.path,
      name: manifestJson.name,
      type: manifestJson.type,
      tag: manifestJson.tag,
      files: manifestJson.files,
    };

    // Read archive
    const archiveData = await this.storage.get(archiveKey);
    const rxa = wrap(archiveData);

    return resource(rxm, rxa);
  }

  async put(rxr: RXR): Promise<void> {
    const prefix = this.buildKeyPrefix(rxr.locator);
    const manifestKey = `${prefix}/manifest.json`;
    const archiveKey = `${prefix}/archive.tar.gz`;

    // Write manifest
    const manifestJson = {
      registry: rxr.manifest.registry,
      path: rxr.manifest.path,
      name: rxr.manifest.name,
      type: rxr.manifest.type,
      tag: rxr.manifest.tag,
      files: rxr.manifest.files,
    };
    const manifestData = Buffer.from(JSON.stringify(manifestJson, null, 2), "utf-8");
    await this.storage.put(manifestKey, manifestData);

    // Write archive
    const archiveData = await rxr.archive.buffer();
    await this.storage.put(archiveKey, archiveData);
  }

  async has(rxl: RXL): Promise<boolean> {
    const prefix = this.buildKeyPrefix(rxl);
    const manifestKey = `${prefix}/manifest.json`;
    return this.storage.exists(manifestKey);
  }

  async remove(rxl: RXL): Promise<void> {
    const prefix = this.buildKeyPrefix(rxl);
    await this.storage.delete(prefix);
  }

  async list(options?: SearchOptions): Promise<RXL[]> {
    const { query, limit, offset = 0 } = options ?? {};

    // List all keys and find manifest.json files
    const allKeys = await this.storage.list();
    const locators: RXL[] = [];

    for (const key of allKeys) {
      if (!key.endsWith("manifest.json")) continue;

      const rxl = this.parseKeyToRXL(key);
      if (rxl) {
        locators.push(rxl);
      }
    }

    // Filter by query
    let filtered = locators;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = locators.filter((rxl) => {
        const searchText = `${rxl.registry ?? ""} ${rxl.path ?? ""} ${rxl.name}`.toLowerCase();
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

  // ===== Cache-specific methods =====

  /**
   * Clear cached resources.
   * @param registry - If provided, only clear resources from this registry
   */
  async clear(registry?: string): Promise<void> {
    if (registry) {
      // Clear specific registry
      await this.storage.delete(registry);
    } else {
      // Clear all - list and delete each registry directory
      const allKeys = await this.storage.list();
      const registries = new Set<string>();

      for (const key of allKeys) {
        const firstSlash = key.indexOf("/");
        if (firstSlash !== -1) {
          registries.add(key.substring(0, firstSlash));
        } else {
          registries.add(key);
        }
      }

      for (const r of registries) {
        await this.storage.delete(r);
      }
    }
  }

  /**
   * Parse storage key to RXL.
   * Key format: {registry}/{path}/{name}/{tag}/manifest.json
   */
  private parseKeyToRXL(key: string): RXL | null {
    // Remove /manifest.json suffix
    const dirPath = key.replace(/\/manifest\.json$/, "");
    const parts = dirPath.split("/");

    if (parts.length < 3) {
      // Need at least: registry, name, tag
      return null;
    }

    // Last part is tag
    const tag = parts.pop()!;
    // Second to last is name
    const name = parts.pop()!;
    // First part is registry
    const registry = parts.shift()!;
    // Remaining parts are path (if any)
    const path = parts.length > 0 ? parts.join("/") : undefined;

    // Construct locator string
    let locatorStr = registry;
    if (path) locatorStr += `/${path}`;
    locatorStr += `/${name}`;
    if (tag !== "latest") locatorStr += `:${tag}`;

    try {
      return parse(locatorStr);
    } catch {
      return null;
    }
  }
}
