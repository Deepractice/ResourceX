/**
 * RXAStore - Content-Addressable Storage for Resource Archives
 *
 * SPI interface for storing file content by digest (hash).
 * Platform implementations provide concrete storage backends
 * (FileSystem, S3, R2, Memory, etc.)
 */
export interface RXAStore {
  /**
   * Get content by digest.
   * @throws if not found
   */
  get(digest: string): Promise<Buffer>;

  /**
   * Store content, returns digest.
   * If content with same digest exists, skips write (deduplication).
   */
  put(data: Buffer): Promise<string>;

  /**
   * Check if digest exists.
   */
  has(digest: string): Promise<boolean>;

  /**
   * Delete content by digest (for GC).
   */
  delete(digest: string): Promise<void>;

  /**
   * List all digests (for GC).
   */
  list(): Promise<string[]>;
}
