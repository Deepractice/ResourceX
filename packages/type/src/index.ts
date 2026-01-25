/**
 * @resourcexjs/type - ResourceX Type System
 */

// Types
export type {
  ResourceType,
  ResourceResolver,
  ResolvedResource,
  JSONSchema,
  JSONSchemaProperty,
  BundledType,
  SandboxType,
} from "./types.js";

// Bundler
export { bundleResourceType } from "./bundler.js";

// Errors
export { ResourceTypeError } from "./errors.js";

// Builtin types
export { textType, jsonType, binaryType, builtinTypes } from "./builtinTypes.js";

// Type handler chain
export { TypeHandlerChain } from "./TypeHandlerChain.js";
