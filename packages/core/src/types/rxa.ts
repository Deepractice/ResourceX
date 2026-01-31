/**
 * RXA - ResourceX Archive
 *
 * Archive container (tar.gz format) for storage and transfer.
 */
export interface RXA {
  /** Content as a readable stream (tar.gz format) */
  readonly stream: ReadableStream<Uint8Array>;

  /** Get raw archive buffer (tar.gz format) */
  buffer(): Promise<Buffer>;
}
