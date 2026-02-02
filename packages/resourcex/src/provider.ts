/**
 * Provider management for ResourceX.
 *
 * Platforms inject their provider implementation via setProvider().
 * createResourceX() and createResourceXServer() use the registered provider.
 */

import type { ResourceXProvider } from "@resourcexjs/core";

let globalProvider: ResourceXProvider | null = null;

/**
 * Set the global ResourceX provider.
 *
 * This should be called once at application startup, typically by
 * importing a platform-specific entry point like 'resourcexjs/node'.
 *
 * @example
 * ```typescript
 * import { setProvider } from 'resourcexjs';
 * import { NodeProvider } from 'resourcexjs/providers/node';
 *
 * setProvider(new NodeProvider());
 * ```
 */
export function setProvider(provider: ResourceXProvider): void {
  globalProvider = provider;
}

/**
 * Get the current global provider.
 *
 * @throws Error if no provider has been set.
 */
export function getProvider(): ResourceXProvider {
  if (!globalProvider) {
    throw new Error(
      "No ResourceX provider configured. " +
        'Import a platform entry point (e.g., "resourcexjs/node") or call setProvider() first.'
    );
  }
  return globalProvider;
}

/**
 * Check if a provider has been set.
 */
export function hasProvider(): boolean {
  return globalProvider !== null;
}

/**
 * Clear the provider (for testing).
 */
export function clearProvider(): void {
  globalProvider = null;
}
