/**
 * CASRegistry - Content-Addressable Storage Registry
 *
 * Combines RXAStore (blobs) and RXMStore (manifests) for efficient
 * resource storage with deduplication.
 *
 * Replaces LocalRegistry and MirrorRegistry.
 * Uses RXM.definition.registry field to distinguish local (undefined) from cached (has registry).
 */

import type { RXI, RXM, RXR } from "~/model/index.js";
import { archive, extract, format, resource } from "~/model/index.js";
import { RegistryError } from "../errors.js";
import type { RXAStore } from "../store/RXAStore.js";
import type { RXMStore, StoredRXM } from "../store/RXMStore.js";
import type { Registry, SearchOptions } from "./Registry.js";

export class CASRegistry implements Registry {
  constructor(
    private readonly rxaStore: RXAStore,
    private readonly rxmStore: RXMStore
  ) {}

  private async resolveTag(name: string, tag: string, registry?: string): Promise<string> {
    if (tag === "latest") {
      // 1. Try pointer file
      const resolved = await this.rxmStore.getLatest(name, registry);
      if (resolved) return resolved;

      // 2. Backward compat: pick last available tag (most recently added)
      const tags = await this.rxmStore.listTags(name, registry);
      if (tags.length > 0) return tags[tags.length - 1];
    }
    return tag;
  }

  async get(rxi: RXI): Promise<RXR> {
    const tag = await this.resolveTag(rxi.name, rxi.tag ?? "latest", rxi.registry);

    // 1. Get manifest
    const storedRxm = await this.rxmStore.get(rxi.name, tag, rxi.registry);
    if (!storedRxm) {
      throw new RegistryError(`Resource not found: ${format(rxi)}`);
    }

    // 2. Get all file contents from RXAStore
    const files: Record<string, Buffer> = {};
    for (const [filename, digest] of Object.entries(storedRxm.files)) {
      files[filename] = await this.rxaStore.get(digest);
    }

    // 3. Build RXM from StoredRXM
    const rxm: RXM = {
      definition: {
        registry: storedRxm.registry,
        path: storedRxm.path,
        name: storedRxm.name,
        type: storedRxm.type,
        tag: storedRxm.tag,
        description: storedRxm.description,
        author: storedRxm.author,
        license: storedRxm.license,
        keywords: storedRxm.keywords,
        repository: storedRxm.repository,
      },
      archive: {},
      source: {},
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
      registry: rxr.manifest.definition.registry,
      path: rxr.manifest.definition.path,
      name: rxr.manifest.definition.name,
      type: rxr.manifest.definition.type,
      tag: rxr.manifest.definition.tag,
      description: rxr.manifest.definition.description,
      author: rxr.manifest.definition.author,
      license: rxr.manifest.definition.license,
      keywords: rxr.manifest.definition.keywords,
      repository: rxr.manifest.definition.repository,
      files: fileDigests,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.rxmStore.put(storedRxm);

    // Update "latest" pointer
    await this.rxmStore.setLatest(
      rxr.manifest.definition.name,
      rxr.manifest.definition.tag,
      rxr.manifest.definition.registry
    );
  }

  async has(rxi: RXI): Promise<boolean> {
    const tag = await this.resolveTag(rxi.name, rxi.tag ?? "latest", rxi.registry);
    return this.rxmStore.has(rxi.name, tag, rxi.registry);
  }

  async remove(rxi: RXI): Promise<void> {
    const tag = rxi.tag ?? "latest";
    await this.rxmStore.delete(rxi.name, tag, rxi.registry);
    // Note: Blobs are not deleted here. Use GC to clean orphaned blobs.
  }

  async list(options?: SearchOptions): Promise<RXI[]> {
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
