/**
 * resourcexjs - Agent Resource Protocol for AI Agents
 *
 * @example
 * ```typescript
 * import { createResourceX } from "resourcexjs";
 *
 * const rx = createResourceX();
 * const resource = await rx.resolve("arp:text:https://example.com/file.txt");
 *
 * console.log(resource.type);     // "text"
 * console.log(resource.content);  // "..."
 * console.log(resource.meta);     // { url, semantic, transport, ... }
 * ```
 *
 * @packageDocumentation
 */

// Factory
export { createResourceX } from "./createResourceX.js";

// Class (for advanced usage)
export { ResourceX, type ResourceXConfig } from "./ResourceX.js";

// Re-export types and errors from core
export type {
  Resource,
  ResourceMeta,
  ParsedARP,
  SemanticContext,
  TransportHandler,
  TransportCapabilities,
  ResourceStat,
  SemanticHandler,
  TextResource,
  ResourceDefinition,
} from "@resourcexjs/core";

export { ResourceXError, ParseError, TransportError, SemanticError } from "@resourcexjs/core";
