/**
 * CASRegistry - Content-Addressable Storage Registry
 *
 * Combines RXAStore (blobs) and RXMStore (manifests) for efficient
 * resource storage with deduplication.
 *
 * Replaces LocalRegistry and MirrorRegistry.
 * Uses RXM.registry field to distinguish local (undefined) from cached (has registry).
 */

import type { RXL, RXR, RXM } from "~/model/index.js";
import { format, resource, archive, extract } from "~/model/index.js";
import type { Registry, SearchOptions } from "./Registry.js";
import type { RXAStore } from "../store/RXAStore.js";
import type { RXMStore, StoredRXM } from "../store/RXMStore.js";
import { RegistryError } from "../errors.js";

export class CASRegistry implements Registry {
  constructor(
    private readonly rxaStore: RXAStore,
    private readonly rxmStore: RXMStore
  ) {}

  async get(rxl: RXL): Promise<RXR> {
    const tag = rxl.tag ?? "latest";

    // 1. Get manifest
    const storedRxm = await this.rxmStore.get(rxl.name, tag, rxl.registry);
    if (!storedRxm) {
      throw new RegistryError(`Resource not found: ${format(rxl)}`);
    }

    // 2. Get all file contents from RXAStore
    const files: Record<string, Buffer> = {};
    for (const [filename, digest] of Object.entries(storedRxm.files)) {
      files[filename] = await this.rxaStore.get(digest);
    }

    // 3. Build RXM (without digest mappings for external interface)
    const rxm: RXM = {
      registry: storedRxm.registry,
      path: storedRxm.path,
      name: storedRxm.name,
      type: storedRxm.type,
      tag: storedRxm.tag,
      files: Object.keys(storedRxm.files),
    };

    // 4. Create RXA from files
    const rxa = await archive(files);

    return resource(rxm, rxa);
  }

  async put(rxr: RXR): Promise<void> {
    // 1. Extract files from archive
    const files = await extract(rxr.archive);

    // 2. Store each file in RXAStore, collect digests
    const fileDigests: Record<string, string> = {};
    for (const [filename, content] of Object.entries(files)) {
      const digest = await this.rxaStore.put(content);
      fileDigests[filename] = digest;
    }

    // 3. Build and store manifest
    const storedRxm: StoredRXM = {
      registry: rxr.manifest.registry,
      path: rxr.manifest.path,
      name: rxr.manifest.name,
      type: rxr.manifest.type,
      tag: rxr.manifest.tag,
      files: fileDigests,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.rxmStore.put(storedRxm);
  }

  async has(rxl: RXL): Promise<boolean> {
    const tag = rxl.tag ?? "latest";
    return this.rxmStore.has(rxl.name, tag, rxl.registry);
  }

  async remove(rxl: RXL): Promise<void> {
    const tag = rxl.tag ?? "latest";
    await this.rxmStore.delete(rxl.name, tag, rxl.registry);
    // Note: Blobs are not deleted here. Use GC to clean orphaned blobs.
  }

  async list(options?: SearchOptions): Promise<RXL[]> {
    const { query, limit, offset = 0 } = options ?? {};

    const manifests = await this.rxmStore.search({
      query,
      limit,
      offset,
    });

    return manifests.map((m) => ({
      registry: m.registry,
      path: m.path,
      name: m.name,
      tag: m.tag,
    }));
  }

  // ===== CAS-specific methods =====

  /**
   * Clear cached resources (resources with registry).
   * @param registry - If provided, only clear resources from this registry
   */
  async clearCache(registry?: string): Promise<void> {
    if (registry) {
      await this.rxmStore.deleteByRegistry(registry);
    } else {
      // Clear all cached (non-local) resources
      const cached = await this.rxmStore.search({ registry: undefined });
      for (const m of cached) {
        if (m.registry) {
          await this.rxmStore.delete(m.name, m.tag, m.registry);
        }
      }
    }
  }

  /**
   * Run garbage collection to remove orphaned blobs.
   */
  async gc(): Promise<number> {
    // 1. Collect all referenced digests
    const referenced = new Set<string>();
    const allManifests = await this.rxmStore.search({});
    for (const m of allManifests) {
      for (const digest of Object.values(m.files)) {
        referenced.add(digest);
      }
    }

    // 2. Delete unreferenced blobs
    let deleted = 0;
    const allDigests = await this.rxaStore.list();
    for (const digest of allDigests) {
      if (!referenced.has(digest)) {
        await this.rxaStore.delete(digest);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Check if a digest exists in the blob store.
   * Useful for "instant upload" - skip uploading if server already has it.
   */
  async hasBlob(digest: string): Promise<boolean> {
    return this.rxaStore.has(digest);
  }

  /**
   * Get blob by digest.
   */
  async getBlob(digest: string): Promise<Buffer> {
    return this.rxaStore.get(digest);
  }

  /**
   * Put blob directly (for pull optimization).
   */
  async putBlob(data: Buffer): Promise<string> {
    return this.rxaStore.put(data);
  }
}
