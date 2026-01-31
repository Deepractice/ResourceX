import { join, resolve as resolvePath } from "node:path";
import { symlink, lstat, readlink, rm, mkdir, readdir, stat } from "node:fs/promises";
import type { RXL, RXR } from "@resourcexjs/core";
import { format, parse } from "@resourcexjs/core";
import { loadResource } from "@resourcexjs/loader";
import type { Registry, SearchOptions } from "./Registry.js";
import { RegistryError } from "../errors.js";

/**
 * LinkedRegistry - Registry for development symlinks.
 *
 * Creates symlinks to development directories so changes are reflected immediately.
 * Unlike HostedRegistry/MirrorRegistry, it doesn't use Storage layer directly.
 * Instead, it manages symlinks in a base directory.
 *
 * Storage structure:
 *   {basePath}/{domain}/{path}/{name}.{type}/{version} → /path/to/dev/folder
 */
export class LinkedRegistry implements Registry {
  constructor(private readonly basePath: string) {}

  /**
   * Build symlink path for a resource.
   */
  private buildLinkPath(rxl: RXL): string {
    const domain = rxl.domain ?? "localhost";
    const resourceName = rxl.type ? `${rxl.name}.${rxl.type}` : rxl.name;
    const version = rxl.version ?? "latest";

    let linkPath = join(this.basePath, domain);
    if (rxl.path) {
      linkPath = join(linkPath, rxl.path);
    }
    return join(linkPath, resourceName, version);
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

  async get(rxl: RXL): Promise<RXR> {
    const linkPath = this.buildLinkPath(rxl);

    if (!(await this.isSymlink(linkPath))) {
      throw new RegistryError(`Linked resource not found: ${format(rxl)}`);
    }

    // Read symlink target and load resource from there
    const targetPath = await readlink(linkPath);
    return loadResource(targetPath);
  }

  /**
   * Put is not typically used for LinkedRegistry.
   * Use link() instead to create symlinks.
   */
  async put(_rxr: RXR): Promise<void> {
    throw new RegistryError("LinkedRegistry does not support put(). Use link() instead.");
  }

  async has(rxl: RXL): Promise<boolean> {
    const linkPath = this.buildLinkPath(rxl);
    return this.isSymlink(linkPath);
  }

  async remove(rxl: RXL): Promise<void> {
    const linkPath = this.buildLinkPath(rxl);

    if (await this.isSymlink(linkPath)) {
      await rm(linkPath);
    }
  }

  async list(options?: SearchOptions): Promise<RXL[]> {
    const { query, limit, offset = 0 } = options ?? {};
    const locators: RXL[] = [];

    // Recursively scan for symlinks
    try {
      await this.scanSymlinks(this.basePath, "", locators);
    } catch {
      // Base directory doesn't exist
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

  // ===== Link-specific methods =====

  /**
   * Link a development directory.
   * Creates a symlink so changes are reflected immediately.
   *
   * @param devPath - Path to development directory (must contain resource.json)
   * @returns The RXL of the linked resource
   */
  async link(devPath: string): Promise<RXL> {
    // Load resource to get locator info
    const rxr = await loadResource(devPath);
    const linkPath = this.buildLinkPath(rxr.locator);

    // Remove existing if any
    try {
      const stats = await lstat(linkPath);
      if (stats.isSymbolicLink() || stats.isDirectory()) {
        await rm(linkPath, { recursive: true });
      }
    } catch {
      // Doesn't exist, that's fine
    }

    // Ensure parent directory exists
    const parentPath = join(linkPath, "..");
    await mkdir(parentPath, { recursive: true });

    // Create symlink to absolute path
    const absolutePath = resolvePath(devPath);
    await symlink(absolutePath, linkPath);

    return rxr.locator;
  }

  /**
   * Unlink a development directory.
   * Alias for remove().
   */
  async unlink(rxl: RXL): Promise<void> {
    return this.remove(rxl);
  }

  /**
   * Recursively scan for symlinks.
   */
  private async scanSymlinks(
    dirPath: string,
    relativePath: string,
    locators: RXL[]
  ): Promise<void> {
    let entries;
    try {
      entries = await readdir(dirPath);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const relPath = relativePath ? `${relativePath}/${entry}` : entry;

      try {
        const stats = await lstat(fullPath);

        if (stats.isSymbolicLink()) {
          // This is a linked resource, parse the path to get RXL
          const rxl = this.parsePathToRXL(relPath);
          if (rxl) {
            locators.push(rxl);
          }
        } else if (stats.isDirectory()) {
          // Recurse into directory
          await this.scanSymlinks(fullPath, relPath, locators);
        }
      } catch {
        // Skip entries we can't access
      }
    }
  }

  /**
   * Parse relative path to RXL.
   * Path format: {domain}/{path}/{name}.{type}/{version}
   */
  private parsePathToRXL(relPath: string): RXL | null {
    const parts = relPath.split("/");

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
