/**
 * RXL - ResourceX Locator
 *
 * Unique identifier for a resource (pure data object).
 *
 * Two formats:
 * - Local:  name.type@version (no registry)
 * - Remote: registry/[path/]name.type@version (with registry)
 */
export interface RXL {
  readonly registry?: string;
  readonly path?: string;
  readonly name: string;
  readonly type: string;
  readonly version: string;
}
