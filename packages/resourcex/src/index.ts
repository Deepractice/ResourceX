/**
 * resourcexjs - AI Resource Management Protocol
 *
 * ResourceX is like npm for AI resources (prompts, tools, agents, etc.)
 *
 * @example
 * ```typescript
 * import { createResourceX, setProvider } from "resourcexjs";
 * import { NodeProvider } from "@resourcexjs/node-provider";
 *
 * // Configure provider before creating client
 * setProvider(new NodeProvider());
 *
 * const rx = createResourceX({
 *   registry: "https://registry.mycompany.com"
 * });
 *
 * // Add from directory
 * await rx.add("./my-prompt");
 *
 * // Ingest and execute (from any source)
 * const result = await rx.ingest("my-prompt:1.0.0");
 * await result.execute();
 *
 * // Or resolve directly from locator
 * const result2 = await rx.resolve("my-prompt:1.0.0");
 * await result2.execute();
 *
 * // Push to registry
 * await rx.push("my-prompt:1.0.0");
 * ```
 *
 * @packageDocumentation
 */

// ============================================
// Main API
// ============================================
export { createResourceX } from "./ResourceX.js";
export type { ResourceX, ResourceXConfig, Resource } from "./ResourceX.js";

// ============================================
// Provider API
// ============================================
export { setProvider, getProvider, hasProvider, clearProvider } from "./provider.js";
export type { ResourceXProvider, ProviderConfig, ProviderStores } from "@resourcexjs/core";

// ============================================
// Core Primitives
// ============================================
export { parse, format, manifest, archive, resource, extract, wrap } from "@resourcexjs/core";
export type { RXL, RXM, RXA, RXR, RXD, RXS } from "@resourcexjs/core";

// ============================================
// Source Loading & Detection
// ============================================
export type {
  SourceLoader,
  ResolveSourceConfig,
  TypeDetector,
  TypeDetectionResult,
} from "@resourcexjs/core";
export {
  FolderSourceLoader,
  GitHubSourceLoader,
  SourceLoaderChain,
  resolveSource,
  TypeDetectorChain,
  ResourceJsonDetector,
  SkillDetector,
  generateDefinition,
} from "@resourcexjs/core";

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
