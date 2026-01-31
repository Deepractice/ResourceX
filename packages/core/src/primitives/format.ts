import type { RXL } from "~/types/index.js";

/**
 * Format RXL to locator string.
 *
 * Format: domain/[path/]name.type@version
 *
 * @param rxl - Resource locator
 * @returns Locator string
 */
export function format(rxl: RXL): string {
  let result = rxl.domain + "/";
  if (rxl.path) {
    result += rxl.path + "/";
  }
  result += rxl.name;
  result += "." + rxl.type;
  result += "@" + rxl.version;
  return result;
}
