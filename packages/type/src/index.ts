/**
 * @resourcexjs/type - ResourceX Type System
 */

// Types
export type {
  ResourceType,
  ResourceSerializer,
  ResourceResolver,
  ResolvedResource,
  JSONSchema,
  JSONSchemaProperty,
} from "./types.js";

// Errors
export { ResourceTypeError } from "./errors.js";

// Builtin types
export { textType, jsonType, binaryType, builtinTypes } from "./builtinTypes.js";

// Type handler chain (global singleton)
export { TypeHandlerChain, globalTypeHandlerChain } from "./TypeHandlerChain.js";
