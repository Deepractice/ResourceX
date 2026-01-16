/**
 * ResourceX - Main API class
 */

import {
  parseARP,
  resolve as coreResolve,
  deposit as coreDeposit,
  resourceExists as coreExists,
  resourceDelete as coreDelete,
  getTransportHandler,
  getSemanticHandler,
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
  private readonly resourceRegistry: ResourceRegistry;

  constructor(config: ResourceXConfig = {}) {
    this.timeout = config.timeout;
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
   * Parse URL (supports both ARP and Resource URLs)
   */
  private parseURL(url: string): { arpUrl: string; parsed: ParsedARP } {
    // Standard ARP URL
    if (url.startsWith("arp:")) {
      return { arpUrl: url, parsed: parseARP(url) };
    }

    // Resource URL: name://location
    const match = url.match(/^([a-z][a-z0-9-]*):\/\/(.*)$/);
    if (!match) {
      throw new ParseError(`Invalid URL format: ${url}`, url);
    }

    const [, name, location] = match;
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

  /**
   * Register a custom transport handler
   */
  registerTransport(handler: TransportHandler): void {
    registerTransportHandler(handler);
  }

  /**
   * Register a custom semantic handler
   */
  registerSemantic(handler: SemanticHandler): void {
    registerSemanticHandler(handler);
  }

  /**
   * Get a transport handler by name
   */
  getTransport(name: string): TransportHandler {
    return getTransportHandler(name);
  }

  /**
   * Get a semantic handler by name
   */
  getSemantic(name: string): SemanticHandler {
    return getSemanticHandler(name);
  }
}
