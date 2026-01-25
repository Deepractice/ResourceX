import type { RXR } from "@resourcexjs/core";

/**
 * Sandbox isolation level for resolver execution.
 */
export type SandboxType = "none" | "isolated" | "container";

/**
 * BundledType - Pre-bundled resource type ready for execution.
 * Contains bundled code string instead of closure.
 */
export interface BundledType {
  /**
   * Type name (e.g., "text", "json", "prompt").
   */
  name: string;

  /**
   * Alternative names for this type.
   */
  aliases?: string[];

  /**
   * Human-readable description.
   */
  description: string;

  /**
   * JSON Schema for resolver arguments.
   */
  schema?: JSONSchema;

  /**
   * Bundled resolver code (executable in sandbox).
   */
  code: string;

  /**
   * Sandbox isolation level. Defaults to "none".
   */
  sandbox?: SandboxType;
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
 * Contains execute function, original resource, and optional schema for UI rendering.
 */
export interface ResolvedResource<TArgs = void, TResult = unknown> {
  /**
   * Original RXR object (locator, manifest, content).
   */
  resource: RXR;

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
   * Resolver to transform RXR into structured result object.
   */
  resolver: ResourceResolver<TArgs, TResult>;
}
