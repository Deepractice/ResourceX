import { join, dirname } from "node:path";
import { readFile, writeFile, rm, access, readdir, mkdir } from "node:fs/promises";
import type { Storage } from "./Storage.js";
import { StorageError } from "./Storage.js";

/**
 * FileSystemStorage - Local filesystem storage implementation.
 *
 * Keys are treated as relative paths within the base directory.
 * Example: key "hosted/localhost/hello.text/1.0.0/manifest.json"
 *          → basePath/hosted/localhost/hello.text/1.0.0/manifest.json
 */
export class FileSystemStorage implements Storage {
  constructor(private readonly basePath: string) {}

  async get(key: string): Promise<Buffer> {
    const filePath = join(this.basePath, key);
    try {
      return await readFile(filePath);
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") {
        throw new StorageError(`Key not found: ${key}`, "NOT_FOUND");
      }
      throw new StorageError(`Failed to read: ${key}`, "READ_ERROR");
    }
  }

  async put(key: string, data: Buffer): Promise<void> {
    const filePath = join(this.basePath, key);
    try {
      // Ensure directory exists
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, data);
    } catch {
      throw new StorageError(`Failed to write: ${key}`, "WRITE_ERROR");
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.basePath, key);
    try {
      await rm(filePath, { recursive: true, force: true });
    } catch {
      throw new StorageError(`Failed to delete: ${key}`, "DELETE_ERROR");
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = join(this.basePath, key);
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix?: string): Promise<string[]> {
    const searchPath = prefix ? join(this.basePath, prefix) : this.basePath;
    const results: string[] = [];

    try {
      await this.listRecursive(searchPath, prefix ?? "", results);
    } catch {
      // Directory doesn't exist
      return [];
    }

    return results;
  }

  private async listRecursive(dirPath: string, prefix: string, results: string[]): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await this.listRecursive(join(dirPath, entry.name), relativePath, results);
      } else {
        results.push(relativePath);
      }
    }
  }
}
