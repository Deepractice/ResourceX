/**
 * Transport Handler Interface
 * Responsible for I/O primitives - read, write, list, exists, delete
 * Transport only handles WHERE and HOW to access bytes, not WHAT they mean
 */

/**
 * Transport capabilities declaration
 */
export interface TransportCapabilities {
  readonly canRead: boolean;
  readonly canWrite: boolean;
  readonly canList: boolean;
  readonly canDelete: boolean;
  readonly canStat: boolean;
}

/**
 * Resource stat information
 */
export interface ResourceStat {
  size: number;
  modifiedAt?: Date;
  isDirectory?: boolean;
}

/**
 * Transport Handler - provides I/O primitives
 */
export interface TransportHandler {
  /**
   * Transport name (e.g., "https", "file", "s3")
   */
  readonly name: string;

  /**
   * Transport capabilities
   */
  readonly capabilities: TransportCapabilities;

  /**
   * Read content from location
   * @param location - The location string after ://
   * @returns Raw content as Buffer
   */
  read(location: string): Promise<Buffer>;

  /**
   * Write content to location
   * @param location - The location string after ://
   * @param content - Content to write
   */
  write?(location: string, content: Buffer): Promise<void>;

  /**
   * List entries at location (for directory-like transports)
   * @param location - The location string after ://
   * @returns Array of entry names
   */
  list?(location: string): Promise<string[]>;

  /**
   * Create directory at location
   * @param location - The location string after ://
   */
  mkdir?(location: string): Promise<void>;

  /**
   * Check if resource exists at location
   * @param location - The location string after ://
   */
  exists?(location: string): Promise<boolean>;

  /**
   * Get resource stat information
   * @param location - The location string after ://
   */
  stat?(location: string): Promise<ResourceStat>;

  /**
   * Delete resource at location
   * @param location - The location string after ://
   */
  delete?(location: string): Promise<void>;
}
