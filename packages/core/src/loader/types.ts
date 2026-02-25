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
}
