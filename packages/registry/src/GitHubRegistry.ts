import { homedir } from "node:os";
import { join } from "node:path";
import type {
  Registry,
  GitHubRegistryConfig,
  UrlRegistryConfig,
  SearchOptions,
  PullOptions,
  PublishOptions,
} from "./types.js";
import { withDomainValidation } from "./middleware/DomainValidation.js";
import type { RXR, RXL } from "@resourcexjs/core";
import { parseRXL, createRXM, createRXA } from "@resourcexjs/core";
import { TypeHandlerChain } from "@resourcexjs/type";
import type { ResourceType, ResolvedResource } from "@resourcexjs/type";
import { createARP, type ARP } from "@resourcexjs/arp";
import { RegistryError } from "./errors.js";
import { gunzipSync } from "node:zlib";

const DEFAULT_GITHUB_CACHE = `${homedir()}/.resourcex/.github-cache`;

/**
 * Parse GitHub URL to extract owner, repo, and optional branch.
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string; branch: string } {
  if (!url.startsWith("https://github.com/")) {
    throw new RegistryError(
      `Invalid GitHub URL: ${url}. Expected format: https://github.com/owner/repo`
    );
  }

  const path = url.slice("https://github.com/".length);
  const parts = path.split("/");

  if (parts.length < 2) {
    throw new RegistryError(
      `Invalid GitHub URL: ${url}. Expected format: https://github.com/owner/repo`
    );
  }

  const owner = parts[0];
  const repo = parts[1];

  // Check for /tree/branch format
  let branch = "main";
  if (parts.length >= 4 && parts[2] === "tree") {
    branch = parts[3];
  }

  return { owner, repo, branch };
}

/**
 * Check if URL is a GitHub URL.
 */
export function isGitHubUrl(url: string): boolean {
  return url.startsWith("https://github.com/");
}

/**
 * GitHub-based registry implementation.
 * Uses GitHub's archive API to download tarball (faster than git clone).
 */
export class GitHubRegistry implements Registry {
  /**
   * Check if this handler can handle the given URL.
   * Matches: https://github.com/owner/repo
   */
  static canHandle(url: string): boolean {
    return isGitHubUrl(url);
  }

  /**
   * Create a GitHubRegistry for the given URL config.
   */
  static create(config: UrlRegistryConfig): Registry {
    const registry = new GitHubRegistry({
      url: config.url,
      ref: config.ref,
      basePath: config.basePath,
    });
    return config.domain ? withDomainValidation(registry, config.domain) : registry;
  }

  readonly url: string; // Public for debugging/logging
  private readonly owner: string;
  private readonly repo: string;
  private readonly ref: string;
  private readonly basePath: string;
  private readonly cacheDir: string;
  private readonly typeHandler: TypeHandlerChain;
  private readonly arp: ARP;
  private tarballDownloaded = false;

  constructor(config: GitHubRegistryConfig | { url: string; ref?: string; basePath?: string }) {
    this.url = config.url;
    const parsed = parseGitHubUrl(config.url);
    this.owner = parsed.owner;
    this.repo = parsed.repo;
    this.ref = config.ref ?? parsed.branch;
    this.basePath = config.basePath ?? ".resourcex";
    this.typeHandler = TypeHandlerChain.create();
    this.arp = createARP();
    this.cacheDir = this.buildCacheDir();
  }

  /**
   * Build cache directory name.
   * github.com-owner-repo
   */
  private buildCacheDir(): string {
    const dirName = `github.com-${this.owner}-${this.repo}`;
    return join(DEFAULT_GITHUB_CACHE, dirName);
  }

  supportType(type: ResourceType): void {
    this.typeHandler.register(type);
  }

  /**
   * Create ARP URL for a file path.
   */
  private toArpUrl(filePath: string): string {
    return `arp:binary:file://${filePath}`;
  }

  /**
   * Get tarball URL for GitHub repository.
   */
  private getTarballUrl(): string {
    return `https://github.com/${this.owner}/${this.repo}/archive/refs/heads/${this.ref}.tar.gz`;
  }

