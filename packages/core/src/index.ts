/**
 * @resourcexjs/core
 *
 * ResourceX Core - Resource primitives and types
 */

// Errors
export {
  ResourceXError,
  LocatorError,
  ManifestError,
  ContentError,
  DefinitionError,
} from "~/errors.js";

// Types
export type { RXD, RXL, RXM, RXA, RXR } from "~/types/index.js";

// Primitives
export {
  define,
  manifest,
  archive,
  locate,
  resource,
  extract,
  format,
  parse,
  wrap,
} from "~/primitives/index.js";
