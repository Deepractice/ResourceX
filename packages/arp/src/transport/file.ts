/**
 * File Transport Handler
 * Provides I/O primitives for local filesystem
 *
 * Supported params:
 * - recursive: "true" - list directories recursively
 * - pattern: glob pattern - filter files by pattern (e.g., "*.json")
 */

import { readFile, writeFile, readdir, mkdir, rm, access, stat } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { TransportError } from "../errors.js";
import type { TransportHandler, TransportResult, TransportParams } from "./types.js";

export class FileTransportHandler implements TransportHandler {
  readonly name = "file";

  private resolvePath(location: string): string {
    return resolve(process.cwd(), location);
  }

  /**
   * Get content from file or directory listing
   */
  async get(location: string, params?: TransportParams): Promise<TransportResult> {
    const filePath = this.resolvePath(location);

    try {
      const stats = await stat(filePath);

      if (stats.isDirectory()) {
        return this.getDirectory(filePath, stats, params);
      } else {
        return this.getFile(filePath, stats);
      }
    } catch (error) {
      const err = error as Error & { code?: string };
      throw new TransportError(`File get error: ${err.code} - ${filePath}`, this.name, {
        cause: err,
      });
    }
  }

  /**
   * Get file content
   */
  private async getFile(
    filePath: string,
    stats: Awaited<ReturnType<typeof stat>>
  ): Promise<TransportResult> {
    const content = await readFile(filePath);
    return {
      content,
      metadata: {
        type: "file",
        size: Number(stats.size),
        modifiedAt: stats.mtime,
      },
    };
  }

  /**
   * Get directory listing
   */
  private async getDirectory(
    dirPath: string,
    stats: Awaited<ReturnType<typeof stat>>,
    params?: TransportParams
  ): Promise<TransportResult> {
    const recursive = params?.recursive === "true";
    const pattern = params?.pattern;

    let entries: string[];

    if (recursive) {
      entries = await this.listRecursive(dirPath, dirPath);
    } else {
      entries = await readdir(dirPath);
    }

    // Filter by pattern if provided
    if (pattern) {
      entries = this.filterByPattern(entries, pattern);
    }

    // Return as JSON array
    const content = Buffer.from(JSON.stringify(entries));
    return {
      content,
      metadata: {
        type: "directory",
        modifiedAt: stats.mtime,
      },
    };
  }

  /**
   * List directory recursively
   */
  private async listRecursive(basePath: string, currentPath: string): Promise<string[]> {
    const entries = await readdir(currentPath, { withFileTypes: true });
    const results: string[] = [];

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);
      const relativePath = fullPath.substring(basePath.length + 1);

      if (entry.isDirectory()) {
        const subEntries = await this.listRecursive(basePath, fullPath);
        results.push(...subEntries);
      } else {
        results.push(relativePath);
      }
    }

    return results;
  }

  /**
   * Filter entries by glob-like pattern
   * Supports simple patterns: *.json, *.txt, etc.
   */
  private filterByPattern(entries: string[], pattern: string): string[] {
    // Convert simple glob to regex
    const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".");
    const regex = new RegExp(`^${regexPattern}$`);

    return entries.filter((entry) => {
      // Match against filename only (last part of path)
      const filename = entry.split("/").pop() || entry;
      return regex.test(filename);
    });
  }

  /**
   * Set content to file
   */
  async set(location: string, content: Buffer, _params?: TransportParams): Promise<void> {
    const filePath = this.resolvePath(location);

    try {
      // Ensure directory exists
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content);
    } catch (error) {
      const err = error as Error & { code?: string };
      throw new TransportError(`File set error: ${err.code} - ${filePath}`, this.name, {
        cause: err,
      });
    }
  }

  /**
   * Check if file or directory exists
   */
  async exists(location: string): Promise<boolean> {
    const filePath = this.resolvePath(location);

    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete file or directory
   */
  async delete(location: string): Promise<void> {
    const filePath = this.resolvePath(location);

    try {
      await rm(filePath, { recursive: true });
    } catch (error) {
      const err = error as Error & { code?: string };
      // Ignore if already deleted
      if (err.code === "ENOENT") {
        return;
      }
      throw new TransportError(`File delete error: ${err.code} - ${filePath}`, this.name, {
        cause: err,
      });
    }
  }
}

export const fileTransport: FileTransportHandler = new FileTransportHandler();
