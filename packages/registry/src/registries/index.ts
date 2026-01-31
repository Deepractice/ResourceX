/**
 * Registry layer - business logic for RXR operations.
 *
 * Three registry types for different use cases:
 * - HostedRegistry: Resources you own (authoritative data)
 * - MirrorRegistry: Cached/mirrored remote resources
 * - LinkedRegistry: Development symlinks
 */

export type { Registry, SearchOptions } from "./Registry.js";
export { HostedRegistry } from "./HostedRegistry.js";
export { MirrorRegistry } from "./MirrorRegistry.js";
export { LinkedRegistry } from "./LinkedRegistry.js";
