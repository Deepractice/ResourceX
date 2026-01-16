/**
 * Resource Registry
 */

import { ParseError } from "../errors.js";
import { getSemanticHandler } from "../semantic/index.js";
import { getTransportHandler } from "../transport/index.js";
import type { ResourceDefinition } from "./types.js";

/**
 * Create a new resource registry (isolated instance)
 */
export function createResourceRegistry() {
  const registry = new Map<string, ResourceDefinition>();

  return {
    /**
     * Register a resource definition
     */
    register(definition: ResourceDefinition): void {
      // Validate name format
      if (!/^[a-z][a-z0-9-]*$/.test(definition.name)) {
        throw new ParseError(
          `Invalid resource name: "${definition.name}". Must start with lowercase letter and contain only lowercase letters, numbers, and hyphens.`,
          definition.name
        );
      }

      // Validate semantic exists
      getSemanticHandler(definition.semantic);

      // Validate transport exists
      getTransportHandler(definition.transport);

      registry.set(definition.name, definition);
    },

    /**
     * Get a resource definition by name
     */
    get(name: string): ResourceDefinition | undefined {
      return registry.get(name);
    },

    /**
     * Check if a resource is registered
     */
    has(name: string): boolean {
      return registry.has(name);
    },

    /**
     * Clear all registered resources
     */
    clear(): void {
      registry.clear();
    },
  };
}

export type ResourceRegistry = ReturnType<typeof createResourceRegistry>;
