/**
 * @resourcexjs/core
 *
 * ResourceX Core - Resource primitives, types, type system, loader, and registry
 */

// Detector
export type { TypeDetectionResult, TypeDetector } from "~/detector/index.js";
export {
  generateDefinition,
  ResourceJsonDetector,
  SkillDetector,
  TypeDetectorChain,
} from "~/detector/index.js";
// Errors
export {
  ContentError,
  DefinitionError,
  LocatorError,
  ManifestError,
  ResourceXError,
} from "~/errors.js";
// Loader (merged from @resourcexjs/loader)
export type {
  LoadResourceConfig,
  ResolveSourceConfig,
  ResourceLoader,
  SourceLoader,
} from "~/loader/index.js";
export {
  FolderLoader,
  FolderSourceLoader,
  GitHubSourceLoader,
  loadResource,
  resolveSource,
  SourceLoaderChain,
} from "~/loader/index.js";
// Model (Types + Primitives)
export type {
  FileEntry,
  FileTree,
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
} from "~/model/index.js";
export {
  archive,
  define,
  extract,
  format,
  locate,
  manifest,
  parse,
  resource,
  wrap,
} from "~/model/index.js";
// Provider SPI
export type {
  ProviderConfig,
  ProviderDefaults,
  ProviderStores,
  RegistryEntry,
  ResourceXProvider,
} from "~/provider/index.js";
// Registry (merged from @resourcexjs/registry)
export type {
  DiscoveryResult,
  Registry,
  // Store SPI interfaces
  RXAStore,
  RXMSearchOptions,
  RXMStore,
  SearchOptions,
  StoredRXM,
  WellKnownResponse,
} from "~/registry/index.js";
export {
  // CAS Registry (primary)
  CASRegistry,
  // Store utilities
  computeDigest,
  DomainValidation,
  // Discovery & middleware
  discoverRegistry,
  isValidDigest,
  LinkedRegistry,
  // Memory implementations (for testing)
  MemoryRXAStore,
  MemoryRXMStore,
  RegistryError,
  RegistryMiddleware,
  withDomainValidation,
} from "~/registry/index.js";
// Type System (merged from @resourcexjs/type)
export type {
  BundledType,
  IsolatorType,
  JSONSchema,
  JSONSchemaProperty,
  ResolveContext,
  ResolvedResource,
  ResourceResolver,
  ResourceType,
} from "~/type/index.js";
export {
  binaryType,
  builtinTypes,
  bundleResourceType,
  jsonType,
  ResourceTypeError,
  TypeHandlerChain,
  textType,
} from "~/type/index.js";
