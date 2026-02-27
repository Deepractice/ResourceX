/**
 * @resourcexjs/core - Type System
 */

// Builtin types
export {
  binaryType,
  builtinTypes,
  jsonType,
  prototypeType,
  skillType,
  textType,
} from "./builtinTypes.js";

// Bundler
export { bundleResourceType } from "./bundler.js";

// Errors
export { ResourceTypeError } from "./errors.js";

// Type handler chain
export { TypeHandlerChain } from "./TypeHandlerChain.js";
// Types
export type {
  BundledType,
  IsolatorType,
  JSONSchema,
  JSONSchemaProperty,
  ResolveContext,
  ResolvedResource,
  ResourceResolver,
  ResourceType,
} from "./types.js";
