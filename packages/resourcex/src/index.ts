/**
 * resourcexjs - AI Resource Management Protocol
 *
 * ResourceX is like npm for AI resources (prompts, tools, agents, etc.)
 *
 * @example
 * ```typescript
 * import { parse, manifest, createRegistry } from "resourcexjs";
 *
 * const rxl = parse("deepractice.ai/sean/assistant.prompt@1.0.0");
 * const rxm = manifest({ domain: "deepractice.ai", name: "assistant", type: "prompt", version: "1.0.0" });
 * const registry = createRegistry();
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
// Resource Loading
// ============================================
export type { ResourceLoader } from "@resourcexjs/loader";
export { loadResource, FolderLoader } from "@resourcexjs/loader";
export type { LoadResourceConfig } from "@resourcexjs/loader";

// ============================================
// Registry
// ============================================
export type {
  Registry,
  RegistryConfig,
  ClientRegistryConfig,
  ServerRegistryConfig,
  CreateRegistryConfig,
  DiscoveryResult,
  WellKnownResponse,
  Storage,
  SearchOptions,
} from "@resourcexjs/registry";
export {
  DefaultRegistry,
  createRegistry,
  discoverRegistry,
  LocalStorage,
} from "@resourcexjs/registry";

// ============================================
// Registry Middleware
// ============================================
export { RegistryMiddleware, DomainValidation, withDomainValidation } from "@resourcexjs/registry";

// ============================================
// Version
// ============================================
declare const __VERSION__: string | undefined;
export const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";
