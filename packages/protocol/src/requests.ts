/**
 * Registry HTTP API Request Types
 */

/* global Blob */

// ============================================
// Manifest (shared between request/response)
// ============================================

/**
 * Resource manifest data
 */
export interface ManifestData {
  /**
   * Resource domain (e.g., "deepractice.dev")
   * Defaults to "localhost" if not specified
   */
  domain?: string;

  /**
   * Resource path within domain (e.g., "prompts/chat")
   */
  path?: string;

  /**
   * Resource name (required)
   */
  name: string;

  /**
   * Resource type (e.g., "prompt", "tool", "agent")
   */
  type: string;

  /**
   * Semantic version (e.g., "1.0.0")
   */
  version: string;

  /**
   * Optional description
   */
  description?: string;

  /**
   * Optional readme content (markdown)
   */
  readme?: string;
}

// ============================================
// GET /resource
// ============================================

/**
 * GET /resource query parameters
 */
export interface GetResourceRequest {
  /**
   * Resource locator (e.g., "deepractice.dev/assistant.prompt@1.0.0")
   */
  locator: string;
}

// ============================================
// GET /content
// ============================================

/**
 * GET /content query parameters
 */
export interface GetContentRequest {
  /**
   * Resource locator
   */
  locator: string;
}

// ============================================
// POST /publish
// ============================================

/**
 * POST /publish request body (multipart/form-data)
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append("manifest", JSON.stringify(manifest));
 * formData.append("archive", archiveBlob, "archive.tar.gz");
 * ```
 */
export interface PublishRequest {
  /**
   * Resource manifest (JSON string in form data)
   */
  manifest: ManifestData;

  /**
   * Resource archive (tar.gz file)
   */
  archive: Blob | ArrayBuffer;
}

/**
 * Form field names for publish request
 */
export const PUBLISH_FORM_FIELDS = {
  manifest: "manifest",
  archive: "archive",
} as const;

// ============================================
// GET /search
// ============================================

/**
 * GET /search query parameters
 */
export interface SearchRequest {
  /**
   * Search query (matches locator, name, description)
   */
  q?: string;

  /**
   * Filter by resource type
   */
  type?: string;

  /**
   * Filter by domain
   */
  domain?: string;

  /**
   * Maximum results to return (default: 100)
   */
  limit?: number;

  /**
   * Offset for pagination (default: 0)
   */
  offset?: number;
}

// ============================================
// DELETE /resource
// ============================================

/**
 * DELETE /resource query parameters
 */
export interface DeleteResourceRequest {
  /**
   * Resource locator
   */
  locator: string;
}

// ============================================
// POST /resolve (Phase 3)
// ============================================

/**
 * POST /resolve request body
 */
export interface ResolveRequest {
  /**
   * Resource locator
   */
  locator: string;

  /**
   * Arguments to pass to resolver
   */
  args?: unknown;
}
