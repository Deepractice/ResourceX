import { z } from "zod";
import { DefinitionError } from "~/errors.js";
import type { RXD } from "./rxd.js";

const RXDSchema = z
  .object({
    name: z.string().min(1).max(128),
    type: z.string().min(1).max(64),
    tag: z.string().max(64).optional(),
    version: z.string().max(64).optional(),
    registry: z.string().max(256).optional(),
    path: z.string().max(256).optional(),
    description: z.string().max(1024).optional(),
    author: z.string().max(128).optional(),
    license: z.string().max(64).optional(),
    keywords: z.array(z.string().max(64)).max(20).optional(),
    repository: z.string().max(256).optional(),
  })
  .strict();

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

  let validated;
  try {
    validated = RXDSchema.parse(input);
  } catch (e) {
    throw new DefinitionError(`Invalid definition: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Create object without prototype chain (防止 Prototype Pollution)
  const rxd = Object.assign(Object.create(null), {
    name: validated.name,
    type: validated.type,
    tag: validated.tag ?? validated.version ?? undefined,
    registry: validated.registry,
    path: validated.path,
    description: validated.description,
    author: validated.author,
    license: validated.license,
    keywords: validated.keywords,
    repository: validated.repository,
  }) as RXD;

  return rxd;
}
