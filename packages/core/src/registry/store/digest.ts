/**
 * Digest utilities for Content-Addressable Storage.
 * Uses Web Crypto API for environment-agnostic SHA-256 hashing.
 */

/**
 * Compute SHA-256 digest of data.
 * Returns string in format "sha256:{hex}"
 */
export async function computeDigest(data: Buffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256:${hex}`;
}

/**
 * Compute deterministic archive digest from file-level digests.
 * Sorts filenames, concatenates "filename:digest" lines, then SHA-256.
 */
export async function computeArchiveDigest(files: Record<string, string>): Promise<string> {
  const entries = Object.keys(files)
    .sort()
    .map((name) => `${name}:${files[name]}`)
    .join("\n");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(entries));
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256:${hex}`;
}

/**
 * Validate digest format.
 */
export function isValidDigest(digest: string): boolean {
  return /^sha256:[a-f0-9]{64}$/.test(digest);
}
