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
 * JSON Schema property definition.
 */
export interface JSONSchemaProperty {
  type: "string" | "number" | "integer" | "boolean" | "object" | "array" | "null";
  description?: string;
  default?: unknown;
  enum?: unknown[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

/**
 * JSON Schema definition for resolver arguments.
 * Used by UI to render parameter forms.
 */
export interface JSONSchema extends JSONSchemaProperty {
  $schema?: string;
  title?: string;
}

/**
 * ResolvedResource - Structured result object returned by resolver.
 * Contains execute function and optional schema for UI rendering.
 */
export interface ResolvedResource<TArgs = void, TResult = unknown> {
  /**
   * Execute function to get the resource content.
   * - For static resources (text/json/binary): call with no arguments
   * - For dynamic resources (tool): call with arguments
   */
  execute: (args?: TArgs) => TResult | Promise<TResult>;

  /**
   * JSON Schema for the arguments (undefined if no arguments needed).
   * UI uses this to render parameter forms.
   */
  schema: TArgs extends void ? undefined : JSONSchema;
}

/**
 * ResourceResolver - Transforms RXR into a structured result object.
 * The execute function is lazy-loaded: content is only read when called.
 */
export interface ResourceResolver<TArgs = void, TResult = unknown> {
  /**
   * JSON Schema for arguments (required if TArgs is not void).
   * This constraint ensures type safety at definition time.
   */
  schema: TArgs extends void ? undefined : JSONSchema;

  /**
   * Resolve RXR into a structured result object.
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
   * Resolver to transform RXR into structured result object.
   */
  resolver: ResourceResolver<TArgs, TResult>;
}
