/**
 * @resourcexjs/core
 * ARP (Agent Resource Protocol) implementation
 */

declare const __VERSION__: string;
export const VERSION: string = __VERSION__;

// Errors
export { ResourceXError, ParseError, TransportError, SemanticError } from "./errors.js";

// Parser
export { parseARP, type ParsedARP } from "./parser.js";

// Transport
export {
  type TransportHandler,
  getTransportHandler,
  registerTransportHandler,
  httpsHandler,
  httpHandler,
  fileHandler,
} from "./transport/index.js";

// Semantic
export {
  type Resource,
  type SemanticHandler,
  type ResourceMeta,
  type ParseContext,
  type TextResource,
  getSemanticHandler,
  registerSemanticHandler,
  textHandler,
} from "./semantic/index.js";

// Resolve
export { resolve } from "./resolve.js";
