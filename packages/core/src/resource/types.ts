import type { RXL } from "~/locator/types.js";
import type { RXM } from "~/manifest/types.js";
import type { RXA } from "~/archive/types.js";

/**
 * RXR (ResourceX Resource) - Complete resource object.
 * A pure data transfer object combining locator, manifest, and archive.
 */
export interface RXR {
  locator: RXL;
  manifest: RXM;
  archive: RXA;
}
