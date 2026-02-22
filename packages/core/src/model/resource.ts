import { locate } from "./locate.js";
import type { RXA } from "./rxa.js";
import type { RXM } from "./rxm.js";
import type { RXR } from "./rxr.js";

/**
 * Create RXR from RXM and RXA.
 *
 * @param rxm - Resource manifest
 * @param rxa - Resource archive
 * @returns RXR resource object
 */
export function resource(rxm: RXM, rxa: RXA): RXR {
  const rxi = locate(rxm);

  return {
    identifier: rxi,
    manifest: rxm,
    archive: rxa,
  };
}
