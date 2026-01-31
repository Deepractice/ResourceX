import type { RXL } from "~/types/index.js";
import { LocatorError } from "~/errors.js";

/**
 * Parse locator string to RXL.
 *
 * Format: domain/[path/]name.type@version
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

  // Split by / to get domain, path, name
  const parts = beforeType.split("/");

  if (parts.length < 2) {
    throw new LocatorError("locator must contain domain", locator);
  }

  const domain = parts[0];
  const name = parts[parts.length - 1];
  const path = parts.length > 2 ? parts.slice(1, -1).join("/") : undefined;

  if (!domain) {
    throw new LocatorError("domain is required", locator);
  }

  if (!name) {
    throw new LocatorError("name is required", locator);
  }

  return {
    domain,
    path,
    name,
    type,
    version,
  };
}
