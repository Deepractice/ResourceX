/**
 * FileSystemRXAStore - File system implementation of RXAStore.
 *
 * Stores blobs as files named by their digest.
 * Directory structure: {basePath}/{digest-prefix}/{digest}
 */

import { mkdir, readFile, writeFile, unlink, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { RXAStore } from "@resourcexjs/core";
import { computeDigest, RegistryError } from "@resourcexjs/core";

export class FileSystemRXAStore implements RXAStore {
  constructor(private readonly basePath: string) {}

  /**
   * Get path for a digest.
   * Uses first 2 chars as subdirectory for better filesystem performance.
   */
  private getPath(digest: string): string {
    const prefix = digest.substring(7, 9); // Skip "sha256:" prefix
    return join(this.basePath, prefix, digest);
  }

  async get(digest: string): Promise<Buffer> {
    const path = this.getPath(digest);
    try {
      return await readFile(path);
    } catch (error) {
      throw new RegistryError(`Blob not found: ${digest}`);
    }
  }

  async put(data: Buffer): Promise<string> {
    const digest = computeDigest(data);
    const path = this.getPath(digest);

    // Skip if already exists (deduplication)
    if (await this.has(digest)) {
      return digest;
    }

    // Ensure directory exists
    const dir = join(path, "..");
    await mkdir(dir, { recursive: true });

    // Write file
    await writeFile(path, data);

    return digest;
  }

  async has(digest: string): Promise<boolean> {
    const path = this.getPath(digest);
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }

  async delete(digest: string): Promise<void> {
    const path = this.getPath(digest);
    try {
      await unlink(path);
    } catch {
      // Ignore if not exists
    }
  }

  async list(): Promise<string[]> {
    const digests: string[] = [];

    try {
      const prefixes = await readdir(this.basePath);

      for (const prefix of prefixes) {
        const prefixPath = join(this.basePath, prefix);
        try {
          const files = await readdir(prefixPath);
          for (const file of files) {
            if (file.startsWith("sha256:")) {
              digests.push(file);
            }
          }
        } catch {
          // Skip if not a directory
        }
      }
    } catch {
      // Base path doesn't exist
    }

    return digests;
  }
}