  /**
   * Ensure the tarball is downloaded and extracted.
   */
  private async ensureDownloaded(): Promise<void> {
    // Check if already downloaded in this session
    if (this.tarballDownloaded) {
      return;
    }

    // Always download fresh (can add TTL caching later)
    const tarballUrl = this.getTarballUrl();

    const response = await fetch(tarballUrl, {
      headers: {
        "User-Agent": "ResourceX/1.0",
      },
    });

    if (!response.ok) {
      throw new RegistryError(
        `Failed to download tarball from ${tarballUrl}: ${response.status} ${response.statusText}`
      );
    }

    const tarballBuffer = Buffer.from(await response.arrayBuffer());

    // Extract tarball to cache directory
    await this.extractTarball(tarballBuffer);

    this.tarballDownloaded = true;
  }

  /**
   * Extract tar.gz buffer to cache directory.
   */
  private async extractTarball(tarballBuffer: Buffer): Promise<void> {
    // Decompress gzip
    const tarBuffer = gunzipSync(tarballBuffer);

    // Parse tar format
    const files = this.parseTar(tarBuffer);

    // Create cache directory
    const cacheArl = this.arp.parse(this.toArpUrl(this.cacheDir));
    await cacheArl.mkdir();

    // Extract files
    for (const [path, content] of files) {
      // GitHub tarball has format: repo-branch/...
      // Remove the first directory component
      const parts = path.split("/");
      if (parts.length < 2) continue;

      const relativePath = parts.slice(1).join("/");
      if (!relativePath) continue;

      const fullPath = join(this.cacheDir, relativePath);

      // Create parent directories
      const parentDir = fullPath.substring(0, fullPath.lastIndexOf("/"));
      if (parentDir) {
        const parentArl = this.arp.parse(this.toArpUrl(parentDir));
        await parentArl.mkdir();
      }

      // Write file
      const fileArl = this.arp.parse(this.toArpUrl(fullPath));
      await fileArl.deposit(content);
    }
  }

  /**
   * Parse tar format buffer into file map.
   * Simple tar parser for standard POSIX tar format.
   */
  private parseTar(tarBuffer: Buffer): Map<string, Buffer> {
    const files = new Map<string, Buffer>();
    let offset = 0;

    while (offset < tarBuffer.length) {
      // Tar header is 512 bytes
      const header = tarBuffer.subarray(offset, offset + 512);

      // Check for end of archive (two empty blocks)
      if (header[0] === 0) {
        break;
      }

      // Extract filename (first 100 bytes, null-terminated)
      let filename = "";
      for (let i = 0; i < 100 && header[i] !== 0; i++) {
        filename += String.fromCharCode(header[i]);
      }

      // Check for extended header with prefix (bytes 345-500)
      let prefix = "";
      for (let i = 345; i < 500 && header[i] !== 0; i++) {
        prefix += String.fromCharCode(header[i]);
      }
      if (prefix) {
        filename = prefix + "/" + filename;
      }

      // Extract file size (bytes 124-135, octal)
      let sizeStr = "";
      for (let i = 124; i < 136 && header[i] !== 0 && header[i] !== 32; i++) {
        sizeStr += String.fromCharCode(header[i]);
      }
      const size = parseInt(sizeStr, 8) || 0;

      // Extract file type (byte 156)
      const typeFlag = header[156];

      offset += 512; // Move past header

      // Only process regular files (type '0' or '\0')
      if (typeFlag === 48 || typeFlag === 0) {
        // 48 = '0'
        if (size > 0) {
          const content = tarBuffer.subarray(offset, offset + size);
          files.set(filename, Buffer.from(content));
        }
      }

      // Move to next file (size rounded up to 512 byte blocks)
      offset += Math.ceil(size / 512) * 512;
    }

    return files;
  }

  /**
   * Build filesystem path for a resource in the cache.
   * Path structure: {cacheDir}/{basePath}/{domain}/{path}/{name}.{type}/{version}
   */
  private buildResourcePath(locator: string): string {
    const rxl = parseRXL(locator);
    const domain = rxl.domain ?? "localhost";
    const version = rxl.version ?? "latest";

    let path = join(this.cacheDir, this.basePath, domain);
    if (rxl.path) {
      path = join(path, rxl.path);
    }

    const resourceName = rxl.type ? `${rxl.name}.${rxl.type}` : rxl.name;
    return join(path, resourceName, version);
  }

