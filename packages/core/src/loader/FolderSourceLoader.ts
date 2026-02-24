import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { ResourceXError } from "~/errors.js";
import type { RXS } from "~/model/index.js";
import type { SourceLoader } from "./types.js";

/**
 * FolderSourceLoader - Loads raw files from a folder into RXS.
 *
 * Unlike FolderLoader (which requires resource.json and produces RXR),
 * FolderSourceLoader loads ALL files from a folder without interpreting them.
 * Type detection happens downstream via TypeDetectorChain.
 */
export class FolderSourceLoader implements SourceLoader {
  async canLoad(source: string): Promise<boolean> {
    try {
      const stats = await stat(source);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async load(source: string): Promise<RXS> {
    const canLoad = await this.canLoad(source);
    if (!canLoad) {
      throw new ResourceXError(`Source is not a directory: ${source}`);
    }

    const files = await this.readFolderFiles(source);
    return { source, files };
  }

  /**
   * Check if cached content is still fresh by comparing file mtimes.
   * Returns true only if no file in the directory has been modified since cachedAt.
   */
  async isFresh(source: string, cachedAt: Date): Promise<boolean> {
    try {
      const maxMtime = await this.getMaxMtime(source);
      return maxMtime <= cachedAt;
    } catch {
      return false;
    }
  }

  /**
   * Get the most recent mtime across all files in a folder (recursive).
   */
  private async getMaxMtime(folderPath: string): Promise<Date> {
    let max = new Date(0);
    const entries = await readdir(folderPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(folderPath, entry.name);

      if (entry.isFile()) {
        const stats = await stat(fullPath);
        if (stats.mtime > max) max = stats.mtime;
      } else if (entry.isDirectory()) {
        const subMax = await this.getMaxMtime(fullPath);
        if (subMax > max) max = subMax;
      }
    }

    return max;
  }

  /**
   * Recursively read all files in a folder.
   */
  private async readFolderFiles(
    folderPath: string,
    basePath: string = folderPath
  ): Promise<Record<string, Buffer>> {
    const files: Record<string, Buffer> = {};
    const entries = await readdir(folderPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(folderPath, entry.name);
      const relativePath = relative(basePath, fullPath);

      if (entry.isFile()) {
        files[relativePath] = await readFile(fullPath);
      } else if (entry.isDirectory()) {
        const subFiles = await this.readFolderFiles(fullPath, basePath);
        Object.assign(files, subFiles);
      }
    }

    return files;
  }
}
