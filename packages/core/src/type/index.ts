/**
 * @resourcexjs/core - Type System
 */

// Types
export type {
  ResourceType,
  ResourceResolver,
  ResolvedResource,
  ResolveContext,
  JSONSchema,
  JSONSchemaProperty,
  BundledType,
  IsolatorType,
} from "./types.js";

// Bundler
export { bundleResourceType } from "./bundler.js";

// Errors
export { ResourceTypeError } from "./errors.js";

// Type handler chain
export { TypeHandlerChain } from "./TypeHandlerChain.js";

// Builtin types
export { textType, jsonType, binaryType, skillType, builtinTypes } from "./builtinTypes.js";
