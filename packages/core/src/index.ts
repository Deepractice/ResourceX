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

// Content (RXC)
export type { RXC, RXCInput } from "~/content/index.js";
export { createRXC } from "~/content/index.js";

// Resource (RXR)
export type { RXR } from "~/resource/index.js";
