import type { RXL } from "~/types/index.js";
import { LocatorError } from "~/errors.js";

/**
 * Check if a string looks like a registry (contains port or is a domain).
 * Used to distinguish registry from path.
 */
function looksLikeRegistry(str: string): boolean {
  // Contains port (e.g., localhost:3098)
  if (str.includes(":") && !str.includes("/")) {
    return true;
  }
  // Contains dot (e.g., registry.example.com)
  if (str.includes(".")) {
    return true;
  }
  // localhost without port
  if (str === "localhost") {
    return true;
  }
  return false;
}

/**
 * Parse locator string to RXL.
 *
 * Docker-style format: [registry/][path/]name[:tag]
 *
 * Examples:
 * - hello                    → name=hello, tag=latest
 * - hello:1.0.0             → name=hello, tag=1.0.0
 * - prompts/hello:stable    → path=prompts, name=hello, tag=stable
 * - localhost:3098/hello:1.0.0 → registry=localhost:3098, name=hello, tag=1.0.0
 *
 * @param locator - Locator string
 * @returns RXL object
 * @throws LocatorError if parsing fails
 */
export function parse(locator: string): RXL {
  if (!locator || typeof locator !== "string") {
    throw new LocatorError("Locator must be a non-empty string", locator);
  }

  // Validate no invalid characters
  if (locator.includes("@")) {
    throw new LocatorError("Invalid locator format. Use name:tag instead of name@version", locator);
  }

  // Split by last colon to extract tag (but be careful with registry port)
  // Strategy: find the name:tag part first, which is after the last /
  const lastSlashIndex = locator.lastIndexOf("/");
  let beforeSlash = "";
  let afterSlash = locator;

  if (lastSlashIndex !== -1) {
    beforeSlash = locator.substring(0, lastSlashIndex);
    afterSlash = locator.substring(lastSlashIndex + 1);
  }

  // Parse name:tag from afterSlash
  const colonIndex = afterSlash.lastIndexOf(":");
  let name: string;
  let tag: string;

  if (colonIndex === -1) {
    // No tag specified, default to "latest"
    name = afterSlash;
    tag = "latest";
  } else {
    name = afterSlash.substring(0, colonIndex);
    tag = afterSlash.substring(colonIndex + 1);
  }

  if (!name) {
    throw new LocatorError("Name is required", locator);
  }

  if (!tag) {
    throw new LocatorError(
      "Tag cannot be empty. Use name:tag format or omit tag for :latest",
      locator
    );
  }

  // If no slash, it's a simple local locator
  if (lastSlashIndex === -1) {
    return {
      registry: undefined,
      path: undefined,
      name,
      tag,
    };
  }

  // Parse registry and path from beforeSlash
  const parts = beforeSlash.split("/");

  // Check if first part looks like a registry
  if (looksLikeRegistry(parts[0])) {
    const registry = parts[0];
    const path = parts.length > 1 ? parts.slice(1).join("/") : undefined;
    return {
      registry,
      path,
      name,
      tag,
    };
  }

  // No registry, everything before last slash is path
  return {
    registry: undefined,
    path: beforeSlash,
    name,
    tag,
  };
}
