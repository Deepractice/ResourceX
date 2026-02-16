import type { TypeDetector } from "~/detector/index.js";
import { generateDefinition, TypeDetectorChain } from "~/detector/index.js";
import { ResourceXError } from "~/errors.js";
import type { RXR } from "~/model/index.js";
import { archive, manifest, resource } from "~/model/index.js";
import { SourceLoaderChain } from "./SourceLoaderChain.js";
import type { SourceLoader } from "./types.js";

/**
 * Configuration for resolveSource.
 */
export interface ResolveSourceConfig {
  /** Custom loader chain (overrides default chain) */
  loaderChain?: SourceLoaderChain;

  /** Additional loaders to register on the chain */
  loaders?: SourceLoader[];

  /** Custom detector chain (default: TypeDetectorChain.create()) */
  detectorChain?: TypeDetectorChain;

  /** Additional detectors to register on the default chain */
  detectors?: TypeDetector[];
}

/**
 * Resolve a source into a complete RXR.
 *
 * Pipeline: Load files -> Detect type -> Generate RXD -> Archive -> RXR
 *
 * Supports both explicit resource.json and auto-detection from file patterns.
 *
 * @param source - Source path or identifier
 * @param config - Optional configuration
 * @returns Complete RXR ready for registry
 *
 * @example
 * ```typescript
 * // Auto-detect from folder (with or without resource.json)
 * const rxr = await resolveSource("./my-skill");
 *
 * // With custom loader
 * const rxr = await resolveSource("./custom", {
 *   loaders: [new MyCustomLoader()]
 * });
 * ```
 */
export async function resolveSource(source: string, config?: ResolveSourceConfig): Promise<RXR> {
  // 1. Setup loader chain
  const loaderChain = config?.loaderChain ?? SourceLoaderChain.create();
  if (config?.loaders) {
    for (const loader of config.loaders) {
      loaderChain.register(loader);
    }
  }

  // 2. Load raw files
  const rxs = await loaderChain.load(source);

  if (Object.keys(rxs.files).length === 0) {
    throw new ResourceXError("No files found in source");
  }

  // 3. Setup detector chain
  const chain = config?.detectorChain ?? TypeDetectorChain.create();
  if (config?.detectors) {
    for (const detector of config.detectors) {
      chain.register(detector);
    }
  }

  // 4. Detect type
  const detected = chain.detect(rxs.files, rxs.source);

  // 5. Generate RXD
  const rxd = generateDefinition(detected);

  // 6. Filter excluded files from content
  const contentFiles: Record<string, Buffer> = {};
  const excluded = new Set(detected.excludeFromContent ?? []);
  for (const [path, content] of Object.entries(rxs.files)) {
    if (!excluded.has(path)) {
      contentFiles[path] = content;
    }
  }

  if (Object.keys(contentFiles).length === 0) {
    throw new ResourceXError("No content files after excluding metadata");
  }

  // 7. Build RXR
  const rxm = manifest(rxd);
  const rxa = await archive(contentFiles);
  return resource(rxm, rxa);
}
