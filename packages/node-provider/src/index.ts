/**
 * @resourcexjs/node-provider
 *
 * Node.js/Bun provider for ResourceX - FileSystem stores implementation.
 *
 * @example
 * ```typescript
 * // For resourcexjs client
 * import { setProvider } from "resourcexjs";
 * import { NodeProvider } from "@resourcexjs/node-provider";
 * setProvider(new NodeProvider());
 *
 * // For server
 * import { createRegistryServer } from "@resourcexjs/server";
 * import { FileSystemRXAStore, FileSystemRXMStore } from "@resourcexjs/node-provider";
 *
 * const server = createRegistryServer({
 *   rxaStore: new FileSystemRXAStore("./data/blobs"),
 *   rxmStore: new FileSystemRXMStore("./data/manifests"),
 * });
 * ```
 *
 * @packageDocumentation
 */

export { bundleResourceType } from "./bundler.js";
export { FileSystemRXAStore } from "./FileSystemRXAStore.js";
export { FileSystemRXMStore } from "./FileSystemRXMStore.js";
export { FolderLoader } from "./FolderLoader.js";
export { FolderSourceLoader } from "./FolderSourceLoader.js";
export { LinkedRegistry } from "./LinkedRegistry.js";
export { NodeProvider } from "./NodeProvider.js";
export { NpmSourceLoader } from "./NpmSourceLoader.js";
