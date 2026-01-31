/**
 * Registry layer - business logic for RXR operations.
 *
 * Three registry types for different use cases:
 * - LocalRegistry: Local/owned resources (no domain in path)
 * - MirrorRegistry: Cached remote resources (domain in path)
 * - LinkedRegistry: Development symlinks
 */

export type { Registry, SearchOptions } from "./Registry.js";
export { LocalRegistry } from "./LocalRegistry.js";
export { MirrorRegistry } from "./MirrorRegistry.js";
export { LinkedRegistry } from "./LinkedRegistry.js";
