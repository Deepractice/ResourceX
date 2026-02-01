/**
 * @resourcexjs/core
 *
 * ResourceX Core - Resource primitives, types, type system, loader, and registry
 */

// Errors
export {
  ResourceXError,
  LocatorError,
  ManifestError,
  ContentError,
  DefinitionError,
} from "~/errors.js";

// Model (Types + Primitives)
export type { RXD, RXL, RXM, RXA, RXR } from "~/model/index.js";
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
} from "~/model/index.js";

// Type System (merged from @resourcexjs/type)
export type {
  ResourceType,
  ResourceResolver,
  ResolvedResource,
  ResolveContext,
  JSONSchema,
  JSONSchemaProperty,
  BundledType,
  IsolatorType,
} from "~/type/index.js";

export {
  bundleResourceType,
  ResourceTypeError,
  TypeHandlerChain,
  textType,
  jsonType,
  binaryType,
  builtinTypes,
} from "~/type/index.js";

// Loader (merged from @resourcexjs/loader)
export type { ResourceLoader, LoadResourceConfig } from "~/loader/index.js";
export { FolderLoader, loadResource } from "~/loader/index.js";

// Registry (merged from @resourcexjs/registry)
export type {
  Registry,
  SearchOptions,
  RegistryAccessor,
  RemoteFetcher,
  WellKnownResponse,
  DiscoveryResult,
  // Store SPI interfaces
  RXAStore,
  RXMStore,
  StoredRXM,
  RXMSearchOptions,
} from "~/registry/index.js";

export {
  // CAS Registry (primary)
  CASRegistry,
  LinkedRegistry,
  // Store utilities
  computeDigest,
  isValidDigest,
  // Memory implementations (for testing)
  MemoryRXAStore,
  MemoryRXMStore,
  // Legacy registries (to be removed)
  LocalRegistry,
  MirrorRegistry,
  // Access chain
  RegistryAccessChain,
  LinkedAccessor,
  LocalAccessor,
  CacheAccessor,
  RemoteAccessor,
  // Discovery & middleware
  discoverRegistry,
  RegistryError,
  RegistryMiddleware,
  DomainValidation,
  withDomainValidation,
} from "~/registry/index.js";
