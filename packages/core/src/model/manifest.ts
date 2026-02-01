import type { RXD } from "./rxd.js";
import type { RXM } from "./rxm.js";

/**
 * Create RXM from RXD.
 * Extracts only the core metadata fields (pure data object).
 *
 * @param rxd - Resource definition
 * @returns RXM manifest object
 */
export function manifest(rxd: RXD): RXM {
  return {
    registry: rxd.registry,
    path: rxd.path,
    name: rxd.name,
    type: rxd.type,
    tag: rxd.tag ?? "latest",
  };
}
