import type { RXD, RXM } from "~/types/index.js";

/**
 * Create RXM from RXD.
 * Extracts only the core metadata fields (pure data object).
 *
 * @param rxd - Resource definition
 * @returns RXM manifest object
 */
export function manifest(rxd: RXD): RXM {
  return {
    domain: rxd.domain,
    path: rxd.path,
    name: rxd.name,
    type: rxd.type,
    version: rxd.version,
  };
}
