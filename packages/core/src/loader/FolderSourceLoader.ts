import { join, relative } from "node:path";
import { stat, readFile, readdir } from "node:fs/promises";
import type { SourceLoader } from "./types.js";
import type { RXS } from "~/model/index.js";
import { ResourceXError } from "~/errors.js";

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
