/**
 * MemoryRXAStore - In-memory implementation of RXAStore.
 *
 * For testing and development only.
 */

import { RegistryError } from "../errors.js";
import { computeDigest } from "./digest.js";
import type { RXAStore } from "./RXAStore.js";

export class MemoryRXAStore implements RXAStore {
  private readonly blobs = new Map<string, Buffer>();

  async get(digest: string): Promise<Buffer> {
    const blob = this.blobs.get(digest);
    if (!blob) {
      throw new RegistryError(`Blob not found: ${digest}`);
    }
    return blob;
  }

  async put(data: Buffer): Promise<string> {
    const digest = computeDigest(data);
    if (!this.blobs.has(digest)) {
      this.blobs.set(digest, data);
    }
    return digest;
  }

  async has(digest: string): Promise<boolean> {
    return this.blobs.has(digest);
  }

  async delete(digest: string): Promise<void> {
    this.blobs.delete(digest);
  }

  async list(): Promise<string[]> {
    return Array.from(this.blobs.keys());
  }

  /**
   * Clear all blobs (for testing).
   */
  clear(): void {
    this.blobs.clear();
  }
}
