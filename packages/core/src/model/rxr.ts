import type { RXA } from "./rxa.js";
import type { RXI } from "./rxi.js";
import type { RXM } from "./rxm.js";

/**
 * RXR - ResourceX Resource
 *
 * Complete resource object combining identifier, manifest, and archive.
 */
export interface RXR {
  readonly identifier: RXI;
  readonly manifest: RXM;
  readonly archive: RXA;
}
