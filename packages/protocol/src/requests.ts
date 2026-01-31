/**
 * ResourceX Registry HTTP API - Request Types
 */

// ============================================
// Manifest Data
// ============================================

/**
 * Resource manifest data (shared between request/response)
 */
export interface ManifestData {
  /** Resource domain (e.g., "mycompany.com") */
  domain: string;

  /** Resource path within domain (optional) */
  path?: string;

  /** Resource name */
  name: string;

  /** Resource type (e.g., "text", "json", "prompt") */
  type: string;

  /** Semantic version (e.g., "1.0.0") */
  version: string;
}

// ============================================
// GET /resource
// ============================================

/**
 * GET /resource?locator=xxx
 *
 * Query parameters
 */
export interface GetResourceQuery {
  /** Resource locator (e.g., "mycompany.com/hello.text@1.0.0") */
  locator: string;
}

// ============================================
// POST /resource
// ============================================

/**
 * POST /resource
 *
 * Request body (JSON)
 */
export interface PostResourceBody {
  /** Resource manifest */
  manifest: ManifestData;
}

// ============================================
// HEAD /resource
// ============================================

/**
 * HEAD /resource?locator=xxx
 *
 * Query parameters (same as GET)
 */
export type HeadResourceQuery = GetResourceQuery;

// ============================================
// DELETE /resource
// ============================================

/**
 * DELETE /resource?locator=xxx
 *
 * Query parameters
 */
export type DeleteResourceQuery = GetResourceQuery;

// ============================================
// GET /content
// ============================================

/**
 * GET /content?locator=xxx
 *
 * Query parameters
 */
export interface GetContentQuery {
  /** Resource locator */
  locator: string;
}

// ============================================
// POST /content
// ============================================

/**
 * POST /content?locator=xxx
 *
 * Query parameters
 */
export interface PostContentQuery {
  /** Resource locator */
  locator: string;
}

/**
 * POST /content
 *
 * Request body: Binary (application/octet-stream)
 * The archive buffer (tar.gz)
 */
export type PostContentBody = ArrayBuffer | Uint8Array;

// ============================================
// GET /search
// ============================================

/**
 * GET /search
 *
 * Query parameters
 */
export interface SearchQuery {
  /** Search query string (optional) */
  q?: string;

  /** Maximum results (default: 100) */
  limit?: number;

  /** Offset for pagination (default: 0) */
  offset?: number;

  /** Filter by type */
  type?: string;

  /** Filter by domain */
  domain?: string;
}
