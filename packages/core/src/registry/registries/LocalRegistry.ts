import type { RXL, RXR, RXM } from "~/model/index.js";
import { format, resource, wrap, parse } from "~/model/index.js";
import type { Storage } from "@resourcexjs/storage";
import type { Registry, SearchOptions } from "./Registry.js";
import { RegistryError } from "../errors.js";

/**
 * LocalRegistry - Registry for local/owned resources (no registry in path).
 *
 * Uses Storage layer for persistence.
 * Storage structure (no registry):
 *   {path/}{name}/{tag}/
 *     - manifest.json
 *     - archive.tar.gz
 *
 * Use cases:
 * - Client local storage (~/.resourcex/local/)
 * - Server authoritative storage (./data/)
 */
export class LocalRegistry implements Registry {
  constructor(private readonly storage: Storage) {}

  /**
   * Build storage key prefix for a resource (no registry).
   */
  private buildKeyPrefix(rxl: RXL): string {
    const tag = rxl.tag ?? "latest";

    let key = rxl.name;
    if (rxl.path) {
      key = `${rxl.path}/${key}`;
    }
    key += `/${tag}`;

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
      throw new RegistryError(`Resource not found: ${format(rxl)}`);
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
    // Delete entire tag directory
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
        const searchText = `${rxl.path ?? ""} ${rxl.name}`.toLowerCase();
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
   * Parse storage key to RXL (no registry).
   * Key format: {path/}{name}/{tag}/manifest.json
   */
  private parseKeyToRXL(key: string): RXL | null {
    // Remove /manifest.json suffix
    const dirPath = key.replace(/\/manifest\.json$/, "");
    const parts = dirPath.split("/");

    if (parts.length < 2) {
      // Need at least: name, tag
      return null;
    }

    // Last part is tag
    const tag = parts.pop()!;
    // Second to last is name
    const name = parts.pop()!;
    // Remaining parts are path (if any)
    const path = parts.length > 0 ? parts.join("/") : undefined;

    // Construct locator string (no registry)
    let locatorStr = "";
    if (path) locatorStr += `${path}/`;
    locatorStr += name;
    if (tag !== "latest") locatorStr += `:${tag}`;

    try {
      return parse(locatorStr);
    } catch {
      return null;
    }
  }
}
