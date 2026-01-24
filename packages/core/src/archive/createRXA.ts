import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import { packTar, unpackTar } from "modern-tar";
import type { RXA, RXP, RXAInput, PathNode } from "./types.js";
import { ContentError } from "~/errors.js";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * RXP Implementation - Extracted package for file access.
 */
class RXPImpl implements RXP {
  private readonly _files: Map<string, Buffer>;
  private _pathsCache: string[] | null = null;
  private _treeCache: PathNode[] | null = null;

  constructor(files: Map<string, Buffer>) {
    this._files = files;
  }

  paths(): string[] {
    if (this._pathsCache) {
      return this._pathsCache;
    }
    this._pathsCache = Array.from(this._files.keys()).sort();
    return this._pathsCache;
  }

  tree(): PathNode[] {
    if (this._treeCache) {
      return this._treeCache;
    }

    // Use a nested map structure for building the tree
    interface TreeNode {
      node: PathNode;
      children: Map<string, TreeNode>;
    }

    const root = new Map<string, TreeNode>();

    for (const path of this._files.keys()) {
      const parts = path.split("/");
      let currentLevel = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;

        if (!currentLevel.has(part)) {
          const treeNode: TreeNode = {
            node: {
              name: part,
              type: isFile ? "file" : "directory",
              children: isFile ? undefined : [],
            },
            children: new Map(),
          };
          currentLevel.set(part, treeNode);
        }

        const treeNode = currentLevel.get(part)!;
        if (!isFile) {
          currentLevel = treeNode.children;
        }
      }
    }

    // Convert nested map structure to PathNode array
    const convertToPathNodes = (level: Map<string, TreeNode>): PathNode[] => {
      return Array.from(level.values()).map((treeNode) => {
        if (treeNode.node.type === "directory" && treeNode.children.size > 0) {
          treeNode.node.children = convertToPathNodes(treeNode.children);
        }
        return treeNode.node;
      });
    };

    this._treeCache = convertToPathNodes(root);
    return this._treeCache;
  }

  async file(path: string): Promise<Buffer> {
    const content = this._files.get(path);
    if (!content) {
      throw new ContentError(`file not found: ${path}`);
    }
    return content;
  }

  async files(): Promise<Map<string, Buffer>> {
    return new Map(this._files);
  }

  async pack(): Promise<RXA> {
    const filesRecord: Record<string, Buffer> = {};
    for (const [path, content] of this._files) {
      filesRecord[path] = content;
    }
    return createRXA(filesRecord);
  }
}

/**
 * RXA Implementation - Archive container.
 */
class RXAImpl implements RXA {
  private readonly _buffer: Buffer;
  private _rxpCache: RXP | null = null;

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

  async extract(): Promise<RXP> {
    if (this._rxpCache) {
      return this._rxpCache;
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

    this._rxpCache = new RXPImpl(filesMap);
    return this._rxpCache;
  }
}

/**
 * Check if input is a buffer input.
 */
function isBufferInput(input: RXAInput): input is { buffer: Buffer } {
  return "buffer" in input && Buffer.isBuffer(input.buffer);
}

/**
 * Create RXA from files or existing buffer.
 *
 * @example
 * ```typescript
 * // Single file
 * const archive = await createRXA({ 'content': Buffer.from('Hello') });
 *
 * // Multiple files
 * const archive = await createRXA({
 *   'index.ts': Buffer.from('export default 1'),
 *   'styles.css': Buffer.from('body {}'),
 * });
 *
 * // From existing tar.gz buffer
 * const archive = await createRXA({ buffer: existingTarGzBuffer });
 *
 * // Extract to package
 * const pkg = await archive.extract();
 * const paths = pkg.paths();
 * const content = await pkg.file('index.ts');
 * ```
 */
export async function createRXA(input: RXAInput): Promise<RXA> {
  // If buffer provided, use it directly
  if (isBufferInput(input)) {
    return new RXAImpl(input.buffer);
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

  return new RXAImpl(gzipBuffer);
}
