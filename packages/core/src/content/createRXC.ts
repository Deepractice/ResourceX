import type { RXC } from "./types.js";
import { ContentError } from "~/errors.js";

class RXCImpl implements RXC {
  private _stream: ReadableStream<Uint8Array>;
  private _consumed = false;

  constructor(stream: ReadableStream<Uint8Array>) {
    this._stream = stream;
  }

  get stream(): ReadableStream<Uint8Array> {
    if (this._consumed) {
      throw new ContentError("Content has already been consumed");
    }
    this._consumed = true;
    return this._stream;
  }

  async text(): Promise<string> {
    const buffer = await this.buffer();
    return buffer.toString("utf-8");
  }

  async buffer(): Promise<Buffer> {
    if (this._consumed) {
      throw new ContentError("Content has already been consumed");
    }
    this._consumed = true;

    const reader = this._stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  }

  async json<T>(): Promise<T> {
    const text = await this.text();
    return JSON.parse(text) as T;
  }
}

/**
 * Create RXC from string, Buffer, or ReadableStream.
 */
export function createRXC(data: string | Buffer | ReadableStream<Uint8Array>): RXC {
  let stream: ReadableStream<Uint8Array>;

  if (typeof data === "string") {
    const encoded = new TextEncoder().encode(data);
    stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoded);
        controller.close();
      },
    });
  } else if (Buffer.isBuffer(data)) {
    stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(data));
        controller.close();
      },
    });
  } else {
    // Already a ReadableStream
    stream = data;
  }

  return new RXCImpl(stream);
}
