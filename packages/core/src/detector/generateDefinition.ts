import type { RXD } from "~/model/index.js";
import { define } from "~/model/index.js";
import type { TypeDetectionResult } from "./types.js";

/**
 * Generate an RXD from a TypeDetectionResult.
 *
 * Maps detection result fields to the RXD schema and validates
 * through the existing define() function.
 *
 * @param result - Detection result from TypeDetectorChain
 * @returns Validated RXD
 * @throws DefinitionError if the result produces invalid RXD
 */
export function generateDefinition(result: TypeDetectionResult): RXD {
  const input: Record<string, unknown> = {
    name: result.name,
    type: result.type,
  };

  if (result.tag !== undefined) input.tag = result.tag;
  if (result.description !== undefined) input.description = result.description;
  if (result.registry !== undefined) input.registry = result.registry;
  if (result.path !== undefined) input.path = result.path;
  if (result.author !== undefined) input.author = result.author;
  if (result.license !== undefined) input.license = result.license;
  if (result.keywords !== undefined) input.keywords = result.keywords;
  if (result.repository !== undefined) input.repository = result.repository;

  return define(input);
}
