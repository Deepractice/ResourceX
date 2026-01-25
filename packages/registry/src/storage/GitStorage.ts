import { homedir } from "node:os";
import { join } from "node:path";
import fs from "node:fs";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import type { RXR, RXL } from "@resourcexjs/core";
import { parseRXL, createRXM, createRXA } from "@resourcexjs/core";
import { createARP, type ARP } from "@resourcexjs/arp";
import { RegistryError } from "../errors.js";
import type { Storage, SearchOptions } from "./Storage.js";

const DEFAULT_GIT_CACHE = `${homedir()}/.resourcex/.git-cache`;
const MAX_RETRIES = 2;

/**
 * GitStorage configuration.
 */
export interface GitStorageConfig {
  /**
   * Git repository URL.
   * Supports SSH (git@github.com:owner/repo.git) or HTTPS.
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
 * Check if URL is a local path (not a remote URL).
 */
function isLocalPath(url: string): boolean {
  return (
    url.startsWith("/") ||
    url.startsWith("./") ||
    url.startsWith("../") ||
    /^[a-zA-Z]:[\\/]/.test(url) // Windows absolute path
  );
}

/**
 * Git-based storage implementation.
 * Clones a git repository and reads resources from it.
 * Read-only: put() and delete() throw errors.
 */
export class GitStorage implements Storage {
  readonly type = "git";

  private readonly url: string;
  private readonly ref: string;
  private readonly basePath: string;
  private readonly cacheDir: string;
  private readonly arp: ARP;
  private readonly isLocal: boolean;

  constructor(config: GitStorageConfig) {
    this.url = config.url;
    this.ref = config.ref ?? "main";
    this.basePath = config.basePath ?? ".resourcex";
    this.arp = createARP();
    this.isLocal = isLocalPath(config.url);
    this.cacheDir = this.isLocal ? config.url : this.buildCacheDir(config.url);
  }

  /**
   * Build cache directory name from git URL.
   * git@github.com:Deepractice/Registry.git → github.com-Deepractice-Registry
   */
  private buildCacheDir(url: string): string {
    let normalized = url;
    if (url.startsWith("git@")) {
      normalized = url.slice(4).replace(":", "/");
    }
    if (normalized.endsWith(".git")) {
      normalized = normalized.slice(0, -4);
    }
    const dirName = normalized.replace(/\//g, "-");
    return join(DEFAULT_GIT_CACHE, dirName);
  }

  /**
   * Create ARP URL for a file path.
   */
  private toArpUrl(filePath: string): string {
    return `arp:binary:file://${filePath}`;
  }

  /**
   * Ensure the repository is cloned and up to date.
   */
  private async ensureCloned(): Promise<void> {
    const gitDir = join(this.cacheDir, ".git");
    const gitArl = this.arp.parse(this.toArpUrl(gitDir));

    // For local paths, just verify .git exists
    if (this.isLocal) {
      if (!(await gitArl.exists())) {
        throw new RegistryError(`Local git repository not found: ${this.url}`);
      }
      return;
    }

    // Remote URL: clone or fetch with retry
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (await gitArl.exists()) {
          // Already cloned, fetch and reset to remote
          await git.fetch({
            fs,
            http,
            dir: this.cacheDir,
            remote: "origin",
            singleBranch: true,
          });
          const branch = await this.getDefaultBranch();
          await git.checkout({
            fs,
            dir: this.cacheDir,
            ref: `origin/${branch}`,
            force: true,
          });
        } else {
          // Not cloned yet, create cache dir and clone
          const cacheArl = this.arp.parse(this.toArpUrl(DEFAULT_GIT_CACHE));
          await cacheArl.mkdir();
          await git.clone({
            fs,
            http,
            dir: this.cacheDir,
            url: this.url,
            depth: 1,
            singleBranch: true,
          });
        }
        return; // Success
      } catch (error) {
        lastError = error as Error;
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
      }
    }

    throw new RegistryError(`Git operation failed: ${lastError?.message}`, {
      cause: lastError,
    });
  }

  /**
   * Get the default branch name.
   */
  private async getDefaultBranch(): Promise<string> {
    if (this.ref !== "main") {
      return this.ref;
    }

    if (this.isLocal) {
      return this.ref;
    }

    try {
      const info = await git.getRemoteInfo({
        http,
        url: this.url,
      });
      if (info.HEAD) {
        const match = info.HEAD.match(/refs\/heads\/(.+)/);
        if (match) return match[1];
      }
      if (info.refs?.heads?.main) return "main";
      if (info.refs?.heads?.master) return "master";
    } catch {
      // Fallback to main
    }
    return "main";
  }

  /**
   * Build filesystem path for a resource in the cloned repo.
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
    await this.ensureCloned();

    const resourcePath = this.buildResourcePath(locator);

    // Check exists
    const manifestPath = join(resourcePath, "manifest.json");
    const manifestArl = this.arp.parse(this.toArpUrl(manifestPath));
    if (!(await manifestArl.exists())) {
      throw new RegistryError(`Resource not found: ${locator}`);
    }

    // Read manifest
    const manifestResource = await manifestArl.resolve();
    const manifestContent = (manifestResource.content as Buffer).toString("utf-8");
    const manifestData = JSON.parse(manifestContent);
    const manifest = createRXM(manifestData);

    // Read archive
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
    throw new RegistryError("GitStorage is read-only: put not supported");
  }

  async exists(locator: string): Promise<boolean> {
    try {
      await this.ensureCloned();
      const resourcePath = this.buildResourcePath(locator);
      const manifestPath = join(resourcePath, "manifest.json");
      const manifestArl = this.arp.parse(this.toArpUrl(manifestPath));
      return await manifestArl.exists();
    } catch {
      return false;
    }
  }

  async delete(_locator: string): Promise<void> {
    throw new RegistryError("GitStorage is read-only: delete not supported");
  }

  async search(options?: SearchOptions): Promise<RXL[]> {
    await this.ensureCloned();

    const { query, limit, offset = 0 } = options ?? {};
    const locators: RXL[] = [];

    // Scan the basePath directory
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
