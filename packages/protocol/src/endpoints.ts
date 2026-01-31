/**
 * ResourceX Registry HTTP API Endpoints
 *
 * Based on ResourceX client implementation.
 */

/**
 * API version
 */
export const API_VERSION = "v1";

/**
 * Registry HTTP API endpoints
 */
export const ENDPOINTS = {
  /**
   * Resource manifest operations
   *
   * GET  /resource?locator=xxx  - Get manifest
   * POST /resource              - Create/update manifest
   * HEAD /resource?locator=xxx  - Check existence
   * DELETE /resource?locator=xxx - Delete resource
   */
  resource: "/resource",

  /**
   * Resource content (archive) operations
   *
   * GET  /content?locator=xxx - Get archive
   * POST /content?locator=xxx - Upload archive
   */
  content: "/content",

  /**
   * Search resources
   *
   * GET /search?q=xxx&limit=100&offset=0
   */
  search: "/search",
} as const;

/**
 * HTTP methods for each endpoint
 */
export const METHODS = {
  resource: {
    GET: "Get manifest by locator",
    POST: "Create or update manifest",
    HEAD: "Check if resource exists",
    DELETE: "Delete resource",
  },
  content: {
    GET: "Get archive by locator",
    POST: "Upload archive",
  },
  search: {
    GET: "Search resources",
  },
} as const;

/**
 * Content types
 */
export const CONTENT_TYPES = {
  json: "application/json",
  binary: "application/octet-stream",
  gzip: "application/gzip",
} as const;

/**
 * Build endpoint URL with query parameters
 */
export function buildUrl(
  baseUrl: string,
  endpoint: keyof typeof ENDPOINTS,
  params?: Record<string, string>
): string {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}${ENDPOINTS[endpoint]}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}
