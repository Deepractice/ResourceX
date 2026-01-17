/**
 * Semantic Handlers
 */

export type { Resource, SemanticHandler, ResourceMeta, SemanticContext } from "./types.js";
export { TextSemanticHandler, textSemantic, type TextResource } from "./text.js";
export {
  BinarySemanticHandler,
  binarySemantic,
  type BinaryResource,
  type BinaryInput,
} from "./binary.js";
