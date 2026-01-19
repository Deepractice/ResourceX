import { join } from "node:path";
import { stat, readFile } from "node:fs/promises";
import type { ResourceLoader } from "./types.js";
import type { RXR } from "@resourcexjs/core";
import { createRXM, createRXC, parseRXL, ResourceXError } from "@resourcexjs/core";

/**
 * Default ResourceLoader implementation for loading resources from folders.
 *
 * Expected folder structure:
 * ```
 * folder/
 * ├── resource.json    # Resource metadata (required)
 * └── content          # Resource content (required)
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
 */
export class FolderLoader implements ResourceLoader {
  async canLoad(source: string): Promise<boolean> {
    try {
      const stats = await stat(source);
      if (!stats.isDirectory()) {
        return false;
      }

      // Check if required files exist
      const manifestPath = join(source, "resource.json");
      const contentPath = join(source, "content");

      const manifestStats = await stat(manifestPath);
      const contentStats = await stat(contentPath);

      return manifestStats.isFile() && contentStats.isFile();
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
    let manifestData: any;
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
      domain: manifestData.domain ?? "localhost",
      path: manifestData.path,
      name: manifestData.name,
      type: manifestData.type,
      version: manifestData.version,
    });

    // 5. Read content file
    const contentPath = join(folderPath, "content");
    let contentBuffer: Buffer;
    try {
      contentBuffer = await readFile(contentPath);
    } catch (error) {
      throw new ResourceXError(
        `Failed to read content file: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // 6. Create RXC
    const content = createRXC(contentBuffer);

    // 7. Assemble RXR
    const locator = parseRXL(manifest.toLocator());

    return {
      locator,
      manifest,
      content,
    };
  }
}
