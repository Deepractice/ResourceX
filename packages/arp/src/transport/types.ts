/**
 * Transport Handler Interface
 * Responsible for I/O primitives - get, set, exists, delete
 * Transport only handles WHERE and HOW to access bytes, not WHAT they mean
 *
 * Each transport defines its own location format and supported parameters.
 */

/**
 * Runtime parameters passed to transport operations
 * Each transport defines which parameters it supports
 */
export type TransportParams = Record<string, string>;

/**
 * Options for list operation
 */
export interface ListOptions {
  /**
   * Whether to list recursively
   */
  recursive?: boolean;

  /**
   * Glob pattern to filter results (e.g., "*.json")
   */
  pattern?: string;
}

/**
 * Result from transport get operation
 */
export interface TransportResult {
  /**
   * Raw content as Buffer
   */
  content: Buffer;

  /**
   * Optional metadata about the resource
   */
  metadata?: {
    /**
     * Resource type: 'file' or 'directory'
     */
    type?: "file" | "directory";

    /**
     * File size in bytes
     */
    size?: number;

    /**
     * Last modified time
     */
    modifiedAt?: Date;

    /**
     * Additional transport-specific metadata
     */
    [key: string]: unknown;
  };
}

/**
 * Transport Handler - provides I/O primitives
 *
 * Four core operations:
 * - get: Retrieve content (file content or directory listing)
 * - set: Store content
 * - exists: Check existence
 * - delete: Remove resource
 */
export interface TransportHandler {
  /**
   * Transport name (e.g., "https", "file", "s3")
   */
  readonly name: string;

  /**
   * Get content from location
   *
   * For file-like transports:
   * - If location points to a file, returns file content
   * - If location points to a directory, returns directory listing as JSON
   *
   * @param location - The location string (format depends on transport)
   * @param params - Optional runtime parameters (transport-specific)
   * @returns Content and optional metadata
   */
  get(location: string, params?: TransportParams): Promise<TransportResult>;

  /**
   * Set content at location
   *
   * @param location - The location string (format depends on transport)
   * @param content - Content to write
   * @param params - Optional runtime parameters (transport-specific)
   */
  set(location: string, content: Buffer, params?: TransportParams): Promise<void>;

  /**
   * Check if resource exists at location
   *
   * @param location - The location string (format depends on transport)
   */
  exists(location: string): Promise<boolean>;

  /**
   * Delete resource at location
   *
   * @param location - The location string (format depends on transport)
   */
  delete(location: string): Promise<void>;

  /**
   * List contents at location (optional - not all transports support this)
   *
   * @param location - The directory location
   * @param options - List options (recursive, pattern filter)
   * @returns Array of file/directory paths relative to location
   */
  list?(location: string, options?: ListOptions): Promise<string[]>;

  /**
   * Create directory at location (optional - not all transports support this)
   *
   * @param location - The directory location to create
   */
  mkdir?(location: string): Promise<void>;
}
