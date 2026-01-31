/**
 * RXL - ResourceX Locator
 *
 * Unique identifier for a resource (pure data object).
 * Format: domain/[path/]name.type@version
 */
export interface RXL {
  readonly domain: string;
  readonly path?: string;
  readonly name: string;
  readonly type: string;
  readonly version: string;
}
