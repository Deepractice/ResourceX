/**
 * @resourcexjs/core - Resource Loader
 */

// Types
export type { ResourceLoader, SourceLoader } from "./types.js";

// Loaders
export { FolderLoader } from "./FolderLoader.js";
export { FolderSourceLoader } from "./FolderSourceLoader.js";
export { GitHubSourceLoader } from "./GitHubSourceLoader.js";
export { SourceLoaderChain } from "./SourceLoaderChain.js";

// Load functions
export { loadResource } from "./loadResource.js";
export type { LoadResourceConfig } from "./loadResource.js";
export { resolveSource } from "./resolveSource.js";
export type { ResolveSourceConfig } from "./resolveSource.js";
