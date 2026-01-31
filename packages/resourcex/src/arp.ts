/**
 * ARP (Agent Resource Protocol) - Enhanced for ResourceX
 *
 * This module provides an enhanced version of ARP that includes the RXR transport
 * for accessing files inside ResourceX resources.
 *
 * @example
 * ```typescript
 * import { createARP } from "resourcexjs/arp";
 *
 * // createARP() automatically includes rxr transport
 * const arp = createARP();
 *
 * // Access a file inside a resource
 * const arl = arp.parse("arp:text:rxr://localhost/my-prompt.text@1.0.0/content");
 * const resource = await arl.resolve();
 * ```
 *
 * For the base ARP without ResourceX integration, use @resourcexjs/arp directly.
 */

import { ARP, createARP as createBaseARP, type ARPConfig } from "@resourcexjs/arp";

import { RxrTransport } from "./transport/rxr.js";

/**
 * Create an ARP instance with ResourceX integration.
 *
 * This enhanced version automatically registers the RXR transport,
 * which allows accessing files inside ResourceX resources.
 *
 * Default transports: file, http, https, rxr
 * Default semantics: text, binary
 *
 * @example
 * ```typescript
 * const arp = createARP();
 *
 * // Use rxr transport to access resource internals
 * const arl = arp.parse("arp:text:rxr://localhost/my-prompt.text@1.0.0/content");
 * const resource = await arl.resolve();
 * ```
 */
export function createARP(config?: ARPConfig): ARP {
  const arp = createBaseARP(config);

  // Only auto-register RxrTransport if not already provided in config
  const hasRxrTransport = config?.transports?.some((t) => t.name === "rxr");
  if (!hasRxrTransport) {
    arp.registerTransport(new RxrTransport());
  }

  return arp;
}

// Re-export everything from @resourcexjs/arp except createARP
export { ARP, type ARPConfig } from "@resourcexjs/arp";
export { VERSION } from "@resourcexjs/arp";
export { ARPError, ParseError, TransportError, SemanticError } from "@resourcexjs/arp";

// Transport (excluding RxrTransport which is now from local)
export {
  type TransportHandler,
  type TransportResult,
  type TransportParams,
  FileTransportHandler,
  fileTransport,
  HttpTransportHandler,
  httpsTransport,
  httpTransport,
} from "@resourcexjs/arp";

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
} from "@resourcexjs/arp";

// Types
export type { ARI, ARL } from "@resourcexjs/arp";

// RxrTransport from local (ResourceX-specific)
export { RxrTransport, clearRegistryCache } from "./transport/rxr.js";
