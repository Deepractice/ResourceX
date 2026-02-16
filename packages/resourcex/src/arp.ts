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
  type ARI,
  type ARL,
  ARP,
  type ARPConfig,
  ARPError,
  type BinaryInput,
  type BinaryResource,
  BinarySemanticHandler,
  binarySemantic,
  createARP,
  FileTransportHandler,
  fileTransport,
  HttpTransportHandler,
  httpsTransport,
  httpTransport,
  ParseError,
  type Resource,
  type ResourceMeta,
  type SemanticContext,
  SemanticError,
  type SemanticHandler,
  type TextResource,
  TextSemanticHandler,
  TransportError,
  type TransportHandler,
  type TransportParams,
  type TransportResult,
  textSemantic,
  VERSION,
} from "@resourcexjs/arp";
