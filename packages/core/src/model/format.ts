import type { RXL } from "./rxl.js";

/**
 * Format RXL to locator string.
 *
 * Docker-style format: [registry/][path/]name[:tag]
 *
 * Examples:
 * - { name: "hello", tag: "latest" } → "hello" (omit :latest)
 * - { name: "hello", tag: "1.0.0" } → "hello:1.0.0"
 * - { registry: "localhost:3098", name: "hello", tag: "1.0.0" } → "localhost:3098/hello:1.0.0"
 *
 * @param rxl - Resource locator
 * @returns Locator string
 */
export function format(rxl: RXL): string {
  let result = "";

  // Add registry if present
  if (rxl.registry) {
    result += rxl.registry + "/";
  }

  // Add path if present
  if (rxl.path) {
    result += rxl.path + "/";
  }

  // Add name
  result += rxl.name;

  // Add tag (omit if "latest" for cleaner output)
  if (rxl.tag && rxl.tag !== "latest") {
    result += ":" + rxl.tag;
  }

  return result;
}
