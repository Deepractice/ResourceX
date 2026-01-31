import type { Storage } from "./Storage.js";
import { StorageError } from "./Storage.js";

/**
 * MemoryStorage - In-memory storage implementation.
 *
 * Useful for testing and ephemeral use cases.
 */
export class MemoryStorage implements Storage {
  private readonly data = new Map<string, Buffer>();

  async get(key: string): Promise<Buffer> {
    const value = this.data.get(key);
    if (!value) {
      throw new StorageError(`Key not found: ${key}`, "NOT_FOUND");
    }
    return value;
  }

  async put(key: string, data: Buffer): Promise<void> {
    this.data.set(key, data);
  }

  async delete(key: string): Promise<void> {
    // Delete all keys with this prefix (for directory-like behavior)
    for (const k of this.data.keys()) {
      if (k === key || k.startsWith(`${key}/`)) {
        this.data.delete(k);
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    return this.data.has(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const results: string[] = [];
    for (const key of this.data.keys()) {
      if (!prefix || key.startsWith(prefix)) {
        results.push(key);
      }
    }
    return results;
  }

  /**
   * Clear all data. Useful for test cleanup.
   */
  clear(): void {
    this.data.clear();
  }

  /**
   * Get size of storage. Useful for testing.
   */
  size(): number {
    return this.data.size;
  }
}
