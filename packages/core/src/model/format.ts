import type { RXI } from "./rxi.js";

/**
 * Format RXI to locator string.
 *
 * Docker-style format: [registry/][path/]name[:tag]
 *
 * Examples:
 * - { name: "hello", tag: "latest" } → "hello" (omit :latest)
 * - { name: "hello", tag: "1.0.0" } → "hello:1.0.0"
 * - { registry: "localhost:3098", name: "hello", tag: "1.0.0" } → "localhost:3098/hello:1.0.0"
 *
 * @param rxi - Resource identifier
 * @returns Locator string
 */
export function format(rxi: RXI): string {
  let result = "";

  // Add registry if present
  if (rxi.registry) {
    result += `${rxi.registry}/`;
  }

  // Add path if present
  if (rxi.path) {
    result += `${rxi.path}/`;
  }

  // Add name
  result += rxi.name;

  // Add tag (omit if "latest" for cleaner output)
  if (rxi.tag && rxi.tag !== "latest") {
    result += `:${rxi.tag}`;
  }

  return result;
}
