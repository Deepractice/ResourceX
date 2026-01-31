import type { RXM, RXL } from "~/types/index.js";

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
    type: rxm.type,
    version: rxm.version,
  };
}
