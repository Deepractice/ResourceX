import type { RXL } from "~/types/index.js";
import { LocatorError } from "~/errors.js";

/**
 * Parse locator string to RXL.
 *
 * Two formats supported:
 * - Local:  name.type@version (no registry)
 * - Remote: registry/[path/]name.type@version (with registry)
 *
 * @param locator - Locator string
 * @returns RXL object
 * @throws LocatorError if parsing fails
 */
export function parse(locator: string): RXL {
  if (!locator || typeof locator !== "string") {
    throw new LocatorError("locator must be a non-empty string", locator);
  }

  // Split by @ to get version
  const atIndex = locator.lastIndexOf("@");
  if (atIndex === -1) {
    throw new LocatorError("locator must contain version (@)", locator);
  }

  const version = locator.slice(atIndex + 1);
  const beforeVersion = locator.slice(0, atIndex);

  if (!version) {
    throw new LocatorError("version is required", locator);
  }

  // Split by . to get type (last dot before @)
  const dotIndex = beforeVersion.lastIndexOf(".");
  if (dotIndex === -1) {
    throw new LocatorError("locator must contain type (.)", locator);
  }

  const type = beforeVersion.slice(dotIndex + 1);
  const beforeType = beforeVersion.slice(0, dotIndex);

  if (!type) {
    throw new LocatorError("type is required", locator);
  }

  // Split by / to get registry, path, name
  const parts = beforeType.split("/");

  // Check if has registry (contains /)
  if (parts.length === 1) {
    // Local format: name.type@version (no registry)
    const name = parts[0];
    if (!name) {
      throw new LocatorError("name is required", locator);
    }
    return {
      registry: undefined,
      path: undefined,
      name,
      type,
      version,
    };
  }

  // Remote format: registry/[path/]name.type@version
  const registry = parts[0];
  const name = parts[parts.length - 1];
  const path = parts.length > 2 ? parts.slice(1, -1).join("/") : undefined;

  if (!registry) {
    throw new LocatorError("registry is required", locator);
  }

  if (!name) {
    throw new LocatorError("name is required", locator);
  }

  return {
    registry,
    path,
    name,
    type,
    version,
  };
}
