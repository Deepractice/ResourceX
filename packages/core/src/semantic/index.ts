/**
 * Semantic Handlers Registry
 */

import { SemanticError } from "../errors.js";

export type { Resource, SemanticHandler, ResourceMeta, SemanticContext } from "./types.js";
export type { TextResource } from "./text.js";
export { TextSemanticHandler, textHandler } from "./text.js";

import type { SemanticHandler } from "./types.js";
import { textHandler } from "./text.js";

const handlers: Map<string, SemanticHandler> = new Map([["text", textHandler]]);

/**
 * Get semantic handler by name
 */
export function getSemanticHandler(name: string): SemanticHandler {
  const handler = handlers.get(name);
  if (!handler) {
    throw new SemanticError(`Unsupported semantic type: ${name}`, name);
  }
  return handler;
}

/**
 * Register a custom semantic handler
 */
export function registerSemanticHandler(handler: SemanticHandler): void {
  handlers.set(handler.name, handler);
}
