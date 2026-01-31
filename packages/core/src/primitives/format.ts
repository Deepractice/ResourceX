import type { RXL } from "~/types/index.js";

/**
 * Format RXL to locator string.
 *
 * Two formats:
 * - Local:  name.type@version (no registry)
 * - Remote: registry/[path/]name.type@version (with registry)
 *
 * @param rxl - Resource locator
 * @returns Locator string
 */
export function format(rxl: RXL): string {
  let result = "";

  // Add registry if present
  if (rxl.registry) {
    result += rxl.registry + "/";
    if (rxl.path) {
      result += rxl.path + "/";
    }
  }

  result += rxl.name;
  result += "." + rxl.type;
  result += "@" + rxl.version;
  return result;
}
