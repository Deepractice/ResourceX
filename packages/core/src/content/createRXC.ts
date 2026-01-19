import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import { packTar, unpackTar } from "modern-tar";
import type { RXC, RXCInput } from "./types.js";
import { ContentError } from "~/errors.js";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

class RXCImpl implements RXC {
  private _buffer: Buffer;
  private _filesCache: Map<string, Buffer> | null = null;

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

  async file(path: string): Promise<Buffer> {
    const filesMap = await this.files();
    const content = filesMap.get(path);
    if (!content) {
      throw new ContentError(`file not found: ${path}`);
    }
    return content;
  }

  async files(): Promise<Map<string, Buffer>> {
    if (this._filesCache) {
      return this._filesCache;
    }

    // Decompress gzip
    const tarBuffer = await gunzipAsync(this._buffer);

    // Unpack tar
    const entries = await unpackTar(tarBuffer);

    const filesMap = new Map<string, Buffer>();
    for (const entry of entries) {
      if ((entry.header.type === "file" || entry.header.type === undefined) && entry.data) {
        filesMap.set(entry.header.name, Buffer.from(entry.data));
      }
    }

    this._filesCache = filesMap;
    return filesMap;
  }
}

/**
 * Create RXC from a record of file paths to their content.
 *
 * @example
 * ```typescript
 * // Single file
 * const content = await createRXC({ 'content': Buffer.from('Hello') });
 *
 * // Multiple files
 * const content = await createRXC({
 *   'index.ts': Buffer.from('export default 1'),
 *   'styles.css': Buffer.from('body {}'),
 * });
 *
 * // Nested directories
 * const content = await createRXC({
 *   'src/index.ts': Buffer.from('main'),
 *   'src/utils/helper.ts': Buffer.from('helper'),
 * });
 * ```
 */
/**
 * Check if input is an archive input
 */
function isArchiveInput(input: RXCInput): input is { archive: Buffer } {
  return "archive" in input && Buffer.isBuffer(input.archive);
}

export async function createRXC(input: RXCInput): Promise<RXC> {
  // If archive buffer provided, use it directly
  if (isArchiveInput(input)) {
    return new RXCImpl(input.archive);
  }

  // Otherwise, pack files into tar.gz
  const entries = Object.entries(input).map(([name, content]) => {
    const body =
      typeof content === "string"
        ? content
        : content instanceof Uint8Array
          ? content
          : new Uint8Array(content);

    const size = typeof content === "string" ? Buffer.byteLength(content) : content.length;

    return {
      header: { name, size, type: "file" as const },
      body,
    };
  });

  // Pack to tar
  const tarBuffer = await packTar(entries);

  // Compress with gzip
  const gzipBuffer = await gzipAsync(Buffer.from(tarBuffer));

  return new RXCImpl(gzipBuffer);
}
