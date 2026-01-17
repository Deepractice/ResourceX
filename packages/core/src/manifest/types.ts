/**
 * RXM - ResourceX Manifest
 */
export interface RXM {
  readonly domain: string;
  readonly path?: string;
  readonly name: string;
  readonly type: string;
  readonly version: string;
  toLocator(): string;
  toJSON(): ManifestData;
}

export interface ManifestData {
  domain?: string;
  path?: string;
  name?: string;
  type?: string;
  version?: string;
}
