import type { RXL, RXR, RXM } from "@resourcexjs/core";
import { format, resource, wrap, parse } from "@resourcexjs/core";
import type { Storage } from "@resourcexjs/storage";
import type { Registry, SearchOptions } from "./Registry.js";
import { RegistryError } from "../errors.js";

/**
 * MirrorRegistry - Registry for cached/mirrored remote resources.
 *
 * Similar to HostedRegistry but adds cache management methods.
 * Resources can be cleared (evicted from cache).
 *
 * Storage structure:
 *   {domain}/{path}/{name}.{type}/{version}/
 *     - manifest.json
 *     - archive.tar.gz
 */
export class MirrorRegistry implements Registry {
  constructor(private readonly storage: Storage) {}

  /**
   * Build storage key prefix for a resource.
   */
  private buildKeyPrefix(rxl: RXL): string {
    const domain = rxl.domain ?? "localhost";
    const resourceName = rxl.type ? `${rxl.name}.${rxl.type}` : rxl.name;
    const version = rxl.version ?? "latest";

    let key = domain;
    if (rxl.path) {
      key += `/${rxl.path}`;
    }
    key += `/${resourceName}/${version}`;

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
      domain: manifestJson.domain,
      path: manifestJson.path,
      name: manifestJson.name,
      type: manifestJson.type,
      version: manifestJson.version,
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
      domain: rxr.manifest.domain,
      path: rxr.manifest.path,
      name: rxr.manifest.name,
      type: rxr.manifest.type,
      version: rxr.manifest.version,
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

  // ===== Cache-specific methods =====

  /**
   * Clear cached resources.
   * @param domain - If provided, only clear resources from this domain
   */
  async clear(domain?: string): Promise<void> {
    if (domain) {
      // Clear specific domain
      await this.storage.delete(domain);
    } else {
      // Clear all - list and delete each domain directory
      const allKeys = await this.storage.list();
      const domains = new Set<string>();

      for (const key of allKeys) {
        const firstSlash = key.indexOf("/");
        if (firstSlash !== -1) {
          domains.add(key.substring(0, firstSlash));
        } else {
          domains.add(key);
        }
      }

      for (const d of domains) {
        await this.storage.delete(d);
      }
    }
  }

  /**
   * Parse storage key to RXL.
   * Key format: {domain}/{path}/{name}.{type}/{version}/manifest.json
   */
  private parseKeyToRXL(key: string): RXL | null {
    // Remove /manifest.json suffix
    const dirPath = key.replace(/\/manifest\.json$/, "");
    const parts = dirPath.split("/");

    if (parts.length < 3) {
      return null;
    }

    const version = parts.pop()!;
    const nameTypePart = parts.pop()!;
    const domain = parts.shift()!;
    const path = parts.length > 0 ? parts.join("/") : undefined;

    const dotIndex = nameTypePart.lastIndexOf(".");
    let name: string;
    let type: string | undefined;

    if (dotIndex !== -1) {
      name = nameTypePart.substring(0, dotIndex);
      type = nameTypePart.substring(dotIndex + 1);
    } else {
      name = nameTypePart;
      type = undefined;
    }

    let locatorStr = domain;
    if (path) locatorStr += `/${path}`;
    locatorStr += `/${name}`;
    if (type) locatorStr += `.${type}`;
    locatorStr += `@${version}`;

    try {
      return parse(locatorStr);
    } catch {
      return null;
    }
  }
}
