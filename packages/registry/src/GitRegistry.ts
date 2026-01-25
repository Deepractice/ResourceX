import { homedir } from "node:os";
import { join } from "node:path";
import fs from "node:fs";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import type {
  Registry,
  GitRegistryConfig,
  UrlRegistryConfig,
  SearchOptions,
  PullOptions,
  PublishOptions,
} from "./types.js";
import { withDomainValidation } from "./middleware/DomainValidation.js";
import type { RXR, RXL } from "@resourcexjs/core";
import { parseRXL, createRXM, createRXA } from "@resourcexjs/core";
import { TypeHandlerChain } from "@resourcexjs/type";
import type { BundledType, ResolvedResource } from "@resourcexjs/type";
import { createARP, type ARP } from "@resourcexjs/arp";
import { RegistryError } from "./errors.js";

const DEFAULT_GIT_CACHE = `${homedir()}/.resourcex/.git-cache`;

/**
 * Git-based registry implementation.
 * Clones a git repository and reads resources from it.
 */
const MAX_RETRIES = 2;

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

export class GitRegistry implements Registry {
  /**
   * Check if this handler can handle the given URL.
   * Matches: git@... or *.git (SSH or git protocol)
   */
  static canHandle(url: string): boolean {
    return url.startsWith("git@") || url.endsWith(".git");
  }

  /**
   * Create a GitRegistry for the given URL config.
   */
  static create(config: UrlRegistryConfig): Registry {
    const registry = new GitRegistry({
      type: "git",
      url: config.url,
      ref: config.ref,
      basePath: config.basePath,
      domain: config.domain,
    });
    return config.domain ? withDomainValidation(registry, config.domain) : registry;
  }

  private readonly url: string;
  private readonly ref: string;
  private readonly basePath: string;
  private readonly cacheDir: string;
  private readonly typeHandler: TypeHandlerChain;
  private readonly arp: ARP;
  private readonly isLocal: boolean;

  constructor(config: GitRegistryConfig) {
    this.url = config.url;
    this.ref = config.ref ?? "main";
    this.basePath = config.basePath ?? ".resourcex";
    this.typeHandler = TypeHandlerChain.create();
    this.arp = createARP();
    this.isLocal = isLocalPath(config.url);
    this.cacheDir = this.isLocal ? config.url : this.buildCacheDir(config.url);
  }

  /**
   * Build cache directory name from git URL.
   * git@github.com:Deepractice/Registry.git → github.com-Deepractice-Registry
   */
  private buildCacheDir(url: string): string {
    // Handle SSH format: git@github.com:owner/repo.git
    let normalized = url;
    if (url.startsWith("git@")) {
      normalized = url.slice(4).replace(":", "/");
    }
    // Remove .git suffix
    if (normalized.endsWith(".git")) {
      normalized = normalized.slice(0, -4);
    }
    // Replace / with -
    const dirName = normalized.replace(/\//g, "-");
    return join(DEFAULT_GIT_CACHE, dirName);
  }

  supportType(type: BundledType): void {
    this.typeHandler.register(type);
  }

  /**
   * Create ARP URL for a file path.
   */
  private toArpUrl(filePath: string): string {
    return `arp:binary:file://${filePath}`;
  }

  /**
   * Ensure the repository is cloned and up to date.
   * For local paths, just verify the .git directory exists.
   * For remote URLs, includes retry logic for transient network errors.
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

        // Retry on transient errors
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
   * Get the default branch name (main or master).
   */
  private async getDefaultBranch(): Promise<string> {
    if (this.ref !== "main") {
      return this.ref; // User specified a branch
    }

    // For local paths, just return the configured ref
    if (this.isLocal) {
      return this.ref;
    }

    // Auto-detect from remote info
    try {
      const info = await git.getRemoteInfo({
        http,
        url: this.url,
      });
      // HEAD usually points to the default branch
      if (info.HEAD) {
        const match = info.HEAD.match(/refs\/heads\/(.+)/);
        if (match) return match[1];
      }
      // Check if refs/heads/main exists
      if (info.refs?.heads?.main) return "main";
      if (info.refs?.heads?.master) return "master";
    } catch {
      // Fallback to main
    }
    return "main";
  }

  /**
   * Build filesystem path for a resource in the cloned repo.
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
    await this.ensureCloned();

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

    // Domain validation is handled by middleware (DomainValidation)
    // No longer done here - allows flexibility in how validation is configured

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
      await this.ensureCloned();
      const resourcePath = this.buildResourcePath(locator);
      const manifestPath = join(resourcePath, "manifest.json");
      const manifestArl = this.arp.parse(this.toArpUrl(manifestPath));
      return await manifestArl.exists();
    } catch {
      return false;
    }
  }

  async search(options?: SearchOptions): Promise<RXL[]> {
    await this.ensureCloned();

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
    throw new RegistryError("GitRegistry is read-only - use LocalRegistry.link()");
  }

  async add(_source: string | RXR): Promise<void> {
    throw new RegistryError("GitRegistry is read-only - use LocalRegistry.add()");
  }

  async pull(_locator: string, _options?: PullOptions): Promise<void> {
    throw new RegistryError("GitRegistry is read-only - use LocalRegistry.pull()");
  }

  async publish(_source: string | RXR, _options: PublishOptions): Promise<void> {
    throw new RegistryError("GitRegistry is read-only - use LocalRegistry.publish()");
  }

  async delete(_locator: string): Promise<void> {
    throw new RegistryError("GitRegistry is read-only - use LocalRegistry.delete()");
  }
}
