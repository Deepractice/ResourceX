import type { RXM, RXL } from "~/types/index.js";

/**
 * Create RXL from RXM.
 *
 * Maps manifest version to locator tag.
 *
 * @param rxm - Resource manifest
 * @returns RXL locator object (pure data)
 */
export function locate(rxm: RXM): RXL {
  return {
    registry: rxm.registry,
    path: rxm.path,
    name: rxm.name,
    tag: rxm.version, // manifest version becomes locator tag
  };
}
