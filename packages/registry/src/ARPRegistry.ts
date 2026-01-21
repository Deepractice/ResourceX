import { homedir } from "node:os";
import type { Registry, RegistryConfig, SearchOptions } from "./types.js";
import type { RXR, RXL } from "@resourcexjs/core";
import { parseRXL, createRXM } from "@resourcexjs/core";
import { TypeHandlerChain } from "@resourcexjs/type";
import type { ResourceType, ResolvedResource } from "@resourcexjs/type";
import { createARP } from "@resourcexjs/arp";
import type { ARP } from "@resourcexjs/arp";
import { RegistryError } from "./errors.js";

const DEFAULT_PATH = `${homedir()}/.resourcex`;

/**
 * ARP-based registry implementation.
 * Uses ARP protocol for atomic I/O operations.
 * Each instance has its own TypeHandlerChain for type handling.
 */
export class ARPRegistry implements Registry {
  private readonly arp: ARP;
  private readonly basePath: string;
  private readonly typeHandler: TypeHandlerChain;

  constructor(config?: RegistryConfig) {
    this.arp = createARP();
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
   * Build ARP URL for a resource file.
   */
  private buildUrl(locator: string | RXL, filename: string): string {
    const rxl = typeof locator === "string" ? parseRXL(locator) : locator;
    const domain = rxl.domain ?? "localhost";

    let path = `${this.basePath}/${domain}`;
    if (rxl.path) {
      path += `/${rxl.path}`;
    }

    const resourceDir = rxl.type
      ? `${rxl.name}.${rxl.type}@${rxl.version ?? "latest"}`
      : `${rxl.name}@${rxl.version ?? "latest"}`;

    return `arp:text:file://${path}/${resourceDir}/${filename}`;
  }

  async publish(_resource: RXR): Promise<void> {
    // TODO: Implement remote publishing based on domain
    throw new RegistryError("Remote publish not implemented yet");
  }

  async link(resource: RXR): Promise<void> {
    const locator = resource.manifest.toLocator();

    // Write manifest (text/json)
    const manifestUrl = this.buildUrl(locator, "manifest.json");
    const manifestArl = this.arp.parse(manifestUrl);
    await manifestArl.deposit(JSON.stringify(resource.manifest.toJSON(), null, 2));

    // Serialize content using type handler chain
    const contentUrl = this.buildUrl(locator, "content").replace("arp:text:", "arp:binary:");
    const contentArl = this.arp.parse(contentUrl);
    const serialized = await this.typeHandler.serialize(resource);
    await contentArl.deposit(serialized);
  }

  async resolve<TArgs = void, TResult = unknown>(
    locator: string
  ): Promise<ResolvedResource<TArgs, TResult>> {
    // Check exists first
    if (!(await this.exists(locator))) {
      throw new RegistryError(`Resource not found: ${locator}`);
    }

    // Read manifest first to determine type
    const manifestUrl = this.buildUrl(locator, "manifest.json");
    const manifestArl = this.arp.parse(manifestUrl);
    const manifestResult = await manifestArl.resolve();
    const manifestData = JSON.parse(manifestResult.content as string);
    const manifest = createRXM(manifestData);

    // Read content
    const contentUrl = this.buildUrl(locator, "content").replace("arp:text:", "arp:binary:");
    const contentArl = this.arp.parse(contentUrl);
    const contentResult = await contentArl.resolve();
    const data = contentResult.content as Buffer;

    // Deserialize to RXR and resolve to ResolvedResource
    const rxr = await this.typeHandler.deserialize(data, manifest);
    return this.typeHandler.resolve<TArgs, TResult>(rxr);
  }

  async exists(locator: string): Promise<boolean> {
    const manifestUrl = this.buildUrl(locator, "manifest.json");
    const manifestArl = this.arp.parse(manifestUrl);
    return manifestArl.exists();
  }

  async delete(locator: string): Promise<void> {
    // Check if exists first - silently return if not
    if (!(await this.exists(locator))) {
      return;
    }

    // Delete manifest
    const manifestUrl = this.buildUrl(locator, "manifest.json");
    const manifestArl = this.arp.parse(manifestUrl);
    await manifestArl.delete();

    // Delete content
    const contentUrl = this.buildUrl(locator, "content").replace("arp:text:", "arp:binary:");
    const contentArl = this.arp.parse(contentUrl);
    await contentArl.delete();
  }

  async search(options?: SearchOptions): Promise<RXL[]> {
    const { query, limit, offset = 0 } = options ?? {};

    // List all resources recursively from basePath
    const baseUrl = `arp:text:file://${this.basePath}`;
    const baseArl = this.arp.parse(baseUrl);

    let entries: string[];
    try {
      const result = await baseArl.resolve({ recursive: "true" });
      entries = JSON.parse(result.content as string);
    } catch {
      // If basePath doesn't exist, return empty array
      return [];
    }

    // Filter for manifest.json files and extract locators
    const locators: RXL[] = [];
    for (const entry of entries) {
      if (!entry.endsWith("/manifest.json")) {
        continue;
      }

      // Parse the path to extract RXL components
      // Format: {domain}/{path}/{name}.{type}@{version}/manifest.json
      const rxl = this.parseEntryToRXL(entry);
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
   * Parse a file entry path to RXL.
   * Entry format: {domain}/{path}/{name}.{type}@{version}/manifest.json
   */
  private parseEntryToRXL(entry: string): RXL | null {
    // Remove /manifest.json suffix
    const dirPath = entry.replace(/\/manifest\.json$/, "");
    const parts = dirPath.split("/");

    if (parts.length < 2) {
      return null;
    }

    // Last part is {name}.{type}@{version} or {name}@{version}
    const resourceDir = parts.pop()!;
    const domain = parts.shift()!;
    const path = parts.length > 0 ? parts.join("/") : undefined;

    // Parse resourceDir: {name}.{type}@{version}
    const atIndex = resourceDir.lastIndexOf("@");
    if (atIndex === -1) {
      return null;
    }

    const nameTypePart = resourceDir.substring(0, atIndex);
    const version = resourceDir.substring(atIndex + 1);

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
