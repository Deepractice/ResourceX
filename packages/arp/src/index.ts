/**
 * arpjs - Agent Resource Protocol
 *
 * A URL protocol for AI agents to access resources
 * Format: arp:{semantic}:{transport}://{location}
 */

declare const __VERSION__: string | undefined;
export const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";

// Core types
export type { ARI, ARL } from "./types.js";

// ARP factory and class
export { ARP, createARP, type ARPConfig } from "./ARP.js";

// Errors
export { ARPError, ParseError, TransportError, SemanticError } from "./errors.js";

// Transport
export {
  type TransportHandler,
  type TransportResult,
  type TransportParams,
  FileTransportHandler,
  fileTransport,
  HttpTransportHandler,
  httpsTransport,
  httpTransport,
  RxrTransport,
  type RxrTransportRegistry,
} from "./transport/index.js";

// Semantic
export {
  type Resource,
  type SemanticHandler,
  type ResourceMeta,
  type SemanticContext,
  type TextResource,
  type BinaryResource,
  type BinaryInput,
  TextSemanticHandler,
  textSemantic,
  BinarySemanticHandler,
  binarySemantic,
} from "./semantic/index.js";
