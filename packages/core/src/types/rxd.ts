/**
 * RXD - ResourceX Definition
 *
 * The content of resource.json file.
 * Contains all metadata for a resource in development.
 */
export interface RXD {
  // Core fields (required)
  readonly name: string;
  readonly type: string;
  readonly version: string;

  // Core fields (optional, with defaults)
  readonly domain: string; // defaults to "localhost"
  readonly path?: string;

  // Extended fields (optional)
  readonly description?: string;
  readonly author?: string;
  readonly license?: string;
  readonly keywords?: string[];
  readonly repository?: string;

  // Allow additional fields
  readonly [key: string]: unknown;
}