  async get(locator: string): Promise<RXR> {
    await this.ensureDownloaded();

    const resourcePath = this.buildResourcePath(locator);

    // Check exists using ARP
    const manifestPath = join(resourcePath, "manifest.json");
    const manifestArl = this.arp.parse(this.toArpUrl(manifestPath));
    if (!(await manifestArl.exists())) {
      throw new RegistryError(`Resource not found: ${locator}`);
    }

    // Read manifest using ARP
    const manifestResource = await manifestArl.resolve();
    const manifestContent = (manifestResource.content as Buffer).toString("utf-8");
    const manifestData = JSON.parse(manifestContent);
    const manifest = createRXM(manifestData);

    // Read content using ARP
    const contentPath = join(resourcePath, "archive.tar.gz");
    const contentArl = this.arp.parse(this.toArpUrl(contentPath));
    const contentResource = await contentArl.resolve();
    const data = contentResource.content as Buffer;

    // Build RXR directly (unified serialization format)
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ buffer: data }),
    };
  }

  async resolve<TArgs = void, TResult = unknown>(
    locator: string
  ): Promise<ResolvedResource<TArgs, TResult>> {
    const rxr = await this.get(locator);
    return this.typeHandler.resolve<TArgs, TResult>(rxr);
  }

  async exists(locator: string): Promise<boolean> {
    try {
      await this.ensureDownloaded();
      const resourcePath = this.buildResourcePath(locator);
      const manifestPath = join(resourcePath, "manifest.json");
      const manifestArl = this.arp.parse(this.toArpUrl(manifestPath));
      return await manifestArl.exists();
    } catch {
      return false;
    }
  }

  async search(options?: SearchOptions): Promise<RXL[]> {
    await this.ensureDownloaded();

    const { query, limit, offset = 0 } = options ?? {};
    const locators: RXL[] = [];

    // Scan the basePath directory using ARP list
    const baseDir = join(this.cacheDir, this.basePath);
    try {
      const baseArl = this.arp.parse(this.toArpUrl(baseDir));
      const entries = await baseArl.list({ recursive: true, pattern: "*.json" });
      for (const entry of entries) {
        if (!entry.endsWith("manifest.json")) continue;
        const rxl = this.parseEntryToRXL(entry);
        if (rxl) locators.push(rxl);
      }
    } catch {
      // Directory doesn't exist
      return [];
    }

    // Filter by query
    let filtered = locators;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = locators.filter((rxl) => {
        const searchText =
          `${rxl.domain ?? ""} ${rxl.path ?? ""} ${rxl.name} ${rxl.type ?? ""}`.toLowerCase();
        return searchText.includes(lowerQuery);
      });
    }

    // Apply pagination
    let result = filtered.slice(offset);
    if (limit !== undefined) {
      result = result.slice(0, limit);
    }

    return result;
  }

  private parseEntryToRXL(entry: string): RXL | null {
    // Format: {domain}/{path}/{name}.{type}/{version}/manifest.json
    const dirPath = entry.replace(/[/\\]manifest\.json$/, "");
    const parts = dirPath.split(/[/\\]/);

    if (parts.length < 3) return null;

    const version = parts.pop()!;
    const nameTypePart = parts.pop()!;
    const domain = parts.shift()!;
    const path = parts.length > 0 ? parts.join("/") : undefined;

    const dotIndex = nameTypePart.lastIndexOf(".");
    let name: string;
    let type: string | undefined;

    if (dotIndex !== -1) {
      name = nameTypePart.substring(0, dotIndex);
      type = nameTypePart.substring(dotIndex + 1);
    } else {
      name = nameTypePart;
      type = undefined;
    }

    let locatorStr = domain;
    if (path) locatorStr += `/${path}`;
    locatorStr += `/${name}`;
    if (type) locatorStr += `.${type}`;
    locatorStr += `@${version}`;

    try {
      return parseRXL(locatorStr);
    } catch {
      return null;
    }
  }

  // Read-only operations - not supported
  async link(_path: string): Promise<void> {
    throw new RegistryError("GitHubRegistry is read-only - use LocalRegistry.link()");
  }

  async add(_source: string | RXR): Promise<void> {
    throw new RegistryError("GitHubRegistry is read-only - use LocalRegistry.add()");
  }

  async pull(_locator: string, _options?: PullOptions): Promise<void> {
    throw new RegistryError("GitHubRegistry is read-only - use LocalRegistry.pull()");
  }

  async publish(_source: string | RXR, _options: PublishOptions): Promise<void> {
    throw new RegistryError("GitHubRegistry is read-only - use LocalRegistry.publish()");
  }

  async delete(_locator: string): Promise<void> {
    throw new RegistryError("GitHubRegistry is read-only - use LocalRegistry.delete()");
  }
}
