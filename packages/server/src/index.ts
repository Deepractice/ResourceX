/**
 * @resourcexjs/server
 *
 * ResourceX Registry Server - Protocol, Handlers, and Hono Server
 *
 * @example
 * ```typescript
 * // Option 1: Use Hono Server directly
 * import { createRegistryServer } from "@resourcexjs/server";
 * const server = createRegistryServer({ storagePath: "./data" });
 * Bun.serve({ fetch: server.fetch, port: 3000 });
 *
 * // Option 2: Use handlers with Next.js Route Handler
 * import { handlePublish, handleSearch, createRegistry } from "@resourcexjs/server";
 * const registry = createRegistry({ storagePath: "./data" });
 * export async function POST(req) { return handlePublish(req, registry); }
 *
 * // Option 3: Use protocol types only
 * import { ENDPOINTS, type PublishResponse } from "@resourcexjs/server";
 * ```
 *
 * @packageDocumentation
 */

// Protocol
export {
  API_VERSION,
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

// Re-export Registry for convenience
export { LocalRegistry } from "@resourcexjs/registry";
export { FileSystemStorage, MemoryStorage } from "@resourcexjs/storage";

/**
 * Convenience function to create a registry instance.
 */
import { FileSystemStorage } from "@resourcexjs/storage";
import { LocalRegistry } from "@resourcexjs/registry";
import type { Registry } from "@resourcexjs/registry";

export interface CreateRegistryConfig {
  storagePath: string;
}

export function createRegistry(config: CreateRegistryConfig): Registry {
  const storage = new FileSystemStorage(config.storagePath);
  return new LocalRegistry(storage);
}
