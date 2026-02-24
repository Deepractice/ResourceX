import { ResourceXError } from "~/errors.js";
import type { RXS } from "~/model/index.js";
import { FolderSourceLoader } from "./FolderSourceLoader.js";
import { GitHubSourceLoader } from "./GitHubSourceLoader.js";
import type { SourceLoader } from "./types.js";

/**
 * SourceLoaderChain - Chain of source loaders.
 *
 * Follows the same pattern as TypeDetectorChain:
 * - Static create() factory with built-in loaders
 * - Extensible via register()
 * - First match wins
 *
 * Loading order:
 * 1. FolderSourceLoader (local directories)
 * 2. GitHubSourceLoader (GitHub URLs)
 * 3. Custom loaders (registered in order)
 */
export class SourceLoaderChain {
  private readonly loaders: SourceLoader[] = [];

  private constructor() {}

  /**
   * Create a new SourceLoaderChain with built-in loaders.
   */
  static create(): SourceLoaderChain {
    const chain = new SourceLoaderChain();
    chain.loaders.push(new FolderSourceLoader());
    chain.loaders.push(new GitHubSourceLoader());
    return chain;
  }

  /**
   * Register a custom loader.
   * Custom loaders are appended after built-in loaders.
   */
  register(loader: SourceLoader): void {
    this.loaders.push(loader);
  }

  /**
   * Check if any loader in the chain can handle the source.
   *
   * @param source - Source path or identifier
   * @returns true if any loader can handle the source
   */
  async canLoad(source: string): Promise<boolean> {
    for (const loader of this.loaders) {
      if (await loader.canLoad(source)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Load raw files from a source.
   *
   * @param source - Source path or identifier
   * @returns RXS with raw files
   * @throws ResourceXError if no loader matches
   */
  async load(source: string): Promise<RXS> {
    for (const loader of this.loaders) {
      if (await loader.canLoad(source)) {
        return loader.load(source);
      }
    }
    throw new ResourceXError(`Cannot load source: ${source}`);
  }

  /**
   * Check if cached content for a source is still fresh.
   *
   * Delegates to the matching loader's isFresh method.
   * Returns false if the loader doesn't implement isFresh (always reload).
   *
   * @param source - Source path or identifier
   * @param cachedAt - When the resource was last cached
   * @returns true if cache is still fresh
   */
  async isFresh(source: string, cachedAt: Date): Promise<boolean> {
    for (const loader of this.loaders) {
      if (await loader.canLoad(source)) {
        if (loader.isFresh) {
          return loader.isFresh(source, cachedAt);
        }
        return false;
      }
    }
    return false;
  }
}
