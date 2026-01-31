/**
 * resourcexjs - AI Resource Management Protocol
 *
 * ResourceX is like npm for AI resources (prompts, tools, agents, etc.)
 *
 * @example
 * ```typescript
 * import { createResourceX, parse, manifest } from "resourcexjs";
 *
 * const rx = createResourceX();
 *
 * // Link for development
 * await rx.link("./my-prompt");
 *
 * // Resolve and execute
 * const resource = await rx.resolve("localhost/my-prompt.text@1.0.0");
 * const result = await resource.execute();
 * ```
 *
 * For low-level ARP protocol access:
 * ```typescript
 * import { createARP } from "resourcexjs/arp";
 * ```
 *
 * @packageDocumentation
 */

// ============================================
// Errors
// ============================================
export {
  ResourceXError,
  LocatorError,
  ManifestError,
  ContentError,
  DefinitionError,
} from "@resourcexjs/core";

export { ResourceTypeError } from "@resourcexjs/type";
export { RegistryError } from "@resourcexjs/registry";

// ============================================
// Types
// ============================================
export type { RXD, RXL, RXM, RXA, RXR } from "@resourcexjs/core";

// ============================================
// Primitives
// ============================================
export {
  define,
  manifest,
  archive,
  locate,
  resource,
  extract,
  format,
  parse,
  wrap,
} from "@resourcexjs/core";

// ============================================
// Resource Type System
// ============================================
export type {
  ResourceType,
  ResourceResolver,
  ResolvedResource,
  JSONSchema,
  BundledType,
  IsolatorType,
} from "@resourcexjs/type";

export { TypeHandlerChain, bundleResourceType } from "@resourcexjs/type";

// Built-in types
export { textType, jsonType, binaryType, builtinTypes } from "@resourcexjs/type";

// ============================================
// Storage Layer
// ============================================
export type { Storage } from "@resourcexjs/storage";
export { StorageError, FileSystemStorage, MemoryStorage } from "@resourcexjs/storage";

// ============================================
// Registry Layer
// ============================================
export type { Registry, SearchOptions } from "@resourcexjs/registry";
export { HostedRegistry, MirrorRegistry, LinkedRegistry } from "@resourcexjs/registry";

// Discovery
export { discoverRegistry } from "@resourcexjs/registry";
export type { DiscoveryResult, WellKnownResponse } from "@resourcexjs/registry";

// Middleware
export { RegistryMiddleware, DomainValidation, withDomainValidation } from "@resourcexjs/registry";

// ============================================
// Resource Loading
// ============================================
export type { ResourceLoader } from "@resourcexjs/loader";
export { loadResource, FolderLoader } from "@resourcexjs/loader";
export type { LoadResourceConfig } from "@resourcexjs/loader";

// ============================================
// ResourceX API
// ============================================
export { createResourceX } from "./ResourceX.js";
export type { ResourceX, ResourceXConfig } from "./ResourceX.js";

// ============================================
// Version
// ============================================
declare const __VERSION__: string | undefined;
export const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";
