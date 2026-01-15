/**
 * ResourceX - Main API class
 */

import {
  parseARP,
  resolve as coreResolve,
  getTransportHandler,
  getSemanticHandler,
  registerTransportHandler,
  registerSemanticHandler,
  type ParsedARP,
  type Resource,
  type TransportHandler,
  type SemanticHandler,
} from "@resourcexjs/core";

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
}

/**
 * ResourceX instance
 */
export class ResourceX {
  readonly timeout?: number;

  constructor(config: ResourceXConfig = {}) {
    this.timeout = config.timeout;

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
  }

  /**
   * Parse an ARP URL without fetching
   */
  parse(url: string): ParsedARP {
    return parseARP(url);
  }

  /**
   * Resolve an ARP URL to a resource
   */
  async resolve(url: string): Promise<Resource> {
    // TODO: implement timeout using this.timeout
    return coreResolve(url);
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
   * Get a transport handler by type
   */
  getTransport(type: string): TransportHandler {
    return getTransportHandler(type);
  }

  /**
   * Get a semantic handler by type
   */
  getSemantic(type: string): SemanticHandler {
    return getSemanticHandler(type);
  }
}
