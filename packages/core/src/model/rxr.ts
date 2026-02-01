import type { RXL } from "./rxl.js";
import type { RXM } from "./rxm.js";
import type { RXA } from "./rxa.js";

/**
 * RXR - ResourceX Resource
 *
 * Complete resource object combining locator, manifest, and archive.
 */
export interface RXR {
  readonly locator: RXL;
  readonly manifest: RXM;
  readonly archive: RXA;
}
