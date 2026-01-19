import { homedir } from "node:os";
import type { Registry, RegistryConfig } from "./types.js";
import type { RXR, RXL } from "@resourcexjs/core";
import { parseRXL, createRXM } from "@resourcexjs/core";
import { globalTypeHandlerChain } from "@resourcexjs/type";
import { createARP } from "@resourcexjs/arp";
import type { ARP } from "@resourcexjs/arp";
import { RegistryError } from "./errors.js";

const DEFAULT_PATH = `${homedir()}/.resourcex`;

/**
 * ARP-based registry implementation.
 * Uses ARP protocol for atomic I/O operations.
 * Uses global TypeHandlerChain for serialization/deserialization.
 */
export class ARPRegistry implements Registry {
  private readonly arp: ARP;
  private readonly basePath: string;

  constructor(config?: RegistryConfig) {
    this.arp = createARP();
    this.basePath = config?.path ?? DEFAULT_PATH;

    // Register extension types to global chain
    if (config?.types) {
      for (const type of config.types) {
        globalTypeHandlerChain.register(type);
      }
    }
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

    // Serialize content using global type handler chain
    const contentUrl = this.buildUrl(locator, "content").replace("arp:text:", "arp:binary:");
    const contentArl = this.arp.parse(contentUrl);
    const serialized = await globalTypeHandlerChain.serialize(resource);
    await contentArl.deposit(serialized);
  }

  async resolve(locator: string): Promise<RXR> {
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

    // Deserialize using global type handler chain
    return globalTypeHandlerChain.deserialize(data, manifest);
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

  async search(_query: string): Promise<RXL[]> {
    // TODO: Implement search - requires listing directory
    // ARP doesn't have list operation yet
    throw new RegistryError("Search not implemented yet");
  }
}
