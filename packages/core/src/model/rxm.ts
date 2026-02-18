/**
 * RXM - ResourceX Manifest
 *
 * Resource context representation organized by RX primitives.
 * Structure: definition (RXD) + archive (RXA) + source (RXS)
 */

/**
 * RXM Definition — what the resource IS.
 * Sourced from RXD (resource.json).
 */
export interface RXMDefinition {
  readonly name: string;
  readonly type: string;
  readonly tag: string; // Defaults to "latest" if not specified in RXD
  readonly registry?: string;
  readonly path?: string;
  readonly description?: string;
  readonly author?: string;
  readonly license?: string;
  readonly keywords?: string[];
  readonly repository?: string;
}

/**
 * RXM Archive — packaging metadata.
 * Placeholder for future fields (digest, size, md5, etc.)
 */
// biome-ignore lint/complexity/noBannedTypes: intentional empty placeholder for future fields (digest, size, md5)
export type RXMArchive = {};

/**
 * File entry with metadata.
 */
export interface FileEntry {
  readonly size: number;
}

/**
 * Recursive file tree structure.
 * Keys ending with '/' are directories containing nested FileTree.
 * Other keys are files with FileEntry metadata.
 */
export type FileTree = {
  readonly [key: string]: FileEntry | FileTree;
};

/**
 * RXM Source — what's IN the resource.
 * File structure and content preview.
 */
export interface RXMSource {
  readonly files?: FileTree;
  readonly preview?: string;
}

export interface RXM {
  readonly definition: RXMDefinition;
  readonly archive: RXMArchive;
  readonly source: RXMSource;
}
