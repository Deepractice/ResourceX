import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { packTar } from "modern-tar";
import type { RXA } from "~/types/index.js";

const gzipAsync = promisify(gzip);

/**
 * RXA Implementation for primitives
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
 * Create RXA from files.
 *
 * @param files - Record of file paths to Buffer contents
 * @returns RXA archive object
 */
export async function archive(files: Record<string, Buffer>): Promise<RXA> {
  const entries = Object.entries(files).map(([name, content]) => {
    return {
      header: { name, size: content.length, type: "file" as const },
      body: new Uint8Array(content),
    };
  });

  // Pack to tar
  const tarBuffer = await packTar(entries);

  // Compress with gzip
  const gzipBuffer = await gzipAsync(Buffer.from(tarBuffer));

  return new RXAImpl(gzipBuffer);
}
