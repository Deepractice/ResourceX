/**
 * ARL - Agent Resource Locator Implementation
 */

import { SemanticError, TransportError } from "./errors.js";
import type { Resource, SemanticContext, SemanticHandler } from "./semantic/types.js";
import type { ListOptions, TransportHandler, TransportParams } from "./transport/types.js";
import type { ARL as IARL } from "./types.js";

/**
 * Handler resolver interface (implemented by ARP instance)
 */
export interface HandlerResolver {
  getTransportHandler(name: string): TransportHandler;
  getSemanticHandler(name: string): SemanticHandler;
}

/**
 * ARL Implementation
 */
export class ARL implements IARL {
  readonly semantic: string;
  readonly transport: string;
  readonly location: string;

  private readonly resolver: HandlerResolver;

  constructor(semantic: string, transport: string, location: string, resolver: HandlerResolver) {
    this.semantic = semantic;
    this.transport = transport;
    this.location = location;
    this.resolver = resolver;
  }

  /**
   * Create semantic context
   */
  private createContext(params?: TransportParams): SemanticContext {
    return {
      url: this.toString(),
      semantic: this.semantic,
      transport: this.transport,
      location: this.location,
      timestamp: new Date(),
      params,
    };
  }

  /**
   * Resolve the resource
   */
  async resolve(params?: TransportParams): Promise<Resource> {
    const transport = this.resolver.getTransportHandler(this.transport);
    const semantic = this.resolver.getSemanticHandler(this.semantic);
    const context = this.createContext(params);

    return semantic.resolve(transport, this.location, context);
  }

  /**
   * Deposit data to the resource
   */
  async deposit(data: unknown, params?: TransportParams): Promise<void> {
    const transport = this.resolver.getTransportHandler(this.transport);
    const semantic = this.resolver.getSemanticHandler(this.semantic);
    const context = this.createContext(params);

    if (!semantic.deposit) {
      throw new SemanticError(
        `Semantic "${semantic.name}" does not support deposit operation`,
        this.semantic
      );
    }

    await semantic.deposit(transport, this.location, data, context);
  }

  /**
   * Check if resource exists
   */
  async exists(): Promise<boolean> {
    const transport = this.resolver.getTransportHandler(this.transport);
    const semantic = this.resolver.getSemanticHandler(this.semantic);
    const context = this.createContext();

    if (semantic.exists) {
      return semantic.exists(transport, this.location, context);
    }

    // Fallback to transport exists
    return transport.exists(this.location);
  }

  /**
   * Delete the resource
   */
  async delete(): Promise<void> {
    const transport = this.resolver.getTransportHandler(this.transport);
    const semantic = this.resolver.getSemanticHandler(this.semantic);
    const context = this.createContext();

    if (semantic.delete) {
      return semantic.delete(transport, this.location, context);
    }

    // Fallback to transport delete
    await transport.delete(this.location);
  }

  /**
   * List directory contents
   */
  async list(options?: ListOptions): Promise<string[]> {
    const transport = this.resolver.getTransportHandler(this.transport);

    if (!transport.list) {
      throw new TransportError(
        `Transport "${transport.name}" does not support list operation`,
        this.transport
      );
    }

    return transport.list(this.location, options);
  }

  /**
   * Create directory
   */
  async mkdir(): Promise<void> {
    const transport = this.resolver.getTransportHandler(this.transport);

    if (!transport.mkdir) {
      throw new TransportError(
        `Transport "${transport.name}" does not support mkdir operation`,
        this.transport
      );
    }

    await transport.mkdir(this.location);
  }

  /**
   * Convert to ARP URL string
   */
  toString(): string {
    return `arp:${this.semantic}:${this.transport}://${this.location}`;
  }
}
