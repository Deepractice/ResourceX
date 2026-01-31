/**
 * RXL - ResourceX Locator
 *
 * Unique identifier for a resource (pure data object).
 *
 * Two formats:
 * - Local:  name.type@version (no domain)
 * - Remote: domain/[path/]name.type@version (with domain)
 */
export interface RXL {
  readonly domain?: string;
  readonly path?: string;
  readonly name: string;
  readonly type: string;
  readonly version: string;
}
