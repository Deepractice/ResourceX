/**
 * Registry layer - business logic for RXR operations.
 *
 * Registry types:
 * - CASRegistry: Content-addressable storage (primary)
 * - LinkedRegistry: Development symlinks
 */

export type { Registry, SearchOptions } from "./Registry.js";
export { CASRegistry } from "./CASRegistry.js";
export { LinkedRegistry } from "./LinkedRegistry.js";
