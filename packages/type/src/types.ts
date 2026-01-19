import type { RXR, RXM } from "@resourcexjs/core";

/**
 * ResourceSerializer - Handles RXR serialization/deserialization for storage.
 */
export interface ResourceSerializer {
  /**
   * Serialize RXR to storage format.
   */
  serialize(rxr: RXR): Promise<Buffer>;

  /**
   * Deserialize storage data to RXR.
   */
  deserialize(data: Buffer, manifest: RXM): Promise<RXR>;
}

/**
 * ResourceResolver - Transforms RXR into usable object.
 */
export interface ResourceResolver<T = unknown> {
  /**
   * Resolve RXR content into a usable object.
   */
  resolve(rxr: RXR): Promise<T>;
}

/**
 * ResourceType - Defines how a resource type is handled.
 */
export interface ResourceType<T = unknown> {
  /**
   * Type name (e.g., "text", "json", "binary").
   */
  name: string;

  /**
   * Alternative names for this type (e.g., ["txt", "plaintext"]).
   */
  aliases?: string[];

  /**
   * Human-readable description.
   */
  description: string;

  /**
   * Serializer for storage operations.
   */
  serializer: ResourceSerializer;

  /**
   * Resolver to transform RXR into usable object.
   */
  resolver: ResourceResolver<T>;
}
