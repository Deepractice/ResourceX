import type { BundledType } from "./types.js";
import { ResourceTypeError } from "./errors.js";
import { builtinTypes } from "./builtinTypes.js";

/**
 * TypeHandlerChain - Manages resource type registration.
 *
 * Responsibilities:
 * - Register types (name + aliases)
 * - Look up types by name
 *
 * Execution is delegated to ResolverExecutor (in registry package).
 *
 * Built-in types (text, json, binary) are registered by default.
 */
export class TypeHandlerChain {
  private handlers: Map<string, BundledType> = new Map();

  private constructor() {
    // Register builtin types by default
    for (const type of builtinTypes) {
      this.registerInternal(type);
    }
  }

  /**
   * Create a new TypeHandlerChain instance.
   * Built-in types (text, json, binary) are included by default.
   */
  static create(): TypeHandlerChain {
    return new TypeHandlerChain();
  }

  /**
   * Internal registration (no duplicate check).
   */
  private registerInternal(type: BundledType): void {
    this.handlers.set(type.name, type);
    if (type.aliases) {
      for (const alias of type.aliases) {
        this.handlers.set(alias, type);
      }
    }
  }

  /**
   * Register a type.
   * @throws ResourceTypeError if type is already registered
   */
  register(type: BundledType): void {
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
   * @throws ResourceTypeError if type is not supported
   */
  getHandler(typeName: string): BundledType {
    const handler = this.handlers.get(typeName);
    if (!handler) {
      throw new ResourceTypeError(`Unsupported resource type: ${typeName}`);
    }
    return handler;
  }

  /**
   * Get handler for a type, or undefined if not found.
   */
  getHandlerOrUndefined(typeName: string): BundledType | undefined {
    return this.handlers.get(typeName);
  }

  /**
   * Get all supported type names (including aliases).
   */
  getSupportedTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all registered types (for testing).
   */
  clear(): void {
    this.handlers.clear();
  }
}
