/**
 * Semantic Handlers Registry
 */

import { SemanticError } from "../errors.js";

export type { Resource, SemanticHandler, ResourceMeta, ParseContext } from "./types.js";
export type { TextResource } from "./text.js";
export { TextSemanticHandler, textHandler } from "./text.js";

import type { SemanticHandler } from "./types.js";
import { textHandler } from "./text.js";

const handlers: Map<string, SemanticHandler> = new Map([["text", textHandler]]);

/**
 * Get semantic handler by type
 */
export function getSemanticHandler(type: string): SemanticHandler {
  const handler = handlers.get(type);
  if (!handler) {
    throw new SemanticError(`Unsupported semantic type: ${type}`, type);
  }
  return handler;
}

/**
 * Register a custom semantic handler
 */
export function registerSemanticHandler(handler: SemanticHandler): void {
  handlers.set(handler.type, handler);
}
