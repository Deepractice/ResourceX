import { ResourceXError } from "~/errors.js";
import type { RXS } from "~/model/index.js";
import type { SourceLoader } from "./types.js";

/**
 * Parse a GitHub URL into its components.
 *
 * Supports:
 * - https://github.com/owner/repo/tree/branch/path/to/dir
 */
function parseGitHubUrl(url: string): {
  owner: string;
  repo: string;
  branch: string;
  path: string;
} | null {
  const match = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    branch: match[3],
    path: match[4].replace(/\/$/, ""),
  };
}

interface GitHubContentsItem {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
  size: number;
}

/**
 * GitHubSourceLoader - Loads raw files from a GitHub directory into RXS.
 *
 * Fetches files via the GitHub Contents API (no authentication required
 * for public repositories).
 */
export class GitHubSourceLoader implements SourceLoader {
  canLoad(source: string): boolean {
    return parseGitHubUrl(source) !== null;
  }

  async load(source: string): Promise<RXS> {
    const parsed = parseGitHubUrl(source);
    if (!parsed) {
      throw new ResourceXError(`Not a valid GitHub URL: ${source}`);
    }

    const files = await this.fetchDirectory(
      parsed.owner,
      parsed.repo,
      parsed.branch,
      parsed.path,
      parsed.path
    );

    if (Object.keys(files).length === 0) {
      throw new ResourceXError(`No files found at GitHub path: ${source}`);
    }

    return { source, files };
  }

  /**
   * Recursively fetch all files from a GitHub directory.
   */
  private async fetchDirectory(
    owner: string,
    repo: string,
    branch: string,
    dirPath: string,
    basePath: string
  ): Promise<Record<string, Buffer>> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ResourceX",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new ResourceXError(`GitHub path not found: ${dirPath}`);
      }
      throw new ResourceXError(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const items: GitHubContentsItem[] = (await response.json()) as GitHubContentsItem[];
    const files: Record<string, Buffer> = {};

    for (const item of items) {
      // Relative path from the base directory
      const relativePath = item.path.startsWith(`${basePath}/`)
        ? item.path.slice(basePath.length + 1)
        : item.name;

      if (item.type === "file" && item.download_url) {
        const content = await this.fetchFile(item.download_url);
        files[relativePath] = content;
      } else if (item.type === "dir") {
        const subFiles = await this.fetchDirectory(owner, repo, branch, item.path, basePath);
        Object.assign(files, subFiles);
      }
    }

    return files;
  }

  /**
   * Fetch a single file's content.
   */
  private async fetchFile(downloadUrl: string): Promise<Buffer> {
    const response = await fetch(downloadUrl, {
      headers: { "User-Agent": "ResourceX" },
    });

    if (!response.ok) {
      throw new ResourceXError(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
