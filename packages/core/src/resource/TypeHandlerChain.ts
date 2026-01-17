import type { ResourceType, RXR } from "./types.js";
import type { RXM } from "~/manifest/types.js";
import { ResourceTypeError } from "~/errors.js";

/**
 * TypeHandlerChain - Responsibility chain for resource type handling.
 * Manages type registration and delegates serialization/deserialization.
 */
export class TypeHandlerChain {
  private handlers: Map<string, ResourceType> = new Map();

  /**
   * Register a resource type handler.
   * Registers both the type name and its aliases.
   */
  register(type: ResourceType): void {
    this.handlers.set(type.name, type);
    if (type.aliases) {
      for (const alias of type.aliases) {
        this.handlers.set(alias, type);
      }
    }
  }

  /**
   * Register multiple type handlers.
   */
  registerAll(types: ResourceType[]): void {
    for (const type of types) {
      this.register(type);
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
   * Serialize RXR content using the appropriate type handler.
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
   */
  async resolve<T = unknown>(rxr: RXR): Promise<T> {
    const typeName = rxr.manifest.type;
    const handler = this.handlers.get(typeName);

    if (!handler) {
      throw new ResourceTypeError(`Unsupported resource type: ${typeName}`);
    }

    return handler.resolver.resolve(rxr) as Promise<T>;
  }
}

/**
 * Create a new TypeHandlerChain with optional initial types.
 */
export function createTypeHandlerChain(types?: ResourceType[]): TypeHandlerChain {
  const chain = new TypeHandlerChain();
  if (types) {
    chain.registerAll(types);
  }
  return chain;
}
