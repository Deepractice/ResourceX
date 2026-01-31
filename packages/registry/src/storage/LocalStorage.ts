import { homedir } from "node:os";
import { join, resolve as resolvePath } from "node:path";
import { symlink, lstat, readlink } from "node:fs/promises";
import type { RXR, RXL, RXM } from "@resourcexjs/core";
import { parse, format, resource, wrap } from "@resourcexjs/core";
import { createARP, type ARP } from "@resourcexjs/arp";
import { loadResource } from "@resourcexjs/loader";
import { RegistryError } from "../errors.js";
import type { Storage, SearchOptions } from "./Storage.js";

const DEFAULT_PATH = `${homedir()}/.resourcex`;

/**
 * LocalStorage configuration.
 */
export interface LocalStorageConfig {
  /**
   * Base path for storage. Defaults to ~/.resourcex
   */
  path?: string;
}

/**
 * Local filesystem storage implementation.
 * Uses ARP file transport for I/O operations.
 *
 * Storage structure:
 * - {basePath}/{domain}/{path}/{name}.{type}/{version}/
 *   - manifest.json
 *   - archive.tar.gz
 *
 * For localhost/no-domain resources:
 * - {basePath}/localhost/{name}.{type}/{version}/
 */
export class LocalStorage implements Storage {
  readonly type = "local";
  private readonly basePath: string;
  private readonly arp: ARP;

  constructor(config?: LocalStorageConfig) {
    this.basePath = config?.path ?? DEFAULT_PATH;
    this.arp = createARP();
  }

  /**
   * Create ARP URL for a file path.
   */
  private toArpUrl(filePath: string): string {
    return `arp:binary:file://${filePath}`;
  }

  /**
   * Build filesystem path for a resource.
   * Path: {basePath}/{domain}/{path}/{name}.{type}/{version}
   */
  private buildPath(rxl: RXL): string {
    const domain = rxl.domain ?? "localhost";
    const resourceName = rxl.type ? `${rxl.name}.${rxl.type}` : rxl.name;
    const version = rxl.version ?? "latest";

    let path = join(this.basePath, domain);
    if (rxl.path) {
      path = join(path, rxl.path);
    }
    return join(path, resourceName, version);
  }

