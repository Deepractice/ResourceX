/**
 * File Transport Handler
 * Provides I/O primitives for local filesystem
 */

import { readFile, writeFile, readdir, mkdir, rm, access, stat as fsStat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { TransportError } from "../errors.js";
import type { TransportHandler, TransportCapabilities, ResourceStat } from "./types.js";

export class FileTransportHandler implements TransportHandler {
  readonly name = "file";

  readonly capabilities: TransportCapabilities = {
    canRead: true,
    canWrite: true,
    canList: true,
    canDelete: true,
    canStat: true,
  };

  private resolvePath(location: string): string {
    return resolve(process.cwd(), location);
  }

  async read(location: string): Promise<Buffer> {
    const filePath = this.resolvePath(location);

    try {
      return await readFile(filePath);
    } catch (error) {
      const err = error as Error & { code?: string };
      throw new TransportError(`File read error: ${err.code} - ${filePath}`, this.name, {
        cause: err,
      });
    }
  }

  async write(location: string, content: Buffer): Promise<void> {
    const filePath = this.resolvePath(location);

    try {
      // Ensure directory exists
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content);
    } catch (error) {
      const err = error as Error & { code?: string };
      throw new TransportError(`File write error: ${err.code} - ${filePath}`, this.name, {
        cause: err,
      });
    }
  }

  async list(location: string): Promise<string[]> {
    const dirPath = this.resolvePath(location);

    try {
      return await readdir(dirPath);
    } catch (error) {
      const err = error as Error & { code?: string };
      throw new TransportError(`Directory list error: ${err.code} - ${dirPath}`, this.name, {
        cause: err,
      });
    }
  }

  async mkdir(location: string): Promise<void> {
    const dirPath = this.resolvePath(location);

    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      const err = error as Error & { code?: string };
      throw new TransportError(`Directory create error: ${err.code} - ${dirPath}`, this.name, {
        cause: err,
      });
    }
  }

  async exists(location: string): Promise<boolean> {
    const filePath = this.resolvePath(location);

    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async stat(location: string): Promise<ResourceStat> {
    const filePath = this.resolvePath(location);

    try {
      const stats = await fsStat(filePath);
      return {
        size: stats.size,
        modifiedAt: stats.mtime,
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      const err = error as Error & { code?: string };
      throw new TransportError(`File stat error: ${err.code} - ${filePath}`, this.name, {
        cause: err,
      });
    }
  }

  async delete(location: string): Promise<void> {
    const filePath = this.resolvePath(location);

    try {
      await rm(filePath, { recursive: true });
    } catch (error) {
      const err = error as Error & { code?: string };
      throw new TransportError(`File delete error: ${err.code} - ${filePath}`, this.name, {
        cause: err,
      });
    }
  }
}

export const fileHandler: FileTransportHandler = new FileTransportHandler();
