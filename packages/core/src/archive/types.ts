/**
 * PathNode - Tree structure node for package file hierarchy.
 */
export interface PathNode {
  /** File or directory name */
  name: string;
  /** Node type */
  type: "file" | "directory";
  /** Children nodes (only for directories) */
  children?: PathNode[];
}

/**
 * RXA - ResourceX Archive
 *
 * Archive container (tar.gz format) for storage and transfer.
 * Use extract() to get RXP for file access.
 */
export interface RXA {
  /** Content as a readable stream (tar.gz format) */
  readonly stream: ReadableStream<Uint8Array>;

  /** Get raw archive buffer (tar.gz format) */
  buffer(): Promise<Buffer>;

  /** Extract archive to package for file access */
  extract(): Promise<RXP>;
}

/**
 * RXP - ResourceX Package
 *
 * Extracted package for runtime file access.
 * Created from RXA.extract(), can pack back with pack().
 */
export interface RXP {
  /** Get flat list of all file paths */
  paths(): string[];

  /** Get tree structure of files and directories */
  tree(): PathNode[];

  /** Read a specific file from the package */
  file(path: string): Promise<Buffer>;

  /** Read all files from the package */
  files(): Promise<Map<string, Buffer>>;

  /** Pack back to archive */
  pack(): Promise<RXA>;
}

/**
 * Input type for createRXA.
 * - Files record: { 'path/to/file': content }
 * - Buffer: { buffer: tarGzBuffer }
 */
export type RXAInput = Record<string, Buffer | Uint8Array | string> | { buffer: Buffer };
