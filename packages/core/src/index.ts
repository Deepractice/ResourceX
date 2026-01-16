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
  type TransportCapabilities,
  type ResourceStat,
  type DeepracticeConfig,
  getTransportHandler,
  registerTransportHandler,
  httpsHandler,
  httpHandler,
  fileHandler,
  deepracticeHandler,
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
  getSemanticHandler,
  registerSemanticHandler,
  textHandler,
  binaryHandler,
} from "./semantic/index.js";

// Resource Operations
export { resolve, deposit, resourceExists, resourceDelete } from "./resolve.js";

// Resource Definition
export {
  type ResourceDefinition,
  type ResourceRegistry,
  createResourceRegistry,
} from "./resource/index.js";
