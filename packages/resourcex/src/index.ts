/**
 * resourcexjs - AI Resource Management Protocol
 *
 * ResourceX is like npm for AI resources (prompts, tools, agents, etc.)
 *
 * @example
 * ```typescript
 * import { parseRXL, createRXM, createRegistry } from "resourcexjs";
 *
 * const rxl = parseRXL("deepractice.ai/sean/assistant.prompt@1.0.0");
 * const rxm = createRXM({ domain: "deepractice.ai", name: "assistant", type: "prompt", version: "1.0.0" });
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
  ResourceTypeError,
} from "@resourcexjs/core";

export { RegistryError } from "@resourcexjs/registry";

// ============================================
// RXL - ResourceX Locator
// ============================================
export type { RXL } from "@resourcexjs/core";
export { parseRXL } from "@resourcexjs/core";

// ============================================
// RXM - ResourceX Manifest
// ============================================
export type { RXM, ManifestData } from "@resourcexjs/core";
export { createRXM } from "@resourcexjs/core";

// ============================================
// RXC - ResourceX Content
// ============================================
export type { RXC } from "@resourcexjs/core";
export { createRXC, loadRXC } from "@resourcexjs/core";

// ============================================
// RXR - ResourceX Resource
// ============================================
export type { RXR, ResourceType, ResourceSerializer, ResourceResolver } from "@resourcexjs/core";

// ============================================
// Resource Type System
// ============================================
export { defineResourceType, getResourceType, clearResourceTypes } from "@resourcexjs/core";
export { textType, jsonType, binaryType, builtinTypes } from "@resourcexjs/core";
export { TypeHandlerChain, createTypeHandlerChain } from "@resourcexjs/core";

// ============================================
// Registry
// ============================================
export type { Registry, RegistryConfig } from "@resourcexjs/registry";
export { createRegistry, ARPRegistry } from "@resourcexjs/registry";

// ============================================
// Version
// ============================================
declare const __VERSION__: string | undefined;
export const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";
