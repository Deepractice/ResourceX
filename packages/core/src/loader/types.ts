import type { RXR, RXS } from "~/model/index.js";

/**
 * ResourceLoader - Strategy interface for loading resources from different sources.
 */
export interface ResourceLoader {
  /**
   * Check if this loader can handle the given source.
   *
   * @param source - Source path or identifier
   * @returns true if this loader can handle the source
   */
  canLoad(source: string): boolean | Promise<boolean>;

  /**
   * Load a resource from the given source.
   *
   * @param source - Source path or identifier
   * @returns Complete RXR object
   * @throws ResourceXError if loading fails
   */
  load(source: string): Promise<RXR>;
}

/**
 * SourceLoader - Strategy interface for loading raw files from a source.
 *
 * Unlike ResourceLoader (which produces a complete RXR),
 * SourceLoader produces an RXS (raw files) for type detection.
 */
export interface SourceLoader {
  /**
   * Check if this loader can handle the given source.
   *
   * @param source - Source path or identifier
   * @returns true if this loader can handle the source
   */
  canLoad(source: string): boolean | Promise<boolean>;

  /**
   * Load raw files from the given source.
   *
   * @param source - Source path or identifier
   * @returns RXS with raw files
   * @throws ResourceXError if loading fails
   */
  load(source: string): Promise<RXS>;

  /**
   * Check if cached content for this source is still fresh.
   *
   * Each loader implements its own strategy:
   * - FolderSourceLoader: compare file mtime against cachedAt
   * - GitHubSourceLoader: not implemented (always stale)
   *
   * Loaders that don't implement this are treated as always stale,
   * causing a full reload on every ingest.
   *
   * @param source - Source path or identifier
   * @param cachedAt - When the resource was last cached
   * @returns true if cache is still fresh, false if stale
   */
  isFresh?(source: string, cachedAt: Date): Promise<boolean>;
}
