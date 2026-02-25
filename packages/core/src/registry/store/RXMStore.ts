/**
 * RXMStore - Manifest Storage
 *
 * SPI interface for storing resource manifests.
 * Platform implementations provide concrete storage backends
 * (SQLite, PostgreSQL, FileSystem, Memory, etc.)
 */

/**
 * Stored manifest with file digest mappings.
 */
export interface StoredRXM {
  readonly registry?: string;
  readonly path?: string;
  readonly name: string;
  readonly type: string;
  readonly tag: string;
  readonly description?: string;
  readonly author?: string;
  readonly license?: string;
  readonly keywords?: string[];
  readonly repository?: string;
  readonly digest?: string; // deterministic content digest (sha256)
  readonly files: Record<string, string>; // filename → digest
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

/**
 * Search options for RXMStore.
 */
export interface RXMSearchOptions {
  /**
   * Filter by registry.
   * - undefined: all
   * - null: local only (no registry)
   * - string: specific registry
   */
  registry?: string | null;

  /**
   * Search query (matches name).
   */
  query?: string;

  /**
   * Maximum results.
   */
  limit?: number;

  /**
   * Skip results (pagination).
   */
  offset?: number;
}

export interface RXMStore {
  /**
   * Get manifest.
   * @returns null if not found
   */
  get(name: string, tag: string, registry?: string): Promise<StoredRXM | null>;

  /**
   * Store manifest.
   */
  put(manifest: StoredRXM): Promise<void>;

  /**
   * Check if manifest exists.
   */
  has(name: string, tag: string, registry?: string): Promise<boolean>;

  /**
   * Delete manifest.
   */
  delete(name: string, tag: string, registry?: string): Promise<void>;

  /**
   * List all tags for a resource.
   */
  listTags(name: string, registry?: string): Promise<string[]>;

  /**
   * List all resource names.
   */
  listNames(registry?: string, query?: string): Promise<string[]>;

  /**
   * Search manifests.
   */
  search(options?: RXMSearchOptions): Promise<StoredRXM[]>;

  /**
   * Delete all manifests from a registry (clear cache).
   */
  deleteByRegistry(registry: string): Promise<void>;

  /**
   * Set the "latest" pointer for a resource.
   * Points to the tag of the most recently added version.
   */
  setLatest(name: string, tag: string, registry?: string): Promise<void>;

  /**
   * Get the "latest" pointer for a resource.
   * @returns The tag that "latest" points to, or null if no pointer exists.
   */
  getLatest(name: string, registry?: string): Promise<string | null>;
}
