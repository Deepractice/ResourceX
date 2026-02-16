/**
 * arpjs - Agent Resource Protocol
 *
 * A URL protocol for AI agents to access resources
 * Format: arp:{semantic}:{transport}://{location}
 */

declare const __VERSION__: string | undefined;
export const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";

// ARP factory and class
export { ARP, type ARPConfig, createARP } from "./ARP.js";
// Errors
export { ARPError, ParseError, SemanticError, TransportError } from "./errors.js";
// Semantic
export {
  type BinaryInput,
  type BinaryResource,
  BinarySemanticHandler,
  binarySemantic,
  type Resource,
  type ResourceMeta,
  type SemanticContext,
  type SemanticHandler,
  type TextResource,
  TextSemanticHandler,
  textSemantic,
} from "./semantic/index.js";

// Transport (standard protocols only; for RXR transport use resourcexjs)
export {
  FileTransportHandler,
  fileTransport,
  HttpTransportHandler,
  httpsTransport,
  httpTransport,
  type ListOptions,
  type TransportHandler,
  type TransportParams,
  type TransportResult,
} from "./transport/index.js";
// Core types
export type { ARI, ARL } from "./types.js";
