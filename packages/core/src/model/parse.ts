import { normalize } from "node:path";
import { LocatorError } from "~/errors.js";
import type { RXI } from "./rxi.js";

const MAX_LOCATOR_LENGTH = 256;
const DANGEROUS_PATTERNS = /[;|&$`\n\0\r]/;

/**
 * Validate locator security (防止路徑遍歷、注入攻擊)
 */
function validateLocatorSecurity(locator: string): void {
  if (locator.length > MAX_LOCATOR_LENGTH) {
    throw new LocatorError("Locator too long", locator);
  }

  // Check for absolute paths
  if (locator.startsWith("/") || locator.startsWith("\\")) {
    throw new LocatorError("Absolute paths not allowed", locator);
  }

  const normalized = locator.normalize("NFC");
  let decoded: string;
  try {
    decoded = decodeURIComponent(normalized);
  } catch {
    decoded = normalized;
  }

  // Extract the part before the last colon (which is the tag separator)
  // We need to check the name/path part, not the tag
  const lastColonIndex = decoded.lastIndexOf(":");
  const namePathPart = lastColonIndex !== -1 ? decoded.substring(0, lastColonIndex) : decoded;

  // Check for .. in the name/path part
  if (namePathPart.includes("..")) {
    throw new LocatorError("Path traversal detected", locator);
  }

  // Check for path traversal after normalization
  const pathNormalized = normalize(decoded);
  if (
    pathNormalized.startsWith("..") ||
    pathNormalized.includes("/..") ||
    pathNormalized.includes("\\..") ||
    pathNormalized.startsWith("/") ||
    pathNormalized.startsWith("\\")
  ) {
    throw new LocatorError("Path traversal detected", locator);
  }

  if (DANGEROUS_PATTERNS.test(decoded)) {
    throw new LocatorError("Invalid characters detected", locator);
  }
}

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
 * Parse locator string to RXI.
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
 * @returns RXI object
 * @throws LocatorError if parsing fails
 */
export function parse(locator: string): RXI {
  if (!locator || typeof locator !== "string") {
    throw new LocatorError("Locator must be a non-empty string", locator);
  }

  // ✅ Security validation
  validateLocatorSecurity(locator);

  // Extract digest if present (Docker-style: name[:tag]@digest)
  let digest: string | undefined;
  let locatorWithoutDigest = locator;
  const atIndex = locator.indexOf("@");
  if (atIndex !== -1) {
    if (atIndex === 0) {
      throw new LocatorError("Invalid locator format. Name is required before @", locator);
    }
    digest = locator.substring(atIndex + 1);
    locatorWithoutDigest = locator.substring(0, atIndex);
    if (!digest || digest.includes("@")) {
      throw new LocatorError("Invalid digest format after @", locator);
    }
  }

  // Split by last colon to extract tag (but be careful with registry port)
  // Strategy: find the name:tag part first, which is after the last /
  const lastSlashIndex = locatorWithoutDigest.lastIndexOf("/");
  let beforeSlash = "";
  let afterSlash = locatorWithoutDigest;

  if (lastSlashIndex !== -1) {
    beforeSlash = locatorWithoutDigest.substring(0, lastSlashIndex);
    afterSlash = locatorWithoutDigest.substring(lastSlashIndex + 1);
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
      digest,
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
      digest,
    };
  }

  // No registry, everything before last slash is path
  return {
    registry: undefined,
    path: beforeSlash,
    name,
    tag,
    digest,
  };
}
