/**
 * ResourceX Registry HTTP API Protocol
 *
 * Defines the contract between ResourceX client and registry server.
 */

// ============================================
// API Endpoints
// ============================================

export const API_VERSION = "v1";
export const API_PREFIX = `/api/${API_VERSION}`;

export const ENDPOINTS = {
  publish: `${API_PREFIX}/publish`,
  resource: `${API_PREFIX}/resource`,
  content: `${API_PREFIX}/content`,
  search: `${API_PREFIX}/search`,
  health: `${API_PREFIX}/health`,
} as const;

export const CONTENT_TYPES = {
  json: "application/json",
  binary: "application/gzip",
  formData: "multipart/form-data",
} as const;

// ============================================
// Request Types
// ============================================

export interface ManifestData {
  registry?: string;
  path?: string;
  name: string;
  type: string;
  tag: string;
}

export const PUBLISH_FIELDS = {
  locator: "locator",
  manifest: "manifest",
  content: "content",
} as const;

export interface SearchQuery {
  q?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// Response Types
// ============================================

export interface PublishResponse {
  locator: string;
}

export type GetResourceResponse = ManifestData;

export interface SearchResultItem {
  locator: string;
  registry?: string;
  path?: string;
  name: string;
  type: string;
  tag: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total?: number;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}

// ============================================
// Error Codes
// ============================================

export const ERROR_CODES = {
  // 400 Bad Request
  LOCATOR_REQUIRED: "LOCATOR_REQUIRED",
  MANIFEST_REQUIRED: "MANIFEST_REQUIRED",
  CONTENT_REQUIRED: "CONTENT_REQUIRED",
  ARCHIVE_REQUIRED: "ARCHIVE_REQUIRED",
  INVALID_MANIFEST: "INVALID_MANIFEST",
  INVALID_LOCATOR: "INVALID_LOCATOR",
  MISSING_REQUIRED_FIELDS: "MISSING_REQUIRED_FIELDS",

  // 404 Not Found
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  // 500 Internal Server Error
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_STATUS: Record<ErrorCode, number> = {
  [ERROR_CODES.LOCATOR_REQUIRED]: 400,
  [ERROR_CODES.MANIFEST_REQUIRED]: 400,
  [ERROR_CODES.CONTENT_REQUIRED]: 400,
  [ERROR_CODES.ARCHIVE_REQUIRED]: 400,
  [ERROR_CODES.INVALID_MANIFEST]: 400,
  [ERROR_CODES.INVALID_LOCATOR]: 400,
  [ERROR_CODES.MISSING_REQUIRED_FIELDS]: 400,
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.INTERNAL_ERROR]: 500,
};

// ============================================
// URL Builders
// ============================================

export function buildResourceUrl(baseUrl: string, locator: string): string {
  return `${baseUrl.replace(/\/$/, "")}${ENDPOINTS.resource}/${encodeURIComponent(locator)}`;
}

export function buildContentUrl(baseUrl: string, locator: string): string {
  return `${baseUrl.replace(/\/$/, "")}${ENDPOINTS.content}/${encodeURIComponent(locator)}`;
}

export function buildPublishUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}${ENDPOINTS.publish}`;
}

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
