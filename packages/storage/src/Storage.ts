/**
 * Storage interface - pure key-value storage abstraction.
 *
 * This is the lowest layer, dealing only with raw bytes.
 * Higher-level Registry layer handles RXR objects.
 *
 * Implementations:
 * - FileSystemStorage: local filesystem
 * - MemoryStorage: in-memory (for testing)
 * - S3Storage: AWS S3 (planned)
 * - R2Storage: Cloudflare R2 (planned)
 */
export interface Storage {
  /**
   * Get data by key.
   * @throws StorageError if not found
   */
  get(key: string): Promise<Buffer>;

  /**
   * Store data.
   */
  put(key: string, data: Buffer): Promise<void>;

  /**
   * Delete data.
   */
  delete(key: string): Promise<void>;

  /**
   * Check if key exists.
   */
  exists(key: string): Promise<boolean>;

  /**
   * List keys with optional prefix.
   */
  list(prefix?: string): Promise<string[]>;
}

/**
 * Storage error.
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "WRITE_ERROR" | "READ_ERROR" | "DELETE_ERROR"
  ) {
    super(message);
    this.name = "StorageError";
  }
}
