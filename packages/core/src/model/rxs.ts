/**
 * RXS - ResourceX Source
 *
 * Intermediate representation of raw files from any source.
 * Produced by SourceLoader, consumed by TypeDetectorChain.
 *
 * Unlike RXR (which is fully packaged), RXS is pre-detection:
 * the files have been loaded but the type and metadata are unknown.
 */
export interface RXS {
  /** Original source identifier (path, URL, etc.) */
  readonly source: string;

  /** Raw files loaded from source: relative path -> content */
  readonly files: Record<string, Buffer>;
}
