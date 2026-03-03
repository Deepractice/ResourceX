import { unpackTar } from "modern-tar";
import type { RXA } from "./rxa.js";

/**
 * Decompress gzip data using Web API DecompressionStream.
 */
async function gzipDecompress(data: Uint8Array): Promise<Buffer> {
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  writer.write(data);
  writer.close();
  const reader = ds.readable.getReader();
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
 * Extract files from RXA.
 *
 * @param rxa - Resource archive
 * @returns Record of file paths to Buffer contents
 */
export async function extract(rxa: RXA): Promise<Record<string, Buffer>> {
  const buffer = await rxa.buffer();

  // Decompress gzip
  const tarBuffer = await gzipDecompress(new Uint8Array(buffer));

  // Unpack tar
  const entries = await unpackTar(tarBuffer);

  const files: Record<string, Buffer> = {};
  for (const entry of entries) {
    if ((entry.header.type === "file" || entry.header.type === undefined) && entry.data) {
      files[entry.header.name] = Buffer.from(entry.data);
    }
  }

  return files;
}
