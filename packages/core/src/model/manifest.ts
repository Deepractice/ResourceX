import type { RXD } from "./rxd.js";
import type { RXM } from "./rxm.js";

/**
 * Create RXM from RXD.
 * Maps RXD fields into the structured RXM format.
 *
 * @param rxd - Resource definition
 * @returns RXM manifest object
 */
export function manifest(rxd: RXD): RXM {
  return {
    definition: {
      name: rxd.name,
      type: rxd.type,
      tag: rxd.tag ?? "latest",
      registry: rxd.registry,
      path: rxd.path,
      description: rxd.description,
      author: rxd.author,
      license: rxd.license,
      keywords: rxd.keywords,
      repository: rxd.repository,
    },
    archive: {},
    source: {},
  };
}
