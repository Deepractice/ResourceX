/**
 * Resource Definition Types
 */

/**
 * Definition of a custom resource (shortcut for ARP URL)
 */
export interface ResourceDefinition {
  /** Unique name for the resource (used in URL: name://location) */
  readonly name: string;

  /** Semantic type (e.g., "text", "json", "binary") */
  readonly semantic: string;

  /** Transport type (e.g., "file", "https") */
  readonly transport: string;

  /** Base path prepended to location (optional) */
  readonly basePath?: string;
}
