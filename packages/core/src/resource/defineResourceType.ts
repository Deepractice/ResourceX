import type { ResourceType } from "./types.js";
import { ResourceTypeError } from "~/errors.js";

// Registry of resource types
const resourceTypes = new Map<string, ResourceType>();

/**
 * Define and register a resource type.
 *
 * @throws ResourceTypeError if type is already registered
 */
export function defineResourceType<T>(config: ResourceType<T>): ResourceType<T> {
  if (resourceTypes.has(config.name)) {
    throw new ResourceTypeError(`Resource type "${config.name}" is already registered`);
  }
  resourceTypes.set(config.name, config as ResourceType);
  return config;
}

/**
 * Get a registered resource type by name.
 *
 * @returns ResourceType or undefined if not found
 */
export function getResourceType<T = unknown>(name: string): ResourceType<T> | undefined {
  return resourceTypes.get(name) as ResourceType<T> | undefined;
}

/**
 * Clear all registered resource types (for testing).
 */
export function clearResourceTypes(): void {
  resourceTypes.clear();
}
