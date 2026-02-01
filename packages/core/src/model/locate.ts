import type { RXM } from "./rxm.js";
import type { RXL } from "./rxl.js";

/**
 * Create RXL from RXM.
 *
 * @param rxm - Resource manifest
 * @returns RXL locator object (pure data)
 */
export function locate(rxm: RXM): RXL {
  return {
    registry: rxm.registry,
    path: rxm.path,
    name: rxm.name,
    tag: rxm.tag,
  };
}
