/**
 * Registry layer - business logic for RXR operations.
 *
 * Registry types:
 * - CASRegistry: Content-addressable storage (primary)
 * - LinkedRegistry: Development symlinks
 */

export { CASRegistry } from "./CASRegistry.js";
export type { Registry, SearchOptions } from "./Registry.js";
