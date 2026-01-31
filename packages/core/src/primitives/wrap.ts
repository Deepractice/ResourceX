import type { RXA } from "~/types/index.js";

/**
 * RXA Implementation for wrap
 */
class RXAImpl implements RXA {
  private readonly _buffer: Buffer;

  constructor(buffer: Buffer) {
    this._buffer = buffer;
  }

  get stream(): ReadableStream<Uint8Array> {
    const buffer = this._buffer;
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(buffer));
        controller.close();
      },
    });
  }

  async buffer(): Promise<Buffer> {
    return this._buffer;
  }
}

/**
 * Wrap existing tar.gz buffer as RXA.
 *
 * @param buffer - Existing tar.gz buffer
 * @returns RXA archive object
 */
export function wrap(buffer: Buffer): RXA {
  return new RXAImpl(buffer);
}
