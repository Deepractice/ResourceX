/**
 * @resourcexjs/core
 *
 * ResourceX Core - Resource management layer
 */

// Errors
export {
  ResourceXError,
  LocatorError,
  ManifestError,
  ContentError,
  ResourceTypeError,
} from "~/errors.js";

// Locator (RXL)
export type { RXL } from "~/locator/index.js";
export { parseRXL } from "~/locator/index.js";

// Manifest (RXM)
export type { RXM, ManifestData } from "~/manifest/index.js";
export { createRXM } from "~/manifest/index.js";

// Content (RXC)
export type { RXC } from "~/content/index.js";
export { createRXC, loadRXC } from "~/content/index.js";

// Resource (RXR)
export type {
  RXR,
  ResourceType,
  ResourceSerializer,
  ResourceResolver,
  ResourceLoader,
} from "~/resource/index.js";
export { defineResourceType, getResourceType, clearResourceTypes } from "~/resource/index.js";
export { textType, jsonType, binaryType, builtinTypes } from "~/resource/index.js";
export { TypeHandlerChain, createTypeHandlerChain } from "~/resource/index.js";
export { FolderLoader, loadResource } from "~/resource/index.js";
export type { LoadResourceConfig } from "~/resource/index.js";
