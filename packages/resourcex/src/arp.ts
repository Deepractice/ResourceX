/**
 * ARP (Agent Resource Protocol) - Low-level protocol
 *
 * Re-exported from @resourcexjs/arp for convenience.
 * Use this when you need direct access to the underlying ARP protocol.
 *
 * @example
 * ```typescript
 * import { createARP, fileTransport, textSemantic } from "resourcexjs/arp";
 *
 * const arp = createARP({
 *   transports: [fileTransport],
 *   semantics: [textSemantic],
 * });
 *
 * const arl = arp.parse("arp:text:file:///path/to/file.txt");
 * const resource = await arl.resolve();
 * ```
 */

export * from "@resourcexjs/arp";
