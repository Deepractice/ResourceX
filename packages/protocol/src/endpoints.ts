/**
 * ResourceX Registry HTTP API Endpoints
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
   * POST /publish - Publish a resource (multipart form data)
   *
   * Form fields:
   * - locator: Resource locator string
   * - manifest: JSON blob with manifest data
   * - content: Binary blob with archive content
   */
  publish: "/publish",

  /**
   * Resource operations by locator
   *
   * GET    /resource/{locator} - Get manifest
   * HEAD   /resource/{locator} - Check existence
   * DELETE /resource/{locator} - Delete resource
   */
  resource: "/resource",

  /**
   * GET /content/{locator} - Get resource content (archive)
   */
  content: "/content",

  /**
   * GET /search?q=xxx&limit=100&offset=0 - Search resources
   */
  search: "/search",
} as const;

/**
 * HTTP methods for each endpoint
 */
export const METHODS = {
  publish: {
    POST: "Publish resource",
  },
  resource: {
    GET: "Get manifest by locator",
    HEAD: "Check if resource exists",
    DELETE: "Delete resource",
  },
  content: {
    GET: "Get content by locator",
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
  formData: "multipart/form-data",
} as const;

/**
 * Build endpoint URL with path parameter
 */
export function buildResourceUrl(baseUrl: string, locator: string): string {
  return `${baseUrl.replace(/\/$/, "")}${ENDPOINTS.resource}/${encodeURIComponent(locator)}`;
}

/**
 * Build content URL with path parameter
 */
export function buildContentUrl(baseUrl: string, locator: string): string {
  return `${baseUrl.replace(/\/$/, "")}${ENDPOINTS.content}/${encodeURIComponent(locator)}`;
}

/**
 * Build publish URL
 */
export function buildPublishUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}${ENDPOINTS.publish}`;
}

/**
 * Build search URL with query parameters
 */
export function buildSearchUrl(
  baseUrl: string,
  params?: { q?: string; limit?: number; offset?: number }
): string {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}${ENDPOINTS.search}`);
  if (params?.q) url.searchParams.set("q", params.q);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.offset) url.searchParams.set("offset", String(params.offset));
  return url.toString();
}
