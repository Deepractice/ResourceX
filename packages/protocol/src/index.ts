/**
 * @resourcexjs/protocol
 *
 * ResourceX Registry HTTP API Protocol
 *
 * Defines the contract between ResourceX client and registry server.
 *
 * @example
 * ```typescript
 * import { ENDPOINTS, buildUrl, type PostResourceBody } from "@resourcexjs/protocol";
 *
 * // Build URL
 * const url = buildUrl("https://registry.example.com", "resource", { locator: "hello.text@1.0.0" });
 *
 * // POST /resource
 * const body: PostResourceBody = {
 *   manifest: { domain: "example.com", name: "hello", type: "text", version: "1.0.0" }
 * };
 * await fetch(url, { method: "POST", body: JSON.stringify(body) });
 * ```
 *
 * @packageDocumentation
 */

// Endpoints
export { API_VERSION, ENDPOINTS, METHODS, CONTENT_TYPES, buildUrl } from "./endpoints.js";

// Request types
export type {
  ManifestData,
  GetResourceQuery,
  PostResourceBody,
  HeadResourceQuery,
  DeleteResourceQuery,
  GetContentQuery,
  PostContentQuery,
  PostContentBody,
  SearchQuery,
} from "./requests.js";

// Response types
export type {
  GetResourceResponse,
  PostResourceResponse,
  HeadResourceResponse,
  DeleteResourceResponse,
  GetContentResponse,
  PostContentResponse,
  SearchResultItem,
  SearchResponse,
  ErrorResponse,
} from "./responses.js";

// Error codes
export { ERROR_CODES, ERROR_STATUS, getStatusCode, type ErrorCode } from "./errors.js";

// Version
declare const __VERSION__: string | undefined;
export const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";
