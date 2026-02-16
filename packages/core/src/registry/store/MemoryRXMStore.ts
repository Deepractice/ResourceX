/**
 * MemoryRXMStore - In-memory implementation of RXMStore.
 *
 * For testing and development only.
 */

import type { RXMSearchOptions, RXMStore, StoredRXM } from "./RXMStore.js";

export class MemoryRXMStore implements RXMStore {
  private readonly manifests = new Map<string, StoredRXM>();
  private readonly latestPointers = new Map<string, string>();

  /**
   * Build key for manifest lookup.
   */
  private buildKey(name: string, tag: string, registry?: string): string {
    return registry ? `${registry}/${name}:${tag}` : `${name}:${tag}`;
  }

  async get(name: string, tag: string, registry?: string): Promise<StoredRXM | null> {
    const key = this.buildKey(name, tag, registry);
    return this.manifests.get(key) ?? null;
  }

  async put(manifest: StoredRXM): Promise<void> {
    const key = this.buildKey(manifest.name, manifest.tag, manifest.registry);
    this.manifests.set(key, {
      ...manifest,
      updatedAt: new Date(),
    });
  }

  async has(name: string, tag: string, registry?: string): Promise<boolean> {
    const key = this.buildKey(name, tag, registry);
    return this.manifests.has(key);
  }

  async delete(name: string, tag: string, registry?: string): Promise<void> {
    const key = this.buildKey(name, tag, registry);
    this.manifests.delete(key);
  }

  async listTags(name: string, registry?: string): Promise<string[]> {
    const tags: string[] = [];
    for (const m of this.manifests.values()) {
      if (m.name === name && m.registry === registry) {
        tags.push(m.tag);
      }
    }
    return tags;
  }

  async listNames(registry?: string, query?: string): Promise<string[]> {
    const names = new Set<string>();
    for (const m of this.manifests.values()) {
      if (registry !== undefined && m.registry !== registry) continue;
      if (query && !m.name.toLowerCase().includes(query.toLowerCase())) continue;
      names.add(m.name);
    }
    return Array.from(names);
  }

  async search(options?: RXMSearchOptions): Promise<StoredRXM[]> {
    const { registry, query, limit, offset = 0 } = options ?? {};

    let results = Array.from(this.manifests.values());

    // Filter by registry
    if (registry !== undefined) {
      if (registry === null) {
        // Local only (no registry)
        results = results.filter((m) => !m.registry);
      } else {
        // Specific registry
        results = results.filter((m) => m.registry === registry);
      }
    }

    // Filter by query
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter((m) => m.name.toLowerCase().includes(lowerQuery));
    }

    // Pagination
    results = results.slice(offset);
    if (limit !== undefined) {
      results = results.slice(0, limit);
    }

    return results;
  }

  async deleteByRegistry(registry: string): Promise<void> {
    for (const [key, m] of this.manifests.entries()) {
      if (m.registry === registry) {
        this.manifests.delete(key);
      }
    }
  }

  async setLatest(name: string, tag: string, registry?: string): Promise<void> {
    const key = registry ? `${registry}/${name}` : name;
    this.latestPointers.set(key, tag);
  }

  async getLatest(name: string, registry?: string): Promise<string | null> {
    const key = registry ? `${registry}/${name}` : name;
    return this.latestPointers.get(key) ?? null;
  }

  /**
   * Clear all manifests (for testing).
   */
  clear(): void {
    this.manifests.clear();
    this.latestPointers.clear();
  }
}
