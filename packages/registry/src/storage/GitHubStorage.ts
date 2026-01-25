import { homedir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import type { RXR, RXL } from "@resourcexjs/core";
import { parseRXL, createRXM, createRXA } from "@resourcexjs/core";
import { createARP, type ARP } from "@resourcexjs/arp";
import { RegistryError } from "../errors.js";
import type { Storage, SearchOptions } from "./Storage.js";

const DEFAULT_GITHUB_CACHE = `${homedir()}/.resourcex/.github-cache`;

/**
 * GitHubStorage configuration.
 */
export interface GitHubStorageConfig {
  /**
   * GitHub repository URL.
   * Format: https://github.com/owner/repo
   */
  url: string;

  /**
   * Git ref (branch, tag, or commit). Default: "main"
   */
  ref?: string;

  /**
   * Base path in repo for resources. Default: ".resourcex"
   */
  basePath?: string;
}

/**
 * Parse GitHub URL to extract owner, repo, and optional branch.
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
 * GitHub-based storage implementation.
 * Uses GitHub's archive API to download tarball (faster than git clone).
 * Read-only: put() and delete() throw errors.
 */
export class GitHubStorage implements Storage {
  readonly type = "github";
  readonly url: string;

  private readonly owner: string;
  private readonly repo: string;
  private readonly ref: string;
  private readonly basePath: string;
  private readonly cacheDir: string;
  private readonly arp: ARP;
  private tarballDownloaded = false;

  constructor(config: GitHubStorageConfig) {
    this.url = config.url;
    const parsed = parseGitHubUrl(config.url);
    this.owner = parsed.owner;
    this.repo = parsed.repo;
    this.ref = config.ref ?? parsed.branch;
    this.basePath = config.basePath ?? ".resourcex";
    this.arp = createARP();
    this.cacheDir = this.buildCacheDir();
  }

  private buildCacheDir(): string {
    const dirName = `github.com-${this.owner}-${this.repo}`;
    return join(DEFAULT_GITHUB_CACHE, dirName);
  }

  private toArpUrl(filePath: string): string {
    return `arp:binary:file://${filePath}`;
  }

  private getTarballUrl(): string {
    return `https://github.com/${this.owner}/${this.repo}/archive/refs/heads/${this.ref}.tar.gz`;
  }

  private async ensureDownloaded(): Promise<void> {
    if (this.tarballDownloaded) {
      return;
    }

    const tarballUrl = this.getTarballUrl();
    const response = await fetch(tarballUrl, {
      headers: { "User-Agent": "ResourceX/1.0" },
    });

    if (!response.ok) {
      throw new RegistryError(
        `Failed to download tarball from ${tarballUrl}: ${response.status} ${response.statusText}`
      );
    }

    const tarballBuffer = Buffer.from(await response.arrayBuffer());
    await this.extractTarball(tarballBuffer);
    this.tarballDownloaded = true;
  }

  private async extractTarball(tarballBuffer: Buffer): Promise<void> {
    const tarBuffer = gunzipSync(tarballBuffer);
    const files = this.parseTar(tarBuffer);

    const cacheArl = this.arp.parse(this.toArpUrl(this.cacheDir));
    await cacheArl.mkdir();

    for (const [path, content] of files) {
      const parts = path.split("/");
      if (parts.length < 2) continue;

      const relativePath = parts.slice(1).join("/");
      if (!relativePath) continue;

      const fullPath = join(this.cacheDir, relativePath);
      const parentDir = fullPath.substring(0, fullPath.lastIndexOf("/"));

      if (parentDir) {
        const parentArl = this.arp.parse(this.toArpUrl(parentDir));
        await parentArl.mkdir();
      }

      const fileArl = this.arp.parse(this.toArpUrl(fullPath));
      await fileArl.deposit(content);
    }
  }

  private parseTar(tarBuffer: Buffer): Map<string, Buffer> {
    const files = new Map<string, Buffer>();
    let offset = 0;

    while (offset < tarBuffer.length) {
      const header = tarBuffer.subarray(offset, offset + 512);

      if (header[0] === 0) {
        break;
      }

      let filename = "";
      for (let i = 0; i < 100 && header[i] !== 0; i++) {
        filename += String.fromCharCode(header[i]);
      }

      let prefix = "";
      for (let i = 345; i < 500 && header[i] !== 0; i++) {
        prefix += String.fromCharCode(header[i]);
      }
      if (prefix) {
        filename = prefix + "/" + filename;
      }

      let sizeStr = "";
      for (let i = 124; i < 136 && header[i] !== 0 && header[i] !== 32; i++) {
        sizeStr += String.fromCharCode(header[i]);
      }
      const size = parseInt(sizeStr, 8) || 0;

      const typeFlag = header[156];
      offset += 512;

      if (typeFlag === 48 || typeFlag === 0) {
        if (size > 0) {
          const content = tarBuffer.subarray(offset, offset + size);
          files.set(filename, Buffer.from(content));
        }
      }

      offset += Math.ceil(size / 512) * 512;
    }

    return files;
  }

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
    const manifestPath = join(resourcePath, "manifest.json");
    const manifestArl = this.arp.parse(this.toArpUrl(manifestPath));

    if (!(await manifestArl.exists())) {
      throw new RegistryError(`Resource not found: ${locator}`);
    }

    const manifestResource = await manifestArl.resolve();
    const manifestContent = (manifestResource.content as Buffer).toString("utf-8");
    const manifestData = JSON.parse(manifestContent);
    const manifest = createRXM(manifestData);

    const archivePath = join(resourcePath, "archive.tar.gz");
    const archiveArl = this.arp.parse(this.toArpUrl(archivePath));
    const archiveResource = await archiveArl.resolve();
    const data = archiveResource.content as Buffer;

    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ buffer: data }),
    };
  }

  async put(_rxr: RXR): Promise<void> {
    throw new RegistryError("GitHubStorage is read-only: put not supported");
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

  async delete(_locator: string): Promise<void> {
    throw new RegistryError("GitHubStorage is read-only: delete not supported");
  }

  async search(options?: SearchOptions): Promise<RXL[]> {
    await this.ensureDownloaded();

    const { query, limit, offset = 0 } = options ?? {};
    const locators: RXL[] = [];

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
      return [];
    }

    let filtered = locators;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = locators.filter((rxl) => {
        const searchText =
          `${rxl.domain ?? ""} ${rxl.path ?? ""} ${rxl.name} ${rxl.type ?? ""}`.toLowerCase();
        return searchText.includes(lowerQuery);
      });
    }

    let result = filtered.slice(offset);
    if (limit !== undefined) {
      result = result.slice(0, limit);
    }

    return result;
  }

  private parseEntryToRXL(entry: string): RXL | null {
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
}
