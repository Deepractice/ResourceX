/**
 * resourcexjs - AI Resource Management Protocol
 *
 * ResourceX is like npm for AI resources (prompts, tools, agents, etc.)
 *
 * @example
 * ```typescript
 * import { createResourceX } from "resourcexjs";
 *
 * const rx = createResourceX({
 *   domain: "mycompany.com",
 *   registry: "https://registry.mycompany.com"
 * });
 *
 * // Add from directory
 * await rx.add("./my-prompt");
 *
 * // Resolve and execute
 * const result = await rx.resolve("my-prompt.text@1.0.0");
 * await result.execute();
 *
 * // Publish to registry
 * await rx.publish("./my-prompt");
 * ```
 *
 * @packageDocumentation
 */

// ============================================
// Main API
// ============================================
export { createResourceX } from "./ResourceX.js";
export type { ResourceX, ResourceXConfig, Resource, Executable } from "./ResourceX.js";

// ============================================
// Provider API
// ============================================
export { setProvider, getProvider, hasProvider, clearProvider } from "./provider.js";
export type { ResourceXProvider, ProviderConfig, ProviderStores } from "@resourcexjs/core";

// ============================================
// Core Primitives
// ============================================
export { parse, format, manifest, archive, resource, extract, wrap } from "@resourcexjs/core";
export type { RXL, RXM, RXA, RXR, RXD } from "@resourcexjs/core";

// ============================================
// Errors
// ============================================
export { RegistryError, ResourceTypeError } from "@resourcexjs/core";

// ============================================
// Extension - Custom Types
// ============================================
export type { BundledType, IsolatorType } from "@resourcexjs/core";
export { bundleResourceType } from "@resourcexjs/core";

// ============================================
// Version
// ============================================
declare const __VERSION__: string | undefined;
export const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";
