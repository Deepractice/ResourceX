import type { ResourceType } from "./types.js";
import type { RXR, RXM } from "@resourcexjs/core";
import { ResourceTypeError } from "./errors.js";
import { builtinTypes } from "./builtinTypes.js";

/**
 * TypeHandlerChain - Global singleton for type handling.
 * Manages type registration and delegates serialization/deserialization.
 */
export class TypeHandlerChain {
  private static instance: TypeHandlerChain;
  private handlers: Map<string, ResourceType> = new Map();

  private constructor() {
    // Auto-register builtin types
    for (const type of builtinTypes) {
      this.registerBuiltin(type);
    }
  }

  /**
   * Get the global singleton instance.
   */
  static getInstance(): TypeHandlerChain {
    if (!TypeHandlerChain.instance) {
      TypeHandlerChain.instance = new TypeHandlerChain();
    }
    return TypeHandlerChain.instance;
  }

  /**
   * Register a builtin type (private, called during initialization).
   */
  private registerBuiltin(type: ResourceType): void {
    this.handlers.set(type.name, type);
    if (type.aliases) {
      for (const alias of type.aliases) {
        this.handlers.set(alias, type);
      }
    }
  }

  /**
   * Register an extension type (public, for user-defined types).
   * @throws ResourceTypeError if type is already registered
   */
  register(type: ResourceType): void {
    if (this.handlers.has(type.name)) {
      throw new ResourceTypeError(`Type '${type.name}' is already registered`);
    }
    this.handlers.set(type.name, type);
    if (type.aliases) {
      for (const alias of type.aliases) {
        if (this.handlers.has(alias)) {
          throw new ResourceTypeError(`Alias '${alias}' conflicts with existing type or alias`);
        }
        this.handlers.set(alias, type);
      }
    }
  }

  /**
   * Check if a type is supported.
   */
  canHandle(typeName: string): boolean {
    return this.handlers.has(typeName);
  }

  /**
   * Get handler for a type.
   */
  getHandler(typeName: string): ResourceType | undefined {
    return this.handlers.get(typeName);
  }

  /**
   * Get all supported type names (including aliases).
   */
  getSupportedTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Serialize RXR content using the appropriate type handler.
   * @throws ResourceTypeError if type is not supported
   */
  async serialize(rxr: RXR): Promise<Buffer> {
    const typeName = rxr.manifest.type;
    const handler = this.handlers.get(typeName);

    if (!handler) {
      throw new ResourceTypeError(`Unsupported resource type: ${typeName}`);
    }

    return handler.serializer.serialize(rxr);
  }

  /**
   * Deserialize content into RXR using the appropriate type handler.
   * @throws ResourceTypeError if type is not supported
   */
  async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
    const typeName = manifest.type;
    const handler = this.handlers.get(typeName);

    if (!handler) {
      throw new ResourceTypeError(`Unsupported resource type: ${typeName}`);
    }

    return handler.serializer.deserialize(data, manifest);
  }

  /**
   * Resolve RXR content into usable object using the appropriate type handler.
   * @throws ResourceTypeError if type is not supported
   */
  async resolve<T = unknown>(rxr: RXR): Promise<T> {
    const typeName = rxr.manifest.type;
    const handler = this.handlers.get(typeName);

    if (!handler) {
      throw new ResourceTypeError(`Unsupported resource type: ${typeName}`);
    }

    return handler.resolver.resolve(rxr) as Promise<T>;
  }

  /**
   * Clear all extension types (for testing).
   * Keeps builtin types intact.
   */
  clearExtensions(): void {
    this.handlers.clear();
    for (const type of builtinTypes) {
      this.registerBuiltin(type);
    }
  }
}

/**
 * Global singleton instance of TypeHandlerChain.
 * All type registration and handling goes through this instance.
 */
export const globalTypeHandlerChain: TypeHandlerChain = TypeHandlerChain.getInstance();
