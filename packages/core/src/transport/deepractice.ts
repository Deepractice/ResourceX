/**
 * Deepractice Transport Handler
 * Maps deepractice:// to ~/.deepractice/ directory
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { readFile, writeFile, readdir, access, unlink, mkdir, stat, rm } from "node:fs/promises";
import { TransportError } from "../errors.js";
import type { TransportHandler, ResourceStat } from "./types.js";

export interface DeepracticeConfig {
  /**
   * Parent directory for .deepractice folder
   * @default homedir()
   */
  parentDir?: string;
}

/**
 * Create deepractice transport handler
 * Maps deepractice://path to parentDir/.deepractice/path
 *
 * @example
 * ```typescript
 * const handler = deepracticeHandler();
 * // → ~/.deepractice/
 *
 * const handler = deepracticeHandler({ parentDir: "/var/data" });
 * // → /var/data/.deepractice/
 * ```
 */
export function deepracticeHandler(config: DeepracticeConfig = {}): TransportHandler {
  const parentDir = config.parentDir || homedir();
  const baseDir = join(parentDir, ".deepractice");

  /**
   * Resolve deepractice:// location to full filesystem path
   */
  function resolvePath(location: string): string {
    return join(baseDir, location);
  }

  return {
    name: "deepractice",

    capabilities: {
      canRead: true,
      canWrite: true,
      canList: true,
      canDelete: true,
      canStat: true,
    },

    async read(location: string): Promise<Buffer> {
      const fullPath = resolvePath(location);
      try {
        return await readFile(fullPath);
      } catch (error) {
        throw new TransportError(
          `Failed to read from deepractice: ${(error as Error).message}`,
          "deepractice",
          { cause: error }
        );
      }
    },

    async write(location: string, content: Buffer): Promise<void> {
      const fullPath = resolvePath(location);
      try {
        // Ensure parent directory exists
        await mkdir(join(fullPath, ".."), { recursive: true });
        await writeFile(fullPath, content);
      } catch (error) {
        throw new TransportError(
          `Failed to write to deepractice: ${(error as Error).message}`,
          "deepractice",
          { cause: error }
        );
      }
    },

    async list(location: string): Promise<string[]> {
      const fullPath = resolvePath(location);
      try {
        return await readdir(fullPath);
      } catch (error) {
        throw new TransportError(
          `Failed to list deepractice directory: ${(error as Error).message}`,
          "deepractice",
          { cause: error }
        );
      }
    },

    async exists(location: string): Promise<boolean> {
      const fullPath = resolvePath(location);
      try {
        await access(fullPath);
        return true;
      } catch {
        return false;
      }
    },

    async stat(location: string): Promise<ResourceStat> {
      const fullPath = resolvePath(location);
      try {
        const stats = await stat(fullPath);
        return {
          size: stats.size,
          isDirectory: stats.isDirectory(),
          modifiedAt: stats.mtime,
        };
      } catch (error) {
        throw new TransportError(
          `Failed to stat deepractice resource: ${(error as Error).message}`,
          "deepractice",
          { cause: error }
        );
      }
    },

    async delete(location: string): Promise<void> {
      const fullPath = resolvePath(location);
      try {
        const stats = await stat(fullPath);
        if (stats.isDirectory()) {
          await rm(fullPath, { recursive: true, force: true });
        } else {
          await unlink(fullPath);
        }
      } catch (error) {
        throw new TransportError(
          `Failed to delete from deepractice: ${(error as Error).message}`,
          "deepractice",
          { cause: error }
        );
      }
    },
  };
}
