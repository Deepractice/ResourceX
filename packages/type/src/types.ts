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
 * ResolvedResource - A callable function returned by resolver.
 * - For static resources (text/json/binary): call with no arguments
 * - For dynamic resources (tool): call with arguments
 */
export type ResolvedResource<TArgs = void, TResult = unknown> = (
  args?: TArgs
) => TResult | Promise<TResult>;

/**
 * ResourceResolver - Transforms RXR into a callable function.
 * The function is lazy-loaded: content is only read when called.
 */
export interface ResourceResolver<TArgs = void, TResult = unknown> {
  /**
   * Resolve RXR into a callable function.
   */
  resolve(rxr: RXR): Promise<ResolvedResource<TArgs, TResult>>;
}

/**
 * ResourceType - Defines how a resource type is handled.
 */
export interface ResourceType<TArgs = void, TResult = unknown> {
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
   * Resolver to transform RXR into callable function.
   */
  resolver: ResourceResolver<TArgs, TResult>;
}
