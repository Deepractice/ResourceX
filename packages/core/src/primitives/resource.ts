import type { RXM, RXA, RXR } from "~/types/index.js";
import { locate } from "./locate.js";

/**
 * Create RXR from RXM and RXA.
 *
 * @param rxm - Resource manifest
 * @param rxa - Resource archive
 * @returns RXR resource object
 */
export function resource(rxm: RXM, rxa: RXA): RXR {
  const rxl = locate(rxm);

  return {
    locator: rxl,
    manifest: rxm,
    archive: rxa,
  };
}
