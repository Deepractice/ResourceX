import { packTar } from "modern-tar";
import type { RXA } from "./rxa.js";

/**
 * Compress data using Web API CompressionStream (gzip).
 */
async function gzipCompress(data: Uint8Array): Promise<Buffer> {
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return Buffer.from(result);
}

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
  const gzipBuffer = await gzipCompress(new Uint8Array(tarBuffer));

  return new RXAImpl(gzipBuffer);
}
