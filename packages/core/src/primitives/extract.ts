import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import { unpackTar } from "modern-tar";
import type { RXA } from "~/types/index.js";

const gunzipAsync = promisify(gunzip);

/**
 * Extract files from RXA.
 *
 * @param rxa - Resource archive
 * @returns Record of file paths to Buffer contents
 */
export async function extract(rxa: RXA): Promise<Record<string, Buffer>> {
  const buffer = await rxa.buffer();

  // Decompress gzip
  const tarBuffer = await gunzipAsync(buffer);

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
