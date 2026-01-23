import { homedir } from "node:os";
import { join } from "node:path";
import { readFile, stat, readdir, mkdir } from "node:fs/promises";
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
  private readonly trustedDomain?: string;

  constructor(config: GitRegistryConfig) {
    this.url = config.url;
    this.ref = config.ref ?? "main";
    this.basePath = config.basePath ?? ".resourcex";
    this.typeHandler = TypeHandlerChain.create();
    this.trustedDomain = config.domain;

    // Security check: remote URL requires domain binding
    if (this.isRemoteUrl(config.url) && !config.domain) {
      throw new RegistryError(
        `Remote git registry requires a trusted domain.\n\n` +
          `Either:\n` +
          `1. Use discoverRegistry("your-domain.com") to auto-bind domain\n` +
          `2. Explicitly set domain: createRegistry({ type: "git", url: "...", domain: "your-domain.com" })\n\n` +
          `This ensures resources from untrusted sources cannot impersonate your domain.`
      );
    }

    this.cacheDir = this.buildCacheDir(config.url);
  }

  /**
   * Check if URL is a remote git URL (not local path).
   */
  private isRemoteUrl(url: string): boolean {
    return url.startsWith("git@") || url.startsWith("https://") || url.startsWith("http://");
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
   * Ensure the repository is cloned and up to date.
   */
  private async ensureCloned(): Promise<void> {
    const gitDir = join(this.cacheDir, ".git");

    try {
      await stat(gitDir);
      // Already cloned, fetch and pull
      this.gitExec(`fetch origin`);
      this.gitExec(`reset --hard origin/${this.getDefaultBranch()}`);
    } catch {
      // Not cloned yet, clone it
      await mkdir(DEFAULT_GIT_CACHE, { recursive: true });
      // Clone without --branch to use remote's default branch (main or master)
      execSync(`git clone --depth 1 ${this.url} ${this.cacheDir}`, {
        stdio: "pipe",
      });
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

    // Check exists
    const manifestPath = join(resourcePath, "manifest.json");
    try {
      await stat(manifestPath);
    } catch {
      throw new RegistryError(`Resource not found: ${locator}`);
    }

    // Read manifest
    const manifestContent = await readFile(manifestPath, "utf-8");
    const manifestData = JSON.parse(manifestContent);
    const manifest = createRXM(manifestData);

    // Validate domain if trustedDomain is set
    if (this.trustedDomain && manifest.domain !== this.trustedDomain) {
      throw new RegistryError(
        `Untrusted domain: resource claims "${manifest.domain}" but registry only trusts "${this.trustedDomain}"`
      );
    }

    // Read content
    const contentPath = join(resourcePath, "content.tar.gz");
    const data = await readFile(contentPath);

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
      await stat(manifestPath);
      return true;
    } catch {
      return false;
    }
  }

  async search(options?: SearchOptions): Promise<RXL[]> {
    await this.ensureCloned();

    const { query, limit, offset = 0 } = options ?? {};
    const locators: RXL[] = [];

    // Scan the basePath directory
    const baseDir = join(this.cacheDir, this.basePath);
    try {
      const entries = await this.listRecursive(baseDir);
      for (const entry of entries) {
        if (!entry.endsWith("manifest.json")) continue;
        const relativePath = entry.slice(baseDir.length + 1);
        const rxl = this.parseEntryToRXL(relativePath);
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

  private async listRecursive(dir: string): Promise<string[]> {
    const results: string[] = [];
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          const subEntries = await this.listRecursive(fullPath);
          results.push(...subEntries);
        } else {
          results.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist
    }
    return results;
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
