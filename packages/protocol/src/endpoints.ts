/**
 * Registry HTTP API Endpoints
 *
 * All endpoints are relative to the API base path (e.g., /api/v1)
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
   * GET /resource?locator=xxx
   * Get resource manifest by locator
   */
  resource: "/resource",

  /**
   * GET /content?locator=xxx
   * Get resource archive (tar.gz) by locator
   */
  content: "/content",

  /**
   * POST /publish
   * Publish a new resource (multipart/form-data)
   */
  publish: "/publish",

  /**
   * GET /search?q=xxx&limit=100&offset=0
   * Search resources
   */
  search: "/search",

  /**
   * POST /resolve
   * Resolve and execute resource in cloud (Phase 3)
   */
  resolve: "/resolve",
} as const;

/**
 * HTTP methods for each endpoint
 */
export const ENDPOINT_METHODS = {
  resource: {
    GET: "Get manifest",
    HEAD: "Check existence",
    DELETE: "Delete resource",
  },
  content: {
    GET: "Get archive",
  },
  publish: {
    POST: "Publish resource",
  },
  search: {
    GET: "Search resources",
  },
  resolve: {
    POST: "Resolve and execute",
  },
} as const;

/**
 * Build full endpoint URL
 */
export function buildEndpointUrl(
  baseUrl: string,
  endpoint: keyof typeof ENDPOINTS,
  params?: Record<string, string>
): string {
  const url = new URL(`${baseUrl}${ENDPOINTS[endpoint]}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}
