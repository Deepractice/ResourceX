import { join, relative } from "node:path";
import { stat, readFile, readdir } from "node:fs/promises";
import type { ResourceLoader } from "./types.js";
import type { RXR } from "@resourcexjs/core";
import { createRXM, createRXA, parseRXL, ResourceXError } from "@resourcexjs/core";

/**
 * Default ResourceLoader implementation for loading resources from folders.
 *
 * Expected folder structure:
 * ```
 * folder/
 * ├── resource.json    # Resource metadata (required)
 * └── ...              # Any other files/directories (content)
 * ```
 *
 * resource.json format:
 * ```json
 * {
 *   "name": "resource-name",      // required
 *   "type": "text",               // required
 *   "version": "1.0.0",           // required
 *   "domain": "localhost",        // optional, defaults to "localhost"
 *   "path": "optional/path"       // optional
 * }
 * ```
 *
 * All files in the folder (except resource.json) will be packaged into the RXA.
 */
export class FolderLoader implements ResourceLoader {
  async canLoad(source: string): Promise<boolean> {
    try {
      const stats = await stat(source);
      if (!stats.isDirectory()) {
        return false;
      }

      // Check if resource.json exists
      const manifestPath = join(source, "resource.json");
      const manifestStats = await stat(manifestPath);

      return manifestStats.isFile();
    } catch {
      return false;
    }
  }

  async load(folderPath: string): Promise<RXR> {
    // 1. Read resource.json
    const manifestPath = join(folderPath, "resource.json");
    let manifestJson: string;
    try {
      manifestJson = await readFile(manifestPath, "utf-8");
    } catch (error) {
      throw new ResourceXError(
        `Failed to read resource.json: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // 2. Parse JSON
    let manifestData: Record<string, unknown>;
    try {
      manifestData = JSON.parse(manifestJson);
    } catch (error) {
      throw new ResourceXError(
        `Invalid JSON in resource.json: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // 3. Validate required fields
    if (!manifestData.name) {
      throw new ResourceXError("Invalid resource.json: missing required field 'name'");
    }
    if (!manifestData.type) {
      throw new ResourceXError("Invalid resource.json: missing required field 'type'");
    }
    if (!manifestData.version) {
      throw new ResourceXError("Invalid resource.json: missing required field 'version'");
    }

    // 4. Create RXM with defaults
    const manifest = createRXM({
      domain: (manifestData.domain as string) ?? "localhost",
      path: manifestData.path as string | undefined,
      name: manifestData.name as string,
      type: manifestData.type as string,
      version: manifestData.version as string,
    });

    // 5. Read all files in folder (except resource.json)
    const files = await this.readFolderFiles(folderPath);

    if (Object.keys(files).length === 0) {
      throw new ResourceXError("No content files found in resource folder");
    }

    // 6. Create RXA
    const archive = await createRXA(files);

    // 7. Assemble RXR
    const locator = parseRXL(manifest.toLocator());

    return {
      locator,
      manifest,
      archive,
    };
  }

  /**
   * Recursively read all files in a folder, returning a map of relative paths to buffers.
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

      // Skip resource.json
      if (relativePath === "resource.json") {
        continue;
      }

      if (entry.isFile()) {
        files[relativePath] = await readFile(fullPath);
      } else if (entry.isDirectory()) {
        // Recursively read subdirectory
        const subFiles = await this.readFolderFiles(fullPath, basePath);
        Object.assign(files, subFiles);
      }
    }

    return files;
  }
}
