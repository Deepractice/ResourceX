/**
 * ARP (Agent Resource Protocol) - Re-exported from @resourcexjs/arp
 *
 * @example
 * ```typescript
 * import { createARP } from "resourcexjs/arp";
 *
 * const arp = createARP();
 * const arl = arp.parse("arp:text:file:///path/to/file.txt");
 * const resource = await arl.resolve();
 * ```
 *
 * For more details, see @resourcexjs/arp documentation.
 */

// Re-export everything from @resourcexjs/arp
export {
  ARP,
  createARP,
  type ARPConfig,
  VERSION,
  ARPError,
  ParseError,
  TransportError,
  SemanticError,
  type TransportHandler,
  type TransportResult,
  type TransportParams,
  FileTransportHandler,
  fileTransport,
  HttpTransportHandler,
  httpsTransport,
  httpTransport,
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
  type ARI,
  type ARL,
} from "@resourcexjs/arp";
