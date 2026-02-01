import type { RXR } from "~/model/index.js";

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
