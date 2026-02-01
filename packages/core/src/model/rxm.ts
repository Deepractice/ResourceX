/**
 * RXM - ResourceX Manifest
 *
 * Resource metadata stored within the resource (pure data object).
 */
export interface RXM {
  readonly registry?: string;
  readonly path?: string;
  readonly name: string;
  readonly type: string;
  readonly tag: string; // Defaults to "latest" if not specified in RXD
  readonly files?: string[]; // Package file structure
}
