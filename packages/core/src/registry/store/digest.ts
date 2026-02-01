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
 * Validate digest format.
 */
export function isValidDigest(digest: string): boolean {
  return /^sha256:[a-f0-9]{64}$/.test(digest);
}
