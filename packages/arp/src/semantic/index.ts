/**
 * Semantic Handlers
 */

export {
  type BinaryInput,
  type BinaryResource,
  BinarySemanticHandler,
  binarySemantic,
} from "./binary.js";
export { type TextResource, TextSemanticHandler, textSemantic } from "./text.js";
export type { Resource, ResourceMeta, SemanticContext, SemanticHandler } from "./types.js";
