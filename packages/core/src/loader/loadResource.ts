import type { ResourceLoader } from "./types.js";
import type { RXR } from "~/model/index.js";
import { FolderLoader } from "./FolderLoader.js";
import { ResourceXError } from "~/errors.js";

/**
 * Configuration options for loadResource.
 */
export interface LoadResourceConfig {
  /**
   * Custom loader to use. If not provided, defaults to FolderLoader.
   */
  loader?: ResourceLoader;
}

/**
 * Load a resource from a given source using a ResourceLoader.
 *
 * By default, uses FolderLoader which expects:
 * ```
 * folder/
 * ├── resource.json    # Resource metadata
 * └── content          # Resource content
 * ```
 *
 * You can provide a custom loader via config.loader to support other formats
 * (e.g., zip, tar.gz, URLs).
 *
 * @param source - Source path or identifier
 * @param config - Optional configuration
 * @returns Complete RXR object ready for registry.link()
 * @throws ResourceXError if the source cannot be loaded
 *
 * @example
 * ```typescript
 * // Load from folder (default)
 * const rxr = await loadResource("./my-resource");
 * await registry.link(rxr);
 *
 * // Load with custom loader
 * const rxr = await loadResource("resource.zip", {
 *   loader: new ZipLoader()
 * });
 * ```
 */
export async function loadResource(source: string, config?: LoadResourceConfig): Promise<RXR> {
  const loader = config?.loader ?? new FolderLoader();

  // Check if loader can handle this source
  const canLoad = await loader.canLoad(source);
  if (!canLoad) {
    throw new ResourceXError(`Cannot load resource from: ${source}`);
  }

  // Load the resource
  return loader.load(source);
}
