/**
 * ResourceX - Main API class
 */

import {
  resolve as coreResolve,
  deposit as coreDeposit,
  resourceExists as coreExists,
  resourceDelete as coreDelete,
  registerTransportHandler,
  registerSemanticHandler,
  createResourceRegistry,
  ParseError,
  type ParsedARP,
  type Resource,
  type TransportHandler,
  type SemanticHandler,
  type ResourceDefinition,
  type ResourceRegistry,
} from "@resourcexjs/core";
import { join } from "node:path";

/**
 * ResourceX configuration
 */
export interface ResourceXConfig {
  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * URL prefix alias (default: "arp")
   * All URLs must start with this prefix
   * @example "arp", "@", "r"
   */
  alias?: string;

  /**
   * Custom transport handlers to register
   */
  transports?: TransportHandler[];

  /**
   * Custom semantic handlers to register
   */
  semantics?: SemanticHandler[];

  /**
   * Resource definitions
   */
  resources?: ResourceDefinition[];
}

/**
 * ResourceX instance
 */
export class ResourceX {
  readonly timeout?: number;
  private readonly alias: string;
  private readonly resourceRegistry: ResourceRegistry;

  constructor(config: ResourceXConfig = {}) {
    this.timeout = config.timeout;
    this.alias = config.alias || "@";
    this.resourceRegistry = createResourceRegistry();

    // Register custom handlers from config
    if (config.transports) {
      for (const handler of config.transports) {
        registerTransportHandler(handler);
      }
    }

    if (config.semantics) {
      for (const handler of config.semantics) {
        registerSemanticHandler(handler);
      }
    }

    // Register resources from config
    if (config.resources) {
      for (const resource of config.resources) {
        this.resourceRegistry.register(resource);
      }
    }
  }

  /**
   * Parse URL (supports both ARP and Resource URLs with custom prefix)
   */
  private parseURL(url: string): { arpUrl: string; parsed: ParsedARP } {
    // Check prefix: "arp:" (always supported) or configured alias
    let content: string;

    if (url.startsWith("arp:")) {
      content = url.substring(4); // Remove "arp:"
    } else if (url.startsWith(this.alias)) {
      content = url.substring(this.alias.length); // Remove alias
    } else {
      throw new ParseError(`Invalid URL prefix: must start with "arp:" or "${this.alias}"`, url);
    }

    // Find :// separator
    const separatorIndex = content.indexOf("://");
    if (separatorIndex === -1) {
      throw new ParseError(`Invalid URL format: missing "://"`, url);
    }

    const beforeSeparator = content.substring(0, separatorIndex);
    const location = content.substring(separatorIndex + 3);

    // Count colons in the part before ://
    const colonCount = (beforeSeparator.match(/:/g) || []).length;

    // ARP URL: {alias}:semantic:transport://location (1 colon before ://)
    if (colonCount === 1) {
      const parts = beforeSeparator.split(":");
      if (parts.length !== 2) {
        throw new ParseError(`Invalid ARP URL format`, url);
      }

      const [semantic, transport] = parts;

      if (!semantic || !transport || !location) {
        throw new ParseError(
          `Invalid ARP URL: semantic, transport, and location are required`,
          url
        );
      }

      const arpUrl = `arp:${semantic}:${transport}://${location}`;

      return {
        arpUrl,
        parsed: { semantic, transport, location },
      };
    }

    // Resource URL: {alias}:name://location (0 colons before ://)
    if (colonCount === 0) {
      const name = beforeSeparator;

      if (!name || !location) {
        throw new ParseError(`Invalid Resource URL: name and location are required`, url);
      }

      const definition = this.resourceRegistry.get(name);
      if (!definition) {
        throw new ParseError(`Unknown resource: "${name}"`, url);
      }

      // Expand to full location
      const fullLocation = definition.basePath ? join(definition.basePath, location) : location;

      // Build ARP URL
      const arpUrl = `arp:${definition.semantic}:${definition.transport}://${fullLocation}`;

      return {
        arpUrl,
        parsed: {
          semantic: definition.semantic,
          transport: definition.transport,
          location: fullLocation,
        },
      };
    }

    throw new ParseError(`Invalid URL format: unexpected colon count in "${beforeSeparator}"`, url);
  }

  /**
   * Parse an ARP URL without fetching
   */
  parse(url: string): ParsedARP {
    return this.parseURL(url).parsed;
  }

  /**
   * Resolve a URL to a resource
   */
  async resolve(url: string): Promise<Resource> {
    const { arpUrl } = this.parseURL(url);
    // TODO: implement timeout using this.timeout
    return coreResolve(arpUrl);
  }

  /**
   * Deposit data to a URL
   */
  async deposit(url: string, data: unknown): Promise<void> {
    const { arpUrl } = this.parseURL(url);
    return coreDeposit(arpUrl, data);
  }

  /**
   * Check if resource exists at URL
   */
  async exists(url: string): Promise<boolean> {
    const { arpUrl } = this.parseURL(url);
    return coreExists(arpUrl);
  }

  /**
   * Delete resource at URL
   */
  async delete(url: string): Promise<void> {
    const { arpUrl } = this.parseURL(url);
    return coreDelete(arpUrl);
  }
}
