/**
 * Digest utilities for Content-Addressable Storage.
 */
import { createHash } from "node:crypto";

/**
 * Compute SHA-256 digest of data.
 * Returns string in format "sha256:{hex}"
 */
export function computeDigest(data: Buffer): string {
  const hash = createHash("sha256").update(data).digest("hex");
  return `sha256:${hash}`;
}

/**
 * Compute deterministic archive digest from file-level digests.
 * Sorts filenames, concatenates "filename:digest" lines, then SHA-256.
 */
export function computeArchiveDigest(files: Record<string, string>): string {
  const entries = Object.keys(files)
    .sort()
    .map((name) => `${name}:${files[name]}`)
    .join("\n");
  const hash = createHash("sha256").update(entries).digest("hex");
  return `sha256:${hash}`;
}

/**
 * Validate digest format.
 */
export function isValidDigest(digest: string): boolean {
  return /^sha256:[a-f0-9]{64}$/.test(digest);
}
