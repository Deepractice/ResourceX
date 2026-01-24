/**
 * @resourcexjs/core
 *
 * ResourceX Core - Resource management layer
 */

// Errors
export { ResourceXError, LocatorError, ManifestError, ContentError } from "~/errors.js";

// Locator (RXL)
export type { RXL } from "~/locator/index.js";
export { parseRXL } from "~/locator/index.js";

// Manifest (RXM)
export type { RXM, ManifestData } from "~/manifest/index.js";
export { createRXM } from "~/manifest/index.js";

// Archive (RXA) and Package (RXP)
export type { RXA, RXP, RXAInput, PathNode } from "~/archive/index.js";
export { createRXA } from "~/archive/index.js";

// Resource (RXR)
export type { RXR } from "~/resource/index.js";
