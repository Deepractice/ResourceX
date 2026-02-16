/**
 * TypeDetector - Strategy interface for detecting resource type from files.
 *
 * Detectors examine file contents and structure to determine
 * the resource type and extract metadata.
 */

/**
 * Result of type detection.
 * Fields map directly to RXD fields for generateDefinition().
 */
export interface TypeDetectionResult {
  /** Detected resource type (e.g., "skill", "text") */
  readonly type: string;

  /** Detected resource name */
  readonly name: string;

  /** Tag/version (defaults to "latest" if not provided) */
  readonly tag?: string;

  /** Description extracted from content */
  readonly description?: string;

  /** Registry for the resource */
  readonly registry?: string;

  /** Path within registry */
  readonly path?: string;

  /** Author information */
  readonly author?: string;

  /** License information */
  readonly license?: string;

  /** Keywords for searchability */
  readonly keywords?: string[];

  /** Repository URL */
  readonly repository?: string;

  /**
   * Files to exclude from the content archive.
   * E.g., ["resource.json"] — metadata files, not content.
   */
  readonly excludeFromContent?: string[];
}

/**
 * TypeDetector - detects resource type from raw files.
 *
 * Follows the Chain of Responsibility pattern (like TypeHandlerChain).
 */
export interface TypeDetector {
  /** Detector name (for debugging and logging) */
  readonly name: string;

  /**
   * Detect the resource type from the given files.
   *
   * @param files - Raw files from the source
   * @param source - Original source identifier (for deriving name)
   * @returns Detection result, or null if this detector cannot handle the files
   */
  detect(files: Record<string, Buffer>, source: string): TypeDetectionResult | null;
}
