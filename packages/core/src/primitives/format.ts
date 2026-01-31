import type { RXL } from "~/types/index.js";

/**
 * Format RXL to locator string.
 *
 * Two formats:
 * - Local:  name.type@version (no domain)
 * - Remote: domain/[path/]name.type@version (with domain)
 *
 * @param rxl - Resource locator
 * @returns Locator string
 */
export function format(rxl: RXL): string {
  let result = "";

  // Add domain if present
  if (rxl.domain) {
    result += rxl.domain + "/";
    if (rxl.path) {
      result += rxl.path + "/";
    }
  }

  result += rxl.name;
  result += "." + rxl.type;
  result += "@" + rxl.version;
  return result;
}
