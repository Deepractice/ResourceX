import { ResourceXError } from "~/errors.js";
import type { RXR } from "~/model/index.js";
import type { ResourceLoader } from "./types.js";

/**
 * Configuration options for loadResource.
 */
export interface LoadResourceConfig {
  /**
   * Loader to use. Required — environment-specific loaders are provided by the provider.
   * For Node.js/Bun: use FolderLoader from @resourcexjs/node-provider.
   */
  loader: ResourceLoader;
}

/**
 * Load a resource from a given source using a ResourceLoader.
 *
 * @param source - Source path or identifier
 * @param config - Configuration with loader
 * @returns Complete RXR object ready for registry.link()
 * @throws ResourceXError if the source cannot be loaded
 *
 * @example
 * ```typescript
 * import { FolderLoader } from "@resourcexjs/node-provider";
 *
 * const rxr = await loadResource("./my-resource", {
 *   loader: new FolderLoader()
 * });
 * ```
 */
export async function loadResource(source: string, config: LoadResourceConfig): Promise<RXR> {
  const loader = config.loader;

  // Check if loader can handle this source
  const canLoad = await loader.canLoad(source);
  if (!canLoad) {
    throw new ResourceXError(`Cannot load resource from: ${source}`);
  }

  // Load the resource
  return loader.load(source);
}
