/**
 * RXC - ResourceX Content
 *
 * Represents resource content as a stream.
 */
export interface RXC {
  /** Content as a readable stream */
  readonly stream: ReadableStream<Uint8Array>;

  /** Read content as text */
  text(): Promise<string>;

  /** Read content as Buffer */
  buffer(): Promise<Buffer>;

  /** Read content as JSON */
  json<T>(): Promise<T>;
}
