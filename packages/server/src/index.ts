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

// Protocol
export {
  API_VERSION,
  API_PREFIX,
  ENDPOINTS,
  CONTENT_TYPES,
  PUBLISH_FIELDS,
  ERROR_CODES,
  ERROR_STATUS,
  buildResourceUrl,
  buildContentUrl,
  buildPublishUrl,
  buildSearchUrl,
  type ManifestData,
  type SearchQuery,
  type PublishResponse,
  type GetResourceResponse,
  type SearchResultItem,
  type SearchResponse,
  type ErrorResponse,
  type ErrorCode,
} from "./protocol.js";

// Handlers
export {
  handlePublish,
  handleGetResource,
  handleHeadResource,
  handleDeleteResource,
  handleGetContent,
  handleSearch,
} from "./handlers.js";

// Hono Server
export { createRegistryServer, type RegistryServerConfig } from "./hono.js";

// Re-export core types for convenience
export { CASRegistry } from "@resourcexjs/core";
export type { RXAStore, RXMStore, Registry } from "@resourcexjs/core";

// Re-export node-provider stores for convenience
export { FileSystemRXAStore, FileSystemRXMStore } from "@resourcexjs/node-provider";
