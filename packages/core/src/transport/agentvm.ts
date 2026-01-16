/**
 * AgentVM Transport Handler
 * Maps agentvm:// to ~/.agentvm/ directory
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { readFile, writeFile, readdir, access, unlink, mkdir, stat, rm } from "node:fs/promises";
import { TransportError } from "../errors.js";
import type { TransportHandler, ResourceStat } from "./types.js";

export interface AgentVMConfig {
  /**
   * Parent directory for .agentvm folder
   * @default homedir()
   */
  parentDir?: string;
}

/**
 * Create agentvm transport handler
 * Maps agentvm://path to parentDir/.agentvm/path
 *
 * @example
 * ```typescript
 * const handler = agentvmHandler();
 * // → ~/.agentvm/
 *
 * const handler = agentvmHandler({ parentDir: "/var/data" });
 * // → /var/data/.agentvm/
 * ```
 */
export function agentvmHandler(config: AgentVMConfig = {}): TransportHandler {
  const parentDir = config.parentDir || homedir();
  const baseDir = join(parentDir, ".agentvm");

  /**
   * Resolve agentvm:// location to full filesystem path
   */
  function resolvePath(location: string): string {
    return join(baseDir, location);
  }

  return {
    name: "agentvm",

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
          `Failed to read from agentvm: ${(error as Error).message}`,
          "agentvm",
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
          `Failed to write to agentvm: ${(error as Error).message}`,
          "agentvm",
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
          `Failed to list agentvm directory: ${(error as Error).message}`,
          "agentvm",
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
          `Failed to stat agentvm resource: ${(error as Error).message}`,
          "agentvm",
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
          `Failed to delete from agentvm: ${(error as Error).message}`,
          "agentvm",
          { cause: error }
        );
      }
    },
  };
}
