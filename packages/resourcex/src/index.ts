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
// Source Loading & Detection
// ============================================
// ============================================
// Extension - Custom Types
// ============================================
export type {
  BundledType,
  FileEntry,
  FileTree,
  IsolatorType,
  ProviderConfig,
  ProviderStores,
  RegistryEntry,
  ResolveSourceConfig,
  ResourceXProvider,
  RXA,
  RXD,
  RXI,
  RXL,
  RXM,
  RXMArchive,
  RXMDefinition,
  RXMSource,
  RXR,
  RXS,
  SourceLoader,
  TypeDetectionResult,
  TypeDetector,
} from "@resourcexjs/core";
// ============================================
// Core Primitives
// ============================================
// ============================================
// Errors
// ============================================
export {
  archive,
  bundleResourceType,
  extract,
  FolderSourceLoader,
  format,
  GitHubSourceLoader,
  generateDefinition,
  manifest,
  parse,
  RegistryError,
  ResourceJsonDetector,
  ResourceTypeError,
  resolveSource,
  resource,
  SkillDetector,
  SourceLoaderChain,
  TypeDetectorChain,
  wrap,
} from "@resourcexjs/core";
// ============================================
// Provider API
// ============================================
export { clearProvider, getProvider, hasProvider, setProvider } from "./provider.js";
export type { RegistryOptions, Resource, ResourceX, ResourceXConfig } from "./ResourceX.js";
// ============================================
// Main API
// ============================================
export { createResourceX } from "./ResourceX.js";

// ============================================
// Version
// ============================================
declare const __VERSION__: string | undefined;
export const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";
