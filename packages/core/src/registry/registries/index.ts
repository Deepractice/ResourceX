/**
 * Registry layer - business logic for RXR operations.
 *
 * Registry types:
 * - CASRegistry: Content-addressable storage (replaces Local + Mirror)
 * - LinkedRegistry: Development symlinks
 *
 * Legacy (to be removed):
 * - LocalRegistry: Local/owned resources
 * - MirrorRegistry: Cached remote resources
 */

export type { Registry, SearchOptions } from "./Registry.js";
export { CASRegistry } from "./CASRegistry.js";
export { LinkedRegistry } from "./LinkedRegistry.js";

// Legacy - to be removed after migration
export { LocalRegistry } from "./LocalRegistry.js";
export { MirrorRegistry } from "./MirrorRegistry.js";
