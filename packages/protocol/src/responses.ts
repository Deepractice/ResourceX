/**
 * Registry HTTP API Response Types
 */

import type { ManifestData } from "./requests.js";

// ============================================
// GET /resource
// ============================================

/**
 * GET /resource response
 */
export interface GetResourceResponse extends ManifestData {
  /**
   * Full resource locator
   */
  locator: string;

  /**
   * Download count
   */
  downloads?: number;

  /**
   * Creation timestamp (ISO 8601)
   */
  createdAt?: string;

  /**
   * Last update timestamp (ISO 8601)
   */
  updatedAt?: string;
}

// ============================================
// GET /content
// ============================================

/**
 * GET /content response
 *
 * Returns binary tar.gz stream with headers:
 * - Content-Type: application/gzip
 * - Content-Disposition: attachment; filename="archive.tar.gz"
 */
export type GetContentResponse = ReadableStream<Uint8Array> | ArrayBuffer;

// ============================================
// POST /publish
// ============================================

/**
 * POST /publish response
 */
export interface PublishResponse {
  /**
   * Published resource locator
   */
  locator: string;

  /**
   * Whether this is a new version of existing resource
   */
  isNewVersion?: boolean;
}

// ============================================
// GET /search
// ============================================

/**
 * Search result item
 */
export interface SearchResultItem {
  /**
   * Resource locator
   */
  locator: string;

  /**
   * Resource domain
   */
  domain: string;

  /**
   * Resource path
   */
  path?: string;

  /**
   * Resource name
   */
  name: string;

  /**
   * Resource type
   */
  type: string;

  /**
   * Resource version
   */
  version: string;

  /**
   * Resource description
   */
  description?: string;

  /**
   * Download count
   */
  downloads?: number;
}

/**
 * GET /search response
 */
export interface SearchResponse {
  /**
   * Search results
   */
  results: SearchResultItem[];

  /**
   * Total count (for pagination)
   */
  total?: number;
}

// ============================================
// HEAD /resource
// ============================================

/**
 * HEAD /resource response
 *
 * Returns 200 if exists, 404 if not
 * No body, just status code
 */
export type HeadResourceResponse = void;

// ============================================
// DELETE /resource
// ============================================

/**
 * DELETE /resource response
 *
 * Returns 204 No Content on success
 */
export type DeleteResourceResponse = void;

// ============================================
// POST /resolve (Phase 3)
// ============================================

/**
 * POST /resolve response
 */
export interface ResolveResponse<TResult = unknown> {
  /**
   * Execution result
   */
  result: TResult;

  /**
   * Execution metadata
   */
  meta?: {
    /**
     * Execution time in milliseconds
     */
    executionTimeMs?: number;

    /**
     * Resource locator that was resolved
     */
    locator?: string;
  };
}

// ============================================
// Error Response
// ============================================

/**
 * Error response format
 */
export interface ErrorResponse {
  /**
   * Error message
   */
  error: string;

  /**
   * Error code (for programmatic handling)
   */
  code?: string;

  /**
   * Additional error details
   */
  details?: Record<string, unknown>;
}
