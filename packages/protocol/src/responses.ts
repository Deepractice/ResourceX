/**
 * ResourceX Registry HTTP API - Response Types
 */

import type { ManifestData } from "./requests.js";

// ============================================
// POST /publish
// ============================================

/**
 * POST /publish response
 */
export interface PublishResponse {
  /** Published resource locator */
  locator: string;
}

// ============================================
// GET /resource/{locator}
// ============================================

/**
 * GET /resource/{locator} response
 *
 * Returns manifest data
 */
export type GetResourceResponse = ManifestData;

// ============================================
// HEAD /resource/{locator}
// ============================================

/**
 * HEAD /resource/{locator} response
 *
 * - 200: Resource exists
 * - 404: Resource not found
 *
 * No body
 */
export type HeadResourceResponse = void;

// ============================================
// DELETE /resource/{locator}
// ============================================

/**
 * DELETE /resource/{locator} response
 *
 * - 204: Deleted successfully
 * - 404: Resource not found
 *
 * No body
 */
export type DeleteResourceResponse = void;

// ============================================
// GET /content/{locator}
// ============================================

/**
 * GET /content/{locator} response
 *
 * Returns binary archive
 *
 * Headers:
 * - Content-Type: application/octet-stream
 */
export type GetContentResponse = ArrayBuffer;

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
