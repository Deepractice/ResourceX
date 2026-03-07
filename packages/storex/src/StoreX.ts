/**
 * StoreX - Storage API for ResourceX applications.
 *
 * Wraps CASRegistry to provide application-level storage operations.
 * Applications use StoreX instead of importing @resourcexjs/core directly.
 *
 * StoreX is for applications (Console, App gateway).
 * ResourceX is for AI agents (add, resolve, ingest, push, pull).
 */

import type { RXAStore, RXM, RXMStore, RXR, StoredRXM } from "@resourcexjs/core";
import { archive, CASRegistry, manifest, parse, resource } from "@resourcexjs/core";

/**
 * File metadata returned by list operations.
 */
export interface ResourceInfo {
  readonly name: string;
  readonly tag: string;
  readonly type: string;
  readonly description?: string;
  readonly digest?: string;
  readonly files: string[];
  readonly updatedAt?: Date;
}

/**
 * StoreX configuration.
 */
export interface StoreXConfig {
  /** Blob storage backend (R2, filesystem, memory, etc.) */
  blobStore: RXAStore;
  /** Manifest storage backend (SQLite, D1, memory, etc.) */
  manifestStore: RXMStore;
}

/**
 * StoreX - Application-level storage API.
 */
export class StoreX {
  private readonly cas: CASRegistry;

  constructor(config: StoreXConfig) {
    this.cas = new CASRegistry(config.blobStore, config.manifestStore);
  }

  /**
   * List all resources, optionally filtered by query.
   */
  async list(query?: string): Promise<ResourceInfo[]> {
    const results = await this.cas.list({ query });
    const infos: ResourceInfo[] = [];
    for (const rxi of results) {
      const m = await this.cas.getStoredManifest(rxi);
      if (m) {
        infos.push({
          name: m.name,
          tag: m.tag,
          type: m.type,
          description: m.description,
          digest: m.digest,
          files: Object.keys(m.files),
          updatedAt: m.updatedAt,
        });
      }
    }
    return infos;
  }

  /**
   * Get a single file from a resource by filename.
   *
   * @param locator - Resource locator string (e.g. "my-resource:latest")
   * @param file - File path within the resource
   * @returns File content as Buffer, or null if not found
   */
  async getFile(locator: string, file: string): Promise<Buffer | null> {
    const rxi = parse(locator);
    return this.cas.getFile(rxi, file);
  }

  /**
   * Append files to an existing resource without re-archiving.
   *
   * @param locator - Resource locator string
   * @param files - Files to append: relative path → content
   * @returns Updated manifest metadata
   */
  async append(locator: string, files: Record<string, Buffer>): Promise<StoredRXM> {
    const rxi = parse(locator);
    return this.cas.append(rxi, files);
  }

  /**
   * Get resource manifest metadata without fetching file contents.
   *
   * @param locator - Resource locator string
   * @returns Stored manifest or null if not found
   */
  async getManifest(locator: string): Promise<StoredRXM | null> {
    const rxi = parse(locator);
    return this.cas.getStoredManifest(rxi);
  }

  /**
   * Check if a resource exists.
   *
   * @param locator - Resource locator string
   */
  async has(locator: string): Promise<boolean> {
    const rxi = parse(locator);
    return this.cas.has(rxi);
  }

  /**
   * Create a new resource from files.
   *
   * @param opts.name - Resource name
   * @param opts.tag - Version tag (default: "latest")
   * @param opts.type - Resource type (default: "object" — pure storage, not for AI resolution)
   * @param opts.description - Optional description
   * @param opts.files - Files: relative path → content
   */
  async create(opts: {
    name: string;
    files: Record<string, Buffer>;
    tag?: string;
    type?: string;
    description?: string;
  }): Promise<RXM> {
    const rxm = manifest({
      name: opts.name,
      type: opts.type ?? "object",
      tag: opts.tag ?? "latest",
      description: opts.description,
    });
    const rxa = await archive(opts.files);
    return this.cas.put(resource(rxm, rxa));
  }

  /**
   * Store a complete resource (RXR).
   * Used for initial resource creation from in-memory files.
   */
  async put(rxr: RXR): Promise<RXM> {
    return this.cas.put(rxr);
  }

  /**
   * Remove a resource.
   *
   * @param locator - Resource locator string
   */
  async remove(locator: string): Promise<void> {
    const rxi = parse(locator);
    return this.cas.remove(rxi);
  }
}

/**
 * Create a StoreX instance.
 *
 * @example
 * ```typescript
 * import { createStoreX } from "storexjs";
 *
 * const store = createStoreX({ registry: casRegistry });
 * const resources = await store.list();
 * const file = await store.getFile("my-resource", "image.png");
 * await store.append("my-resource", { "new-file.png": buffer });
 * ```
 */
export function createStoreX(config: StoreXConfig): StoreX {
  return new StoreX(config);
}
