import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FolderSourceLoader } from "~/loader/FolderSourceLoader.js";
import { GitHubSourceLoader } from "~/loader/GitHubSourceLoader.js";
import { SourceLoaderChain } from "~/loader/SourceLoaderChain.js";

const TEST_DIR = join(import.meta.dir, ".test-freshness");

beforeEach(async () => {
  await mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
  await rm(TEST_DIR, { recursive: true, force: true });
});

describe("FolderSourceLoader.isFresh", () => {
  const loader = new FolderSourceLoader();

  test("returns true when no files modified since cachedAt", async () => {
    const dir = join(TEST_DIR, "fresh");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "a.txt"), "hello");

    // Set file mtime to the past
    const past = new Date("2024-01-01T00:00:00Z");
    await utimes(join(dir, "a.txt"), past, past);

    // cachedAt is after the file mtime
    const cachedAt = new Date("2025-01-01T00:00:00Z");
    expect(await loader.isFresh(dir, cachedAt)).toBe(true);
  });

  test("returns false when a file was modified after cachedAt", async () => {
    const dir = join(TEST_DIR, "stale");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "a.txt"), "hello");

    // Set file mtime to the future relative to cachedAt
    const future = new Date("2025-06-01T00:00:00Z");
    await utimes(join(dir, "a.txt"), future, future);

    const cachedAt = new Date("2025-01-01T00:00:00Z");
    expect(await loader.isFresh(dir, cachedAt)).toBe(false);
  });

  test("checks files in subdirectories", async () => {
    const dir = join(TEST_DIR, "nested");
    const subDir = join(dir, "sub");
    await mkdir(subDir, { recursive: true });
    await writeFile(join(dir, "a.txt"), "hello");
    await writeFile(join(subDir, "b.txt"), "world");

    // Set all files to the past
    const past = new Date("2024-01-01T00:00:00Z");
    await utimes(join(dir, "a.txt"), past, past);
    await utimes(join(subDir, "b.txt"), past, past);

    const cachedAt = new Date("2025-01-01T00:00:00Z");
    expect(await loader.isFresh(dir, cachedAt)).toBe(true);

    // Modify the nested file
    const future = new Date("2025-06-01T00:00:00Z");
    await utimes(join(subDir, "b.txt"), future, future);
    expect(await loader.isFresh(dir, cachedAt)).toBe(false);
  });

  test("returns false for non-existent directory", async () => {
    const cachedAt = new Date();
    expect(await loader.isFresh("/nonexistent/path", cachedAt)).toBe(false);
  });
});

describe("GitHubSourceLoader has no isFresh", () => {
  test("isFresh is not defined — treated as always stale", () => {
    const loader = new GitHubSourceLoader();
    expect(loader.isFresh).toBeUndefined();
  });
});

describe("SourceLoaderChain.isFresh", () => {
  test("delegates to matching loader's isFresh", async () => {
    const dir = join(TEST_DIR, "chain-fresh");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "a.txt"), "hello");

    const past = new Date("2024-01-01T00:00:00Z");
    await utimes(join(dir, "a.txt"), past, past);

    const chain = SourceLoaderChain.create();
    const cachedAt = new Date("2025-01-01T00:00:00Z");
    expect(await chain.isFresh(dir, cachedAt)).toBe(true);
  });

  test("returns false for loaders without isFresh", async () => {
    const chain = SourceLoaderChain.create();
    const cachedAt = new Date();
    // GitHub URL — GitHubSourceLoader matches but has no isFresh
    expect(await chain.isFresh("https://github.com/owner/repo/tree/main/path", cachedAt)).toBe(
      false
    );
  });

  test("returns false for unknown sources", async () => {
    const chain = SourceLoaderChain.create();
    const cachedAt = new Date();
    expect(await chain.isFresh("unknown://source", cachedAt)).toBe(false);
  });
});
