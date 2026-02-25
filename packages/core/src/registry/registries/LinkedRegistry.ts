import { lstat, mkdir, readdir, readlink, rm, symlink } from "node:fs/promises";
import { join, resolve as resolvePath } from "node:path";
import { loadResource } from "~/loader/index.js";
import type { RXI, RXM, RXR } from "~/model/index.js";
import { format, parse } from "~/model/index.js";
import { RegistryError } from "../errors.js";
import type { Registry, SearchOptions } from "./Registry.js";

/**
 * LinkedRegistry - Registry for development symlinks.
 *
 * Creates symlinks to development directories so changes are reflected immediately.
 * Unlike HostedRegistry/MirrorRegistry, it doesn't use Storage layer directly.
 * Instead, it manages symlinks in a base directory.
 *
 * Storage structure:
 *   {basePath}/{registry}/{path}/{name}/{tag} → /path/to/dev/folder
 */
export class LinkedRegistry implements Registry {
  constructor(private readonly basePath: string) {}

  /**
   * Build symlink path for a resource.
   */
  private buildLinkPath(rxi: RXI): string {
    const registry = rxi.registry ?? "localhost";
    const tag = rxi.tag ?? "latest";

    let linkPath = join(this.basePath, registry);
    if (rxi.path) {
      linkPath = join(linkPath, rxi.path);
    }
    return join(linkPath, rxi.name, tag);
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

  async get(rxi: RXI): Promise<RXR> {
    const linkPath = this.buildLinkPath(rxi);

    if (!(await this.isSymlink(linkPath))) {
      throw new RegistryError(`Linked resource not found: ${format(rxi)}`);
    }

    // Read symlink target and load resource from there
    const targetPath = await readlink(linkPath);
    return loadResource(targetPath);
  }

  /**
   * Put is not typically used for LinkedRegistry.
   * Use link() instead to create symlinks.
   */
  async put(_rxr: RXR): Promise<RXM> {
    throw new RegistryError("LinkedRegistry does not support put(). Use link() instead.");
  }

  async has(rxi: RXI): Promise<boolean> {
    const linkPath = this.buildLinkPath(rxi);
    return this.isSymlink(linkPath);
  }

  async remove(rxi: RXI): Promise<void> {
    const linkPath = this.buildLinkPath(rxi);

    if (await this.isSymlink(linkPath)) {
      await rm(linkPath);
    }
  }

  async list(options?: SearchOptions): Promise<RXI[]> {
    const { query, limit, offset = 0 } = options ?? {};
    const identifiers: RXI[] = [];

    // Recursively scan for symlinks
    try {
      await this.scanSymlinks(this.basePath, "", identifiers);
    } catch {
      // Base directory doesn't exist
      return [];
    }

    // Filter by query
    let filtered = identifiers;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = identifiers.filter((rxi) => {
        const searchText = `${rxi.registry ?? ""} ${rxi.path ?? ""} ${rxi.name}`.toLowerCase();
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
   * @returns The RXI of the linked resource
   */
  async link(devPath: string): Promise<RXI> {
    // Load resource to get identifier info
    const rxr = await loadResource(devPath);
    const linkPath = this.buildLinkPath(rxr.identifier);

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

    return rxr.identifier;
  }

  /**
   * Unlink a development directory.
   * Alias for remove().
   */
  async unlink(rxi: RXI): Promise<void> {
    return this.remove(rxi);
  }

  /**
   * Recursively scan for symlinks.
   */
  private async scanSymlinks(
    dirPath: string,
    relativePath: string,
    identifiers: RXI[]
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
          // This is a linked resource, parse the path to get RXI
          const rxi = this.parsePathToRXI(relPath);
          if (rxi) {
            identifiers.push(rxi);
          }
        } else if (stats.isDirectory()) {
          // Recurse into directory
          await this.scanSymlinks(fullPath, relPath, identifiers);
        }
      } catch {
        // Skip entries we can't access
      }
    }
  }

  /**
   * Parse relative path to RXI.
   * Path format: {registry}/{path}/{name}/{tag}
   */
  private parsePathToRXI(relPath: string): RXI | null {
    const parts = relPath.split("/");

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

    // Construct locator string and parse
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
