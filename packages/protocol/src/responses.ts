/**
 * ResourceX Registry HTTP API - Response Types
 */

import type { ManifestData } from "./requests.js";

// ============================================
// GET /resource
// ============================================

/**
 * GET /resource response
 *
 * Returns manifest data
 */
export type GetResourceResponse = ManifestData;

// ============================================
// POST /resource
// ============================================

/**
 * POST /resource response
 *
 * Returns created/updated manifest with locator
 */
export interface PostResourceResponse {
  /** Full resource locator */
  locator: string;

  /** Manifest data */
  manifest: ManifestData;
}

// ============================================
// HEAD /resource
// ============================================

/**
 * HEAD /resource response
 *
 * - 200: Resource exists
 * - 404: Resource not found
 *
 * No body
 */
export type HeadResourceResponse = void;

// ============================================
// DELETE /resource
// ============================================

/**
 * DELETE /resource response
 *
 * - 204: Deleted successfully
 * - 404: Resource not found
 *
 * No body
 */
export type DeleteResourceResponse = void;

// ============================================
// GET /content
// ============================================

/**
 * GET /content response
 *
 * Returns binary archive (tar.gz)
 *
 * Headers:
 * - Content-Type: application/octet-stream
 */
export type GetContentResponse = ArrayBuffer;

// ============================================
// POST /content
// ============================================

/**
 * POST /content response
 *
 * - 201: Uploaded successfully
 * - 404: Resource manifest not found
 *
 * No body (or optional confirmation)
 */
export interface PostContentResponse {
  /** Resource locator */
  locator: string;
}

// ============================================
// GET /search
// ============================================

/**
 * Search result item
 */
export interface SearchResultItem {
  /** Full resource locator */
  locator: string;

  /** Resource domain */
  domain: string;

  /** Resource path (optional) */
  path?: string;

  /** Resource name */
  name: string;

  /** Resource type */
  type: string;

  /** Resource version */
  version: string;
}

/**
 * GET /search response
 */
export interface SearchResponse {
  /** Search results */
  results: SearchResultItem[];

  /** Total count (for pagination) */
  total: number;
}

// ============================================
// Error Response
// ============================================

/**
 * Error response format
 *
 * Returned for 4xx/5xx status codes
 */
export interface ErrorResponse {
  /** Error message */
  error: string;

  /** Error code (for programmatic handling) */
  code?: string;
}
