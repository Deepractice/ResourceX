/**
 * Registry HTTP API Error Codes
 */

/**
 * Standard error codes for Registry API
 */
export const ERROR_CODES = {
  // ============================================
  // Validation Errors (400)
  // ============================================

  /**
   * locator query parameter is required
   */
  LOCATOR_REQUIRED: "LOCATOR_REQUIRED",

  /**
   * manifest field is required in form data
   */
  MANIFEST_REQUIRED: "MANIFEST_REQUIRED",

  /**
   * archive field is required in form data
   */
  ARCHIVE_REQUIRED: "ARCHIVE_REQUIRED",

  /**
   * Invalid manifest JSON format
   */
  INVALID_MANIFEST: "INVALID_MANIFEST",

  /**
   * Invalid locator format
   */
  INVALID_LOCATOR: "INVALID_LOCATOR",

  /**
   * Missing required manifest fields (name, type, version)
   */
  MISSING_REQUIRED_FIELDS: "MISSING_REQUIRED_FIELDS",

  /**
   * Invalid archive format (must be tar.gz)
   */
  INVALID_ARCHIVE: "INVALID_ARCHIVE",

  // ============================================
  // Authentication Errors (401)
  // ============================================

  /**
   * Authentication required
   */
  UNAUTHORIZED: "UNAUTHORIZED",

  /**
   * Invalid or expired token
   */
  INVALID_TOKEN: "INVALID_TOKEN",

  // ============================================
  // Authorization Errors (403)
  // ============================================

  /**
   * Not allowed to perform this action
   */
  FORBIDDEN: "FORBIDDEN",

  /**
   * Cannot publish to this domain
   */
  DOMAIN_FORBIDDEN: "DOMAIN_FORBIDDEN",

  // ============================================
  // Not Found Errors (404)
  // ============================================

  /**
   * Resource not found
   */
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  /**
   * Archive not found in storage
   */
  ARCHIVE_NOT_FOUND: "ARCHIVE_NOT_FOUND",

  // ============================================
  // Conflict Errors (409)
  // ============================================

  /**
   * Resource already exists
   */
  RESOURCE_EXISTS: "RESOURCE_EXISTS",

  /**
   * Version already published
   */
  VERSION_EXISTS: "VERSION_EXISTS",

  // ============================================
  // Server Errors (500)
  // ============================================

  /**
   * Internal server error
   */
  INTERNAL_ERROR: "INTERNAL_ERROR",

  /**
   * Storage error (D1/R2)
   */
  STORAGE_ERROR: "STORAGE_ERROR",
} as const;

/**
 * Error code type
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * HTTP status codes for each error code
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // 400 Bad Request
  [ERROR_CODES.LOCATOR_REQUIRED]: 400,
  [ERROR_CODES.MANIFEST_REQUIRED]: 400,
  [ERROR_CODES.ARCHIVE_REQUIRED]: 400,
  [ERROR_CODES.INVALID_MANIFEST]: 400,
  [ERROR_CODES.INVALID_LOCATOR]: 400,
  [ERROR_CODES.MISSING_REQUIRED_FIELDS]: 400,
  [ERROR_CODES.INVALID_ARCHIVE]: 400,

  // 401 Unauthorized
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.INVALID_TOKEN]: 401,

  // 403 Forbidden
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.DOMAIN_FORBIDDEN]: 403,

  // 404 Not Found
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.ARCHIVE_NOT_FOUND]: 404,

  // 409 Conflict
  [ERROR_CODES.RESOURCE_EXISTS]: 409,
  [ERROR_CODES.VERSION_EXISTS]: 409,

  // 500 Internal Server Error
  [ERROR_CODES.INTERNAL_ERROR]: 500,
  [ERROR_CODES.STORAGE_ERROR]: 500,
};

/**
 * Get HTTP status code for error code
 */
export function getErrorStatusCode(code: ErrorCode): number {
  return ERROR_STATUS_CODES[code] ?? 500;
}

/**
 * Create error response object
 */
export function createErrorResponse(
  code: ErrorCode,
  message?: string,
  details?: Record<string, unknown>
): { error: string; code: ErrorCode; details?: Record<string, unknown> } {
  return {
    error: message ?? code,
    code,
    ...(details && { details }),
  };
}
