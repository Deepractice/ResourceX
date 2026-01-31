/**
 * RXM - ResourceX Manifest
 *
 * Resource metadata stored within the resource (pure data object).
 */
export interface RXM {
  readonly domain: string;
  readonly path?: string;
  readonly name: string;
  readonly type: string;
  readonly version: string;
  readonly files?: string[]; // Package file structure
}
