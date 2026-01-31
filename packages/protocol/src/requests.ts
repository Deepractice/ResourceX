/**
 * ResourceX Registry HTTP API - Request Types
 */

// ============================================
// Manifest Data
// ============================================

/**
 * Resource manifest data
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
// POST /publish
// ============================================

/**
 * POST /publish - Publish a resource
 *
 * Multipart form data fields:
 * - locator: Resource locator string
 * - manifest: JSON blob with ManifestData
 * - content: Binary blob with archive content
 */
export interface PublishFormFields {
  /** Resource locator string */
  locator: string;

  /** Manifest data (JSON) */
  manifest: ManifestData;

  /** Archive content (binary) */
  content: ArrayBuffer | Uint8Array;
}

/**
 * Form field names for publish request
 */
export const PUBLISH_FIELDS = {
  locator: "locator",
  manifest: "manifest",
  content: "content",
} as const;

// ============================================
// GET /resource/{locator}
// ============================================

/**
 * GET /resource/{locator}
 *
 * Path parameter: locator (URL encoded)
 */
export interface GetResourceParams {
  /** Resource locator (URL encoded in path) */
  locator: string;
}

// ============================================
// HEAD /resource/{locator}
// ============================================

/**
 * HEAD /resource/{locator}
 *
 * Path parameter: locator (URL encoded)
 */
export type HeadResourceParams = GetResourceParams;

// ============================================
// DELETE /resource/{locator}
// ============================================

/**
 * DELETE /resource/{locator}
 *
 * Path parameter: locator (URL encoded)
 */
export type DeleteResourceParams = GetResourceParams;

// ============================================
// GET /content/{locator}
// ============================================

/**
 * GET /content/{locator}
 *
 * Path parameter: locator (URL encoded)
 */
export interface GetContentParams {
  /** Resource locator (URL encoded in path) */
  locator: string;
}

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
}
