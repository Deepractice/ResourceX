import { homedir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import type {
  Registry,
  GitRegistryConfig,
  SearchOptions,
  PullOptions,
  PublishOptions,
} from "./types.js";
import type { RXR, RXL } from "@resourcexjs/core";
import { parseRXL, createRXM } from "@resourcexjs/core";
import { TypeHandlerChain } from "@resourcexjs/type";
import type { ResourceType, ResolvedResource } from "@resourcexjs/type";
import { createARP, type ARP } from "@resourcexjs/arp";
import { RegistryError } from "./errors.js";

const DEFAULT_GIT_CACHE = `${homedir()}/.resourcex/.git-cache`;

/**
 * Git-based registry implementation.
 * Clones a git repository and reads resources from it.
 */
export class GitRegistry implements Registry {
  private readonly url: string;
  private readonly ref: string;
  private readonly basePath: string;
  private readonly cacheDir: string;
  private readonly typeHandler: TypeHandlerChain;
  private readonly arp: ARP;

  constructor(config: GitRegistryConfig) {
    this.url = config.url;
    this.ref = config.ref ?? "main";
    this.basePath = config.basePath ?? ".resourcex";
    this.typeHandler = TypeHandlerChain.create();
    this.arp = createARP();
    this.cacheDir = this.buildCacheDir(config.url);
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
   * Ensure the repository is cloned and up to date.
   */
  private async ensureCloned(): Promise<void> {
    const gitDir = join(this.cacheDir, ".git");
    const gitArl = this.arp.parse(this.toArpUrl(gitDir));

    try {
      if (await gitArl.exists()) {
        // Already cloned, fetch and pull
        this.gitExec(`fetch origin`);
        this.gitExec(`reset --hard origin/${this.getDefaultBranch()}`);
      } else {
        // Not cloned yet, create cache dir and clone
        const cacheArl = this.arp.parse(this.toArpUrl(DEFAULT_GIT_CACHE));
        await cacheArl.mkdir();
        // Clone without --branch to use remote's default branch (main or master)
        execSync(`git clone --depth 1 ${this.url} ${this.cacheDir}`, {
          stdio: "pipe",
        });
      }
    } catch (error) {
      const err = error as Error;
      throw new RegistryError(`Git operation failed: ${err.message}`, { cause: err });
    }
  }

  /**
   * Get the default branch name (main or master).
   */
  private getDefaultBranch(): string {
    if (this.ref !== "main") {
      return this.ref; // User specified a branch
    }
    // Auto-detect: try main first, fallback to master
    try {
      this.gitExec(`rev-parse --verify origin/main`);
      return "main";
    } catch {
      try {
        this.gitExec(`rev-parse --verify origin/master`);
        return "master";
      } catch {
        return "main"; // Default to main if neither exists
      }
    }
  }

  /**
   * Execute git command in the cache directory.
   */
  private gitExec(command: string): void {
    execSync(`git -C ${this.cacheDir} ${command}`, { stdio: "pipe" });
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
    const contentPath = join(resourcePath, "content.tar.gz");
    const contentArl = this.arp.parse(this.toArpUrl(contentPath));
    const contentResource = await contentArl.resolve();
    const data = contentResource.content as Buffer;

    // Deserialize to RXR
    return this.typeHandler.deserialize(data, manifest);
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
  async pull(_locator: string, _options?: PullOptions): Promise<void> {
    throw new RegistryError("GitRegistry is read-only - use LocalRegistry.pull()");
  }

  async publish(_resource: RXR, _options: PublishOptions): Promise<void> {
    throw new RegistryError("GitRegistry is read-only - use LocalRegistry.publish()");
  }

  async link(_resource: RXR): Promise<void> {
    throw new RegistryError("GitRegistry is read-only - use LocalRegistry.link()");
  }

  async delete(_locator: string): Promise<void> {
    throw new RegistryError("GitRegistry is read-only - use LocalRegistry.delete()");
  }
}
