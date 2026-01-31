/**
 * @resourcexjs/protocol
 *
 * ResourceX Registry HTTP API Protocol
 *
 * Defines the contract between ResourceX client and registry server.
 *
 * ## Endpoints
 *
 * - `POST /publish` - Publish a resource (multipart form data)
 * - `GET /resource/{locator}` - Get manifest
 * - `HEAD /resource/{locator}` - Check existence
 * - `DELETE /resource/{locator}` - Delete resource
 * - `GET /content/{locator}` - Get content (archive)
 * - `GET /search?q=xxx` - Search resources
 *
 * @example
 * ```typescript
 * import { buildPublishUrl, buildResourceUrl, PUBLISH_FIELDS } from "@resourcexjs/protocol";
 *
 * // Publish a resource
 * const publishUrl = buildPublishUrl("https://registry.example.com");
 * const formData = new FormData();
 * formData.append(PUBLISH_FIELDS.locator, "hello.text@1.0.0");
 * formData.append(PUBLISH_FIELDS.manifest, manifestBlob);
 * formData.append(PUBLISH_FIELDS.content, contentBlob);
 * await fetch(publishUrl, { method: "POST", body: formData });
 *
 * // Get manifest
 * const resourceUrl = buildResourceUrl("https://registry.example.com", "hello.text@1.0.0");
 * const manifest = await fetch(resourceUrl).then(r => r.json());
 * ```
 *
 * @packageDocumentation
 */

// Endpoints
export {
  API_VERSION,
  ENDPOINTS,
  METHODS,
  CONTENT_TYPES,
  buildResourceUrl,
  buildContentUrl,
  buildPublishUrl,
  buildSearchUrl,
} from "./endpoints.js";

// Request types
export type {
  ManifestData,
  PublishFormFields,
  GetResourceParams,
  HeadResourceParams,
  DeleteResourceParams,
  GetContentParams,
  SearchQuery,
} from "./requests.js";
export { PUBLISH_FIELDS } from "./requests.js";

// Response types
export type {
  PublishResponse,
  GetResourceResponse,
  HeadResourceResponse,
  DeleteResourceResponse,
  GetContentResponse,
  SearchResultItem,
  SearchResponse,
  ErrorResponse,
} from "./responses.js";

// Error codes
export { ERROR_CODES, ERROR_STATUS, getStatusCode, type ErrorCode } from "./errors.js";

// Version
declare const __VERSION__: string | undefined;
export const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";
