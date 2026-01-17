import type { RXL } from "~/locator/types.js";
import type { RXM } from "~/manifest/types.js";
import type { RXC } from "~/content/types.js";

/**
 * RXR (ResourceX Resource) - Complete resource object.
 * A pure data transfer object combining locator, manifest, and content.
 */
export interface RXR {
  locator: RXL;
  manifest: RXM;
  content: RXC;
}
