/**
 * Factory function for creating ResourceX instances
 */

import { ResourceX, type ResourceXConfig } from "./ResourceX.js";

/**
 * Create a new ResourceX instance
 *
 * @example
 * ```typescript
 * import { createResourceX } from "resourcexjs";
 *
 * const rx = createResourceX();
 * const resource = await rx.resolve("arp:text:https://example.com/file.txt");
 * ```
 *
 * @example
 * ```typescript
 * // With custom config
 * const rx = createResourceX({
 *   timeout: 5000,
 *   transports: [myCustomTransport],
 *   semantics: [myCustomSemantic],
 * });
 * ```
 */
export function createResourceX(config?: ResourceXConfig): ResourceX {
  return new ResourceX(config);
}