  /**
   * Check if a resource exists at a specific path.
   * Handles both regular storage (manifest.json) and symlinked dev directories (resource.json).
   */
  private async existsAt(resourcePath: string): Promise<boolean> {
    // Check if path is a symlink (created by link())
    if (await this.isSymlink(resourcePath)) {
      // For symlinks, check if resource.json exists in the linked directory
      const targetPath = await readlink(resourcePath);
      const resourceJsonPath = join(targetPath, "resource.json");
      const arl = this.arp.parse(this.toArpUrl(resourceJsonPath));
      return arl.exists();
    }

    // Regular storage: check for manifest.json
    const manifestPath = join(resourcePath, "manifest.json");
    const arl = this.arp.parse(this.toArpUrl(manifestPath));
    return arl.exists();
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
   * If path is a symlink, loads from the linked directory.
   */
  private async loadFrom(resourcePath: string): Promise<RXR> {
    // Check if this is a symlink (created by link())
    if (await this.isSymlink(resourcePath)) {
      const targetPath = await readlink(resourcePath);
      return loadResource(targetPath);
    }

    // Regular resource: read manifest and archive
    const manifestPath = join(resourcePath, "manifest.json");
    const manifestArl = this.arp.parse(this.toArpUrl(manifestPath));
    const manifestResource = await manifestArl.resolve();
    const manifestContent = (manifestResource.content as Buffer).toString("utf-8");
    const manifestData = JSON.parse(manifestContent);

    // Create RXM from manifest data
    const rxm: RXM = {
      domain: manifestData.domain,
      path: manifestData.path,
      name: manifestData.name,
      type: manifestData.type,
      version: manifestData.version,
      files: manifestData.files,
    };

    // Read archive
    const archivePath = join(resourcePath, "archive.tar.gz");
    const archiveArl = this.arp.parse(this.toArpUrl(archivePath));
    const archiveResource = await archiveArl.resolve();
    const data = archiveResource.content as Buffer;

    // Wrap buffer as RXA and create RXR
    const rxa = wrap(data);
    return resource(rxm, rxa);
  }

  async get(rxl: RXL): Promise<RXR> {
    const resourcePath = this.buildPath(rxl);
    const locatorStr = format(rxl);

    if (!(await this.existsAt(resourcePath))) {
      throw new RegistryError(`Resource not found: ${locatorStr}`);
    }

    return this.loadFrom(resourcePath);
  }

  async put(rxr: RXR): Promise<void> {
    const resourcePath = this.buildPath(rxr.locator);

    // Remove existing symlink if any
    if (await this.isSymlink(resourcePath)) {
      const arl = this.arp.parse(this.toArpUrl(resourcePath));
      await arl.delete();
    }

    // Ensure directory exists
    const dirArl = this.arp.parse(this.toArpUrl(resourcePath));
    await dirArl.mkdir();

    // Write manifest as JSON
    const manifestPath = join(resourcePath, "manifest.json");
    const manifestArl = this.arp.parse(this.toArpUrl(manifestPath));
    const manifestJson = {
      domain: rxr.manifest.domain,
      path: rxr.manifest.path,
      name: rxr.manifest.name,
      type: rxr.manifest.type,
      version: rxr.manifest.version,
      files: rxr.manifest.files,
    };
    const manifestContent = Buffer.from(JSON.stringify(manifestJson, null, 2), "utf-8");
    await manifestArl.deposit(manifestContent);

    // Write archive
    const archivePath = join(resourcePath, "archive.tar.gz");
    const archiveArl = this.arp.parse(this.toArpUrl(archivePath));
    const archiveBuffer = await rxr.archive.buffer();
    await archiveArl.deposit(archiveBuffer);
  }

  async exists(rxl: RXL): Promise<boolean> {
    const resourcePath = this.buildPath(rxl);
    return this.existsAt(resourcePath);
  }

  async delete(rxl: RXL): Promise<void> {
    const resourcePath = this.buildPath(rxl);

    if (await this.existsAt(resourcePath)) {
      const arl = this.arp.parse(this.toArpUrl(resourcePath));
      await arl.delete();
    }
  }

  async search(options?: SearchOptions): Promise<RXL[]> {
    const { query, limit, offset = 0 } = options ?? {};
    const locators: RXL[] = [];

    // Scan base directory recursively for manifest.json files
    try {
      const baseArl = this.arp.parse(this.toArpUrl(this.basePath));
      const entries = await baseArl.list({ recursive: true, pattern: "*.json" });

      for (const entry of entries) {
        if (!entry.endsWith("manifest.json")) continue;
        const rxl = this.parseEntryToRXL(entry);
        if (rxl) locators.push(rxl);
      }
    } catch {
      // Directory doesn't exist
      return [];
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

  /**
   * Link a development directory.
   * Creates a symlink so changes are reflected immediately.
   */
  async link(path: string): Promise<void> {
    // Load resource from directory to get locator info
    const rxr = await loadResource(path);
    const resourcePath = this.buildPath(rxr.locator);

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

  /**
   * Parse entry path to RXL.
   * Entry format: {domain}/{path}/{name}.{type}/{version}/manifest.json
   */
  private parseEntryToRXL(entry: string): RXL | null {
    // Remove /manifest.json suffix
    const dirPath = entry.replace(/[/\\]manifest\.json$/, "");
    const parts = dirPath.split(/[/\\]/);

    if (parts.length < 3) {
      // Need at least: domain, name.type, version
      return null;
    }

    // Last part is version
    const version = parts.pop()!;
    // Second to last is {name}.{type}
    const nameTypePart = parts.pop()!;
    // First part is domain
    const domain = parts.shift()!;
    // Remaining parts are path (if any)
    const path = parts.length > 0 ? parts.join("/") : undefined;

    // Split name and type
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

    // Construct locator string and parse
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
