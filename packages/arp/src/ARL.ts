/**
 * ARL - Agent Resource Locator Implementation
 */

import type { ARL as IARL } from "./types.js";
import type { Resource, SemanticContext, SemanticHandler } from "./semantic/types.js";
import type { TransportHandler } from "./transport/types.js";
import { SemanticError } from "./errors.js";

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
  private createContext(): SemanticContext {
    return {
      url: this.toString(),
      semantic: this.semantic,
      transport: this.transport,
      location: this.location,
      timestamp: new Date(),
    };
  }

  /**
   * Resolve the resource
   */
  async resolve(): Promise<Resource> {
    const transport = this.resolver.getTransportHandler(this.transport);
    const semantic = this.resolver.getSemanticHandler(this.semantic);
    const context = this.createContext();

    return semantic.resolve(transport, this.location, context);
  }

  /**
   * Deposit data to the resource
   */
  async deposit(data: unknown): Promise<void> {
    const transport = this.resolver.getTransportHandler(this.transport);
    const semantic = this.resolver.getSemanticHandler(this.semantic);
    const context = this.createContext();

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
    if (transport.exists) {
      return transport.exists(this.location);
    }

    // Fallback: try to read
    try {
      await transport.read(this.location);
      return true;
    } catch {
      return false;
    }
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
    if (!transport.delete) {
      throw new SemanticError(
        `Neither semantic "${semantic.name}" nor transport "${transport.name}" supports delete operation`,
        this.semantic
      );
    }

    await transport.delete(this.location);
  }

  /**
   * Convert to ARP URL string
   */
  toString(): string {
    return `arp:${this.semantic}:${this.transport}://${this.location}`;
  }
}
