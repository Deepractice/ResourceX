import { ResourceXError } from "~/errors.js";
import type { RXS } from "~/model/index.js";
import { GitHubSourceLoader } from "./GitHubSourceLoader.js";
import type { SourceLoader } from "./types.js";

/**
 * SourceLoaderChain - Chain of source loaders.
 *
 * Follows the same pattern as TypeDetectorChain:
 * - Static create() factory with built-in environment-agnostic loaders
 * - Extensible via register()
 * - First match wins
 *
 * Built-in loaders (environment-agnostic):
 * 1. GitHubSourceLoader (GitHub URLs via fetch)
 *
 * Provider-registered loaders (environment-specific):
 * - FolderSourceLoader (local directories) — via node-provider
 * - NpmSourceLoader (npm: prefixed packages) — via node-provider
 */
export class SourceLoaderChain {
  private readonly loaders: SourceLoader[] = [];

  private constructor() {}

  /**
   * Create a new SourceLoaderChain with built-in environment-agnostic loaders.
   * Environment-specific loaders (folder, npm) are registered by the provider.
   */
  static create(): SourceLoaderChain {
    const chain = new SourceLoaderChain();
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
}
