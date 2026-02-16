/**
 * ARP - Agent Resource Protocol
 * Factory and instance for parsing ARP URLs
 */

import { ARL, type HandlerResolver } from "./ARL.js";
import { ParseError, SemanticError, TransportError } from "./errors.js";
import { binarySemantic, textSemantic } from "./semantic/index.js";
import type { SemanticHandler } from "./semantic/types.js";
import { fileTransport, httpsTransport, httpTransport } from "./transport/index.js";
import type { TransportHandler } from "./transport/types.js";

/**
 * ARP Configuration
 */
export interface ARPConfig {
  /**
   * Custom transport handlers
   */
  transports?: TransportHandler[];

  /**
   * Custom semantic handlers
   */
  semantics?: SemanticHandler[];
}

/**
 * ARP Instance
 */
export class ARP implements HandlerResolver {
  private readonly transports: Map<string, TransportHandler>;
  private readonly semantics: Map<string, SemanticHandler>;

  constructor(config: ARPConfig = {}) {
    this.transports = new Map();
    this.semantics = new Map();

    // Register default handlers
    const defaultTransports = [fileTransport, httpTransport, httpsTransport];
    const defaultSemantics = [textSemantic, binarySemantic];

    for (const handler of defaultTransports) {
      this.transports.set(handler.name, handler);
    }
    for (const handler of defaultSemantics) {
      this.semantics.set(handler.name, handler);
    }

    // Register custom handlers (override defaults if same name)
    if (config.transports) {
      for (const handler of config.transports) {
        this.transports.set(handler.name, handler);
      }
    }

    if (config.semantics) {
      for (const handler of config.semantics) {
        this.semantics.set(handler.name, handler);
      }
    }
  }

  /**
   * Register a transport handler
   */
  registerTransport(handler: TransportHandler): void {
    this.transports.set(handler.name, handler);
  }

  /**
   * Register a semantic handler
   */
  registerSemantic(handler: SemanticHandler): void {
    this.semantics.set(handler.name, handler);
  }

  /**
   * Get transport handler by name
   */
  getTransportHandler(name: string): TransportHandler {
    const handler = this.transports.get(name);
    if (!handler) {
      throw new TransportError(`Unsupported transport type: ${name}`, name);
    }
    return handler;
  }

  /**
   * Get semantic handler by name
   */
  getSemanticHandler(name: string): SemanticHandler {
    const handler = this.semantics.get(name);
    if (!handler) {
      throw new SemanticError(`Unsupported semantic type: ${name}`, name);
    }
    return handler;
  }

  /**
   * Parse an ARP URL into an ARL object
   *
   * @example
   * const arl = arp.parse("arp:text:file:///path/to/file.txt");
   * arl.semantic   // "text"
   * arl.transport  // "file"
   * arl.location   // "/path/to/file.txt"
   */
  parse(url: string): ARL {
    // 1. Check protocol prefix
    if (!url.startsWith("arp:")) {
      throw new ParseError(`Invalid ARP URL: must start with "arp:"`, url);
    }

    const content = url.substring(4); // Remove "arp:"

    // 2. Find :// separator
    const separatorIndex = content.indexOf("://");
    if (separatorIndex === -1) {
      throw new ParseError(`Invalid ARP URL: missing "://"`, url);
    }

    const typePart = content.substring(0, separatorIndex);
    const location = content.substring(separatorIndex + 3);

    // 3. Split type part by :
    const colonIndex = typePart.indexOf(":");
    if (colonIndex === -1) {
      throw new ParseError(`Invalid ARP URL: must have exactly 2 types (semantic:transport)`, url);
    }

    const semantic = typePart.substring(0, colonIndex);
    const transport = typePart.substring(colonIndex + 1);

    // 4. Validate non-empty
    if (!semantic) {
      throw new ParseError(`Invalid ARP URL: semantic type cannot be empty`, url);
    }
    if (!transport) {
      throw new ParseError(`Invalid ARP URL: transport type cannot be empty`, url);
    }
    if (!location) {
      throw new ParseError(`Invalid ARP URL: location cannot be empty`, url);
    }

    // 5. Validate handlers exist
    this.getTransportHandler(transport);
    this.getSemanticHandler(semantic);

    return new ARL(semantic, transport, location, this);
  }
}

/**
 * Create a new ARP instance
 *
 * @example
 * import { createARP, fileTransport, textSemantic } from "arpjs";
 *
 * const arp = createARP({
 *   transports: [fileTransport],
 *   semantics: [textSemantic],
 * });
 *
 * const arl = arp.parse("arp:text:file:///path/to/file.txt");
 * const resource = await arl.resolve();
 */
export function createARP(config?: ARPConfig): ARP {
  return new ARP(config);
}
