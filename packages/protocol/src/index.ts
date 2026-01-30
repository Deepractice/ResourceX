/**
 * @resourcexjs/protocol
 *
 * ResourceX HTTP API Protocol - Schema definitions for Registry API
 *
 * This package defines the contract between:
 * - Client SDK (registry.publish, registry.pull)
 * - Server HTTP API (/publish, /resource, /content, /search)
 *
 * @packageDocumentation
 */

// ============================================
// Endpoints
// ============================================
export * from "./endpoints.js";

// ============================================
// Request Types
// ============================================
export * from "./requests.js";

// ============================================
// Response Types
// ============================================
export * from "./responses.js";

// ============================================
// Error Codes
// ============================================
export * from "./errors.js";

// ============================================
// Version
// ============================================
declare const __VERSION__: string | undefined;
export const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";
