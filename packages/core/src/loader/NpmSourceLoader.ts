import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ResourceXError } from "~/errors.js";
import type { RXS } from "~/model/index.js";
import { FolderSourceLoader } from "./FolderSourceLoader.js";
import type { SourceLoader } from "./types.js";

const NPM_PREFIX = "npm:";

/**
 * NpmSourceLoader - Loads raw files from an installed package.
 *
 * Recognizes sources prefixed with "npm:" (e.g. "npm:@rolexjs/rolex-prototype").
 * Resolves the package directory via import.meta.resolve with the consumer's
 * working directory as parent context, then delegates to FolderSourceLoader.
 *
 * Supports both npm-installed packages and workspace:* linked packages.
 */
export class NpmSourceLoader implements SourceLoader {
  private readonly folder = new FolderSourceLoader();

  canLoad(source: string): boolean {
    return source.startsWith(NPM_PREFIX);
  }

  async load(source: string): Promise<RXS> {
    if (!this.canLoad(source)) {
      throw new ResourceXError(`Not an npm source: ${source}`);
    }

    const packageName = source.slice(NPM_PREFIX.length);
    if (!packageName) {
      throw new ResourceXError(`Empty package name in npm source: ${source}`);
    }

    const packageDir = this.resolvePackageDir(packageName);
    const rxs = await this.folder.load(packageDir);
    return { source, files: rxs.files };
  }

  private resolvePackageDir(packageName: string): string {
    // Resolve from consumer's cwd, not from this bundled library's location.
    // The second argument to import.meta.resolve sets the parent context.
    const parent = pathToFileURL(join(process.cwd(), "noop.js")).href;
    try {
      const url = import.meta.resolve(`${packageName}/package.json`, parent);
      return dirname(fileURLToPath(url));
    } catch {
      throw new ResourceXError(`Cannot resolve npm package: ${packageName}`);
    }
  }
}
