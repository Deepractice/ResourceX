/**
 * RXC - ResourceX Content
 *
 * Archive-based content container using tar.gz format internally.
 * Provides unified file access API for both single and multi-file resources.
 */
export interface RXC {
  /** Content as a readable stream (tar.gz format) */
  readonly stream: ReadableStream<Uint8Array>;

  /** Get raw archive buffer (tar.gz format) */
  buffer(): Promise<Buffer>;

  /** Read a specific file from the archive */
  file(path: string): Promise<Buffer>;

  /** Read all files from the archive */
  files(): Promise<Map<string, Buffer>>;
}

/**
 * Input type for createRXC.
 * - Files record: { 'path/to/file': content }
 * - Archive: { archive: tarGzBuffer }
 */
export type RXCInput = Record<string, Buffer | Uint8Array | string> | { archive: Buffer };
