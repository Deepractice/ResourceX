/**
 * Isolator type for resolver execution.
 * Matches SandboX isolator types directly.
 * Configured at Registry level, not per-type.
 *
 * - "none": No isolation, fastest (~10ms), for development
 * - "srt": OS-level isolation (~50ms), secure local dev
 * - "cloudflare": Container isolation (~100ms), local Docker or edge
 * - "e2b": MicroVM isolation (~150ms), production (planned)
 */
export type IsolatorType = "none" | "srt" | "cloudflare" | "e2b";

/**
 * ResolveContext - Pure data context passed to resolver in sandbox.
 *
 * This is a serializable data structure that replaces RXR for sandbox execution.
 * The executor pre-processes RXR (extracts files) before passing to resolver.
 */
export interface ResolveContext {
  /**
   * Resource manifest metadata.
   */
  manifest: {
    domain: string;
    path?: string;
    name: string;
    type: string;
    tag: string;
  };

  /**
   * Extracted files from archive.
   * Key is file path, value is file content as Uint8Array.
   */
  files: Record<string, Uint8Array>;
}

/**
 * BundledType - Pre-bundled resource type ready for execution.
 * Contains bundled code string instead of closure.
 *
 * Note: Sandbox isolation is configured at Registry level via createRegistry({ sandbox: ... })
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
   * Original resource object (RXR from @resourcexjs/core).
   */
  resource: unknown;

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
 * ResourceResolver - Transforms resource into a structured result object.
 * The execute function is lazy-loaded: content is only read when called.
 */
export interface ResourceResolver<TArgs = void, TResult = unknown> {
  /**
   * JSON Schema for arguments (required if TArgs is not void).
   * This constraint ensures type safety at definition time.
   */
  schema: TArgs extends void ? undefined : JSONSchema;

  /**
   * Resolve resource into a structured result object.
   * @param rxr - RXR object from @resourcexjs/core
   */
  resolve(rxr: unknown): Promise<ResolvedResource<TArgs, TResult>>;
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
