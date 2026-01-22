import { homedir } from "node:os";
import { join } from "node:path";
import { readFile, writeFile, mkdir, rm, stat, readdir } from "node:fs/promises";
import type { Registry, LocalRegistryConfig, SearchOptions } from "./types.js";
import type { RXR, RXL } from "@resourcexjs/core";
import { parseRXL, createRXM } from "@resourcexjs/core";
import { TypeHandlerChain } from "@resourcexjs/type";
import type { ResourceType, ResolvedResource } from "@resourcexjs/type";
import { RegistryError } from "./errors.js";

const DEFAULT_PATH = `${homedir()}/.resourcex`;

/**
 * Local filesystem-based registry implementation.
 * Uses Node.js fs module directly for storage operations.
 */
export class LocalRegistry implements Registry {
  private readonly basePath: string;
  private readonly typeHandler: TypeHandlerChain;

  constructor(config?: LocalRegistryConfig) {
    this.basePath = config?.path ?? DEFAULT_PATH;
    this.typeHandler = TypeHandlerChain.create();

    // Register extension types
    if (config?.types) {
      for (const type of config.types) {
        this.typeHandler.register(type);
      }
    }
  }

  supportType(type: ResourceType): void {
    this.typeHandler.register(type);
  }

  /**
   * Build filesystem path for a resource.
   * Path structure: {basePath}/{domain}/{path}/{name}.{type}/{version}
   */
  private buildPath(locator: string | RXL): string {
    const rxl = typeof locator === "string" ? parseRXL(locator) : locator;
    const domain = rxl.domain ?? "localhost";
    const version = rxl.version ?? "latest";

    let path = join(this.basePath, domain);
    if (rxl.path) {
      path = join(path, rxl.path);
    }

    const resourceName = rxl.type ? `${rxl.name}.${rxl.type}` : rxl.name;

    return join(path, resourceName, version);
  }

  async publish(_resource: RXR): Promise<void> {
    // TODO: Implement remote publishing based on domain
    throw new RegistryError("Remote publish not implemented yet");
  }

  async link(resource: RXR): Promise<void> {
    const locator = resource.manifest.toLocator();
    const resourcePath = this.buildPath(locator);

    // Ensure directory exists
    await mkdir(resourcePath, { recursive: true });

    // Write manifest (text/json)
    const manifestPath = join(resourcePath, "manifest.json");
    await writeFile(manifestPath, JSON.stringify(resource.manifest.toJSON(), null, 2), "utf-8");

    // Serialize content using type handler chain
    const contentPath = join(resourcePath, "content.tar.gz");
    const serialized = await this.typeHandler.serialize(resource);
    await writeFile(contentPath, serialized);
  }

  async get(locator: string): Promise<RXR> {
    // Check exists first
    if (!(await this.exists(locator))) {
      throw new RegistryError(`Resource not found: ${locator}`);
    }

    const resourcePath = this.buildPath(locator);

    // Read manifest first to determine type
    const manifestPath = join(resourcePath, "manifest.json");
    const manifestContent = await readFile(manifestPath, "utf-8");
    const manifestData = JSON.parse(manifestContent);
    const manifest = createRXM(manifestData);

    // Read content
    const contentPath = join(resourcePath, "content.tar.gz");
    const data = await readFile(contentPath);

    // Deserialize to RXR
    return this.typeHandler.deserialize(data, manifest);
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
    const resourcePath = this.buildPath(locator);
    const manifestPath = join(resourcePath, "manifest.json");

    try {
      await stat(manifestPath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(locator: string): Promise<void> {
    // Check if exists first - silently return if not
    if (!(await this.exists(locator))) {
      return;
    }

    const resourcePath = this.buildPath(locator);

    // Delete the entire version directory
    await rm(resourcePath, { recursive: true, force: true });
  }

  async search(options?: SearchOptions): Promise<RXL[]> {
    const { query, limit, offset = 0 } = options ?? {};

    // List all resources recursively from basePath
    let entries: string[];
    try {
      entries = await this.listRecursive(this.basePath);
    } catch {
      // If basePath doesn't exist, return empty array
      return [];
    }

    // Filter for manifest.json files and extract locators
    const locators: RXL[] = [];
    for (const entry of entries) {
      if (!entry.endsWith("manifest.json")) {
        continue;
      }

      // Parse the path to extract RXL components
      // Format: {domain}/{path}/{name}.{type}/{version}/manifest.json
      const relativePath = entry.slice(this.basePath.length + 1); // Remove basePath/
      const rxl = this.parseEntryToRXL(relativePath);
      if (rxl) {
        locators.push(rxl);
      }
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
   * Recursively list all files in a directory.
   */
  private async listRecursive(dir: string): Promise<string[]> {
    const results: string[] = [];

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          const subEntries = await this.listRecursive(fullPath);
          results.push(...subEntries);
        } else {
          results.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return results;
  }

  /**
   * Parse a file entry path to RXL.
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
    // Second to last is {name}.{type} or {name}
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
}
