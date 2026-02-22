import type { RXI } from "./rxi.js";
import type { RXM } from "./rxm.js";

/**
 * Create RXI from RXM.
 *
 * @param rxm - Resource manifest
 * @returns RXI identifier object (pure data)
 */
export function locate(rxm: RXM): RXI {
  return {
    registry: rxm.definition.registry,
    path: rxm.definition.path,
    name: rxm.definition.name,
    tag: rxm.definition.tag,
  };
}
