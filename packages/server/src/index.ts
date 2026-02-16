/**
 * @resourcexjs/server
 *
 * ResourceX Registry Server - Protocol, Handlers, and Hono Server
 *
 * @example
 * ```typescript
 * import { createRegistryServer } from "@resourcexjs/server";
 * import { FileSystemRXAStore, FileSystemRXMStore } from "@resourcexjs/node-provider";
 *
 * const server = createRegistryServer({
 *   rxaStore: new FileSystemRXAStore("./data/blobs"),
 *   rxmStore: new FileSystemRXMStore("./data/manifests"),
 * });
 *
 * Bun.serve({ fetch: server.fetch, port: 3000 });
 * ```
 *
 * @packageDocumentation
 */

export type { Registry, RXAStore, RXMStore } from "@resourcexjs/core";
// Re-export core types for convenience
export { CASRegistry } from "@resourcexjs/core";
// Re-export node-provider stores for convenience
export { FileSystemRXAStore, FileSystemRXMStore } from "@resourcexjs/node-provider";
// Handlers
export {
  handleDeleteResource,
  handleGetContent,
  handleGetResource,
  handleHeadResource,
  handlePublish,
  handleSearch,
} from "./handlers.js";
// Hono Server
export { createRegistryServer, type RegistryServerConfig } from "./hono.js";
// Protocol
export {
  API_PREFIX,
  API_VERSION,
  buildContentUrl,
  buildPublishUrl,
  buildResourceUrl,
  buildSearchUrl,
  CONTENT_TYPES,
  ENDPOINTS,
  ERROR_CODES,
  ERROR_STATUS,
  type ErrorCode,
  type ErrorResponse,
  type GetResourceResponse,
  type ManifestData,
  PUBLISH_FIELDS,
  type PublishResponse,
  type SearchQuery,
  type SearchResponse,
  type SearchResultItem,
} from "./protocol.js";
