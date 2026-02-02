/**
 * FileSystemRXMStore - File system implementation of RXMStore.
 *
 * Stores manifests as JSON files.
 * Directory structure: {basePath}/{registry|_local}/{name}/{tag}.json
 */

import { mkdir, readFile, writeFile, unlink, readdir, stat, rm } from "node:fs/promises";
import { join } from "node:path";
import type { RXMStore, StoredRXM, RXMSearchOptions } from "@resourcexjs/core";

const LOCAL_DIR = "_local";

export class FileSystemRXMStore implements RXMStore {
  constructor(private readonly basePath: string) {}

  /**
   * Get directory path for a manifest.
   */
  private getDir(name: string, registry?: string): string {
    const registryDir = registry ?? LOCAL_DIR;
    return join(this.basePath, registryDir, name);
  }

  /**
   * Get file path for a manifest.
   */
  private getPath(name: string, tag: string, registry?: string): string {
    return join(this.getDir(name, registry), `${tag}.json`);
  }

  async get(name: string, tag: string, registry?: string): Promise<StoredRXM | null> {
    const path = this.getPath(name, tag, registry);
    try {
      const data = await readFile(path, "utf-8");
      return JSON.parse(data) as StoredRXM;
    } catch {
      return null;
    }
  }

  async put(manifest: StoredRXM): Promise<void> {
    const path = this.getPath(manifest.name, manifest.tag, manifest.registry);
    const dir = join(path, "..");

    await mkdir(dir, { recursive: true });
    await writeFile(path, JSON.stringify(manifest, null, 2), "utf-8");
  }

  async has(name: string, tag: string, registry?: string): Promise<boolean> {
    const path = this.getPath(name, tag, registry);
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }

  async delete(name: string, tag: string, registry?: string): Promise<void> {
    const path = this.getPath(name, tag, registry);
    try {
      await unlink(path);
    } catch {
      // Ignore if not exists
    }
  }

  async listTags(name: string, registry?: string): Promise<string[]> {
    const dir = this.getDir(name, registry);
    const tags: string[] = [];

    try {
      const files = await readdir(dir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          tags.push(file.replace(".json", ""));
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return tags;
  }

  async listNames(registry?: string, query?: string): Promise<string[]> {
    const registryDir = registry ?? LOCAL_DIR;
    const basePath = join(this.basePath, registryDir);
    const names: string[] = [];

    try {
      const entries = await readdir(basePath);
      for (const entry of entries) {
        const entryPath = join(basePath, entry);
        try {
          const entryStat = await stat(entryPath);
          if (entryStat.isDirectory()) {
            if (!query || entry.toLowerCase().includes(query.toLowerCase())) {
              names.push(entry);
            }
          }
        } catch {
          // Skip
        }
      }
    } catch {
      // Base path doesn't exist
    }

    return names;
  }

  async search(options?: RXMSearchOptions): Promise<StoredRXM[]> {
    const { registry, query, limit, offset = 0 } = options ?? {};
    const results: StoredRXM[] = [];

    // Determine which registry directories to scan
    let registryDirs: string[] = [];

    if (registry === null) {
      // Local only
      registryDirs = [LOCAL_DIR];
    } else if (registry !== undefined) {
      // Specific registry
      registryDirs = [registry];
    } else {
      // All registries
      try {
        registryDirs = await readdir(this.basePath);
      } catch {
        return [];
      }
    }

    // Scan each registry directory
    for (const regDir of registryDirs) {
      const regPath = join(this.basePath, regDir);

      try {
        const names = await readdir(regPath);

        for (const name of names) {
          // Filter by query
          if (query && !name.toLowerCase().includes(query.toLowerCase())) {
            continue;
          }

          const namePath = join(regPath, name);
          try {
            const files = await readdir(namePath);

            for (const file of files) {
              if (file.endsWith(".json")) {
                const filePath = join(namePath, file);
                const data = await readFile(filePath, "utf-8");
                const manifest = JSON.parse(data) as StoredRXM;
                results.push(manifest);
              }
            }
          } catch {
            // Skip if not a directory
          }
        }
      } catch {
        // Skip if registry dir doesn't exist
      }
    }

    // Apply pagination
    let paginated = results.slice(offset);
    if (limit !== undefined) {
      paginated = paginated.slice(0, limit);
    }

    return paginated;
  }

  async deleteByRegistry(registry: string): Promise<void> {
    const regPath = join(this.basePath, registry);
    try {
      await rm(regPath, { recursive: true });
    } catch {
      // Ignore if not exists
    }
  }
}
