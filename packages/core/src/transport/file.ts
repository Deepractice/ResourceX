/**
 * File Transport Handler
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { TransportError } from "../errors.js";
import type { TransportHandler } from "./types.js";

export class FileTransportHandler implements TransportHandler {
  readonly type = "file";

  async fetch(location: string): Promise<Buffer> {
    const filePath = resolve(process.cwd(), location);

    try {
      return await readFile(filePath);
    } catch (error) {
      const err = error as Error & { code?: string };
      throw new TransportError(`File read error: ${err.code} - ${filePath}`, this.type, {
        cause: err,
      });
    }
  }
}

export const fileHandler: FileTransportHandler = new FileTransportHandler();
