import type { RXD } from "./rxd.js";
import { DefinitionError } from "~/errors.js";

/**
 * Parse and validate a resource definition (resource.json content).
 *
 * @param input - The raw JSON object to parse
 * @returns A validated RXD object
 * @throws DefinitionError if validation fails
 */
export function define(input: unknown): RXD {
  if (input === null || typeof input !== "object") {
    throw new DefinitionError("definition must be an object");
  }

  const obj = input as Record<string, unknown>;

  if (!obj.name || typeof obj.name !== "string") {
    throw new DefinitionError("name is required");
  }

  if (!obj.type || typeof obj.type !== "string") {
    throw new DefinitionError("type is required");
  }

  // tag is optional, defaults to "latest"
  // Also accept "version" as alias for backward compatibility
  const tagValue = obj.tag ?? obj.version;
  if (tagValue !== undefined && typeof tagValue !== "string") {
    throw new DefinitionError("tag must be a string");
  }

  // Build RXD with defaults
  const rxd: RXD = {
    ...obj,
    name: obj.name,
    type: obj.type,
    tag: typeof tagValue === "string" ? tagValue : undefined,
    registry: typeof obj.registry === "string" ? obj.registry : undefined,
    path: typeof obj.path === "string" ? obj.path : undefined,
    description: typeof obj.description === "string" ? obj.description : undefined,
    author: typeof obj.author === "string" ? obj.author : undefined,
    license: typeof obj.license === "string" ? obj.license : undefined,
    keywords: Array.isArray(obj.keywords) ? obj.keywords : undefined,
    repository: typeof obj.repository === "string" ? obj.repository : undefined,
  };

  return rxd;
}
