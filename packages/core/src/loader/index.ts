/**
 * @resourcexjs/core - Resource Loader
 */

// Loaders
export { GitHubSourceLoader } from "./GitHubSourceLoader.js";
export type { LoadResourceConfig } from "./loadResource.js";
// Load functions
export { loadResource } from "./loadResource.js";
export type { ResolveSourceConfig } from "./resolveSource.js";
export { resolveSource } from "./resolveSource.js";
export { SourceLoaderChain } from "./SourceLoaderChain.js";
// Types
export type { ResourceLoader, SourceLoader } from "./types.js";
